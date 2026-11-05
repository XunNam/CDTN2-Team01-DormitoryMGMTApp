import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';

// Run the actual Next.js rewrite against the fixture's real Express server and PG store.
export async function startFrontend(backendOrigin: string, origin: string) {
  const root=fileURLToPath(new URL('../../../../frontend/',import.meta.url));
  const next=fileURLToPath(new URL('../../../../frontend/node_modules/next/dist/bin/next',import.meta.url));
  const url=new URL(origin);
  // Refuse to reuse an unrelated app already listening on our test port.
  const probe=createServer();
  await new Promise<void>((resolve,reject)=>{probe.once('error',reject);probe.listen(Number(url.port),url.hostname,resolve);});
  await new Promise<void>(resolve=>probe.close(()=>resolve()));
  const child=spawn(process.execPath,[next,'dev','--webpack','--hostname',url.hostname,'--port',url.port],{
    cwd:root,env:{...process.env,BACKEND_ORIGIN:backendOrigin,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true,
  });
  let output=''; let failure: Error | undefined;
  child.on('error',error=>{failure=error;});
  child.stdout.on('data',chunk=>{output=(output+chunk).slice(-4000);});
  child.stderr.on('data',chunk=>{output=(output+chunk).slice(-4000);});
  const close=async()=>{if(child.exitCode===null && child.pid){child.kill();await once(child,'exit');}};
  try {
    for(let attempt=0;attempt<120;attempt++) {
      if(failure) throw failure;
      if(child.exitCode!==null) throw new Error('Frontend exited: '+output);
      try { const response=await fetch(origin+'/api/v1/auth/csrf',{signal:AbortSignal.timeout(1000)});
        if(response.ok && (await response.json()).data?.csrfToken) return {close};
      } catch { /* Wait for Next.js to start listening. */ }
      await new Promise(resolve=>setTimeout(resolve,500));
    }
    throw new Error('Frontend proxy readiness timed out: '+output);
  } catch(error) {await close();throw error;}
}

export async function verifyBrowserLogins(origin:string, accounts:Array<{kind:'STAFF'|'STUDENT';identifier:string;password:string;path:string;heading:string}>) {
  const require=createRequire(new URL('../../../../frontend/package.json',import.meta.url));
  const {chromium,expect}=require('@playwright/test');
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  try {
    for(const account of accounts) {
      const context=await browser.newContext();
      try {
        const page=await context.newPage();
        await page.goto(origin+'/login');
        await page.getByRole('radio',{name:account.kind==='STAFF'?'Nhân sự':'Sinh viên',exact:true}).check();
        await page.getByLabel(account.kind==='STAFF'?'Tên đăng nhập':'Mã số sinh viên',{exact:true}).fill(account.identifier);
        await page.getByLabel('Mật khẩu',{exact:true}).fill(account.password);
        await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
        await page.waitForURL(origin+account.path,{timeout:60000});
        const response=await page.goto(origin+account.path);
        if(!response?.ok()) throw new Error('Protected page failed: '+account.path);
        await expect(page.getByRole('heading',{name:account.heading,exact:true})).toBeVisible({timeout:30000});
        const me=await page.request.get(origin+'/api/v1/auth/me');
        if(me.status()!==200) throw new Error('Browser session cookie did not reach backend');
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
