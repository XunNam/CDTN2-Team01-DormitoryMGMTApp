import type { Page, Route } from "@playwright/test";
import type { Account, AccountCreate, ProfileCandidate } from "../src/lib/admin/types";
import type { Role } from "../src/lib/auth/types";

const uuid = (n: number) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
export const STUDENT_ID = uuid(1);
export const ADMIN_ID = uuid(5);
export const TOKEN = "a".repeat(64);
export const ROTATED = "b".repeat(64);
interface Captured { path: string; method: string; body: Record<string, unknown> | null; headers: Record<string, string> }
export async function mockApi(page: Page, options: { role?: Role; createMode?: "lost" | "csrf"; lockConflict?: boolean; passwordUnknown?: boolean; createDelay?: number } = {}) {
  const role = options.role ?? "ADMIN";
  const names = ["Sinh viên mẫu A","Nhân sự mẫu B","Sinh viên mẫu C","Sinh viên mẫu D","Quản trị viên mẫu","Quản trị viên mẫu E","Sinh viên mẫu F","Sinh viên mẫu G","Nhân sự mẫu H","Sinh viên mẫu I","Nhân sự mẫu K","Sinh viên mẫu L"];
  const users = ["SV0001","quanly.demo","SV0002","SV0003","admin.demo","admin.khac","SV0004","SV0005","quanly.phu","SV0006","quanly.toa","SV0010"];
  const roles: Role[] = ["SV","BQL","SV","SV","ADMIN","ADMIN","SV","SV","BQL","SV","BQL","SV"];
  const state = {
    accounts: names.map((displayName, i): Account => ({
      id: uuid(i+1), actorKind: roles[i] === "SV" ? "STUDENT" : "STAFF", role: roles[i],
      identifier: users[i], displayName, studentId: roles[i] === "SV" ? uuid(i+1000) : null,
      isLocked: [2,5,8,11].includes(i), createdAt:"2026-11-02T02:00:00.000Z", updatedAt:"2026-11-02T02:00:00.000Z",
    })),
    candidates: Array.from({length:7},(_,i): ProfileCandidate => ({id:uuid(i+2000),studentCode:"SV"+String(i+20).padStart(4,"0"),fullName:"Sinh viên minh họa "+String.fromCharCode(77+i),hasAccount:false})),
    calls: [] as Captured[],
    csrf: TOKEN, session: true, expired: false, createMode: options.createMode, lockConflict: options.lockConflict ?? false,
  };
  const error = (route: Route, status: number, code: string) => route.fulfill({ status, json: { error: { code, message: "Mock error" } } });
  const current = () => state.accounts.find(a=>a.id===ADMIN_ID)!;
  const identity = () => ({actorKind:"STAFF",accountId:ADMIN_ID,role,identifier:"admin.demo",displayName:"Quản trị viên mẫu",studentId:null});
  await page.route("**/api/v1/**", async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname, method = req.method();
    const body = req.postData() ? req.postDataJSON() as Record<string, unknown> : null;
    state.calls.push({path,method,body,headers:req.headers()});
    if (path === "/api/v1/auth/me") {
      if (!state.session) return error(route,401,"AUTH_REQUIRED");
      if (state.expired) return error(route,401,"SESSION_EXPIRED");
      if (current().isLocked) return error(route,401,"ACCOUNT_LOCKED");
      return route.fulfill({json:{data:identity()}});
    }
    if (path === "/api/v1/auth/csrf") return route.fulfill({json:{data:{csrfToken:state.csrf}}});
    if (method !== "GET" && (req.headers()["x-csrf-token"] !== state.csrf || req.headers()["content-type"] !== "application/json")) return error(route,403,"CSRF_INVALID");
    if (path === "/api/v1/auth/logout" && method === "POST") {
      if (JSON.stringify(body)!=="{}") return error(route,422,"VALIDATION_ERROR");
      state.session=false;return route.fulfill({status:204,body:""});
    }
    if (path === "/api/v1/auth/login" && method === "POST") {
      if (body?.accountType!=="STAFF"||body?.identifier!=="admin.demo") return error(route,401,"INVALID_CREDENTIALS");
      state.session=true;state.expired=false;state.csrf=ROTATED;
      return route.fulfill({json:{data:identity()}});
    }
    if (!state.session) return error(route,401,"AUTH_REQUIRED");
    if (state.expired) return error(route,401,"SESSION_EXPIRED");
    if (current().isLocked) return error(route,401,"ACCOUNT_LOCKED");
    if (path === "/api/v1/auth/change-password") {
      if (Object.keys(body??{}).sort().join(",")!=="currentPassword,newPassword") return error(route,422,"VALIDATION_ERROR");
      state.csrf=ROTATED;
      if (options.passwordUnknown) return error(route,503,"SERVICE_UNAVAILABLE");
      return route.fulfill({status:204,body:""});
    }
    if (role!=="ADMIN") return error(route,403,"FORBIDDEN");
    const paginate = (items: unknown[]) => {
      const pageNumber=Number(url.searchParams.get("page")??1),pageSize=Number(url.searchParams.get("pageSize")??20);
      return {data:items.slice((pageNumber-1)*pageSize,pageNumber*pageSize),meta:{page:pageNumber,pageSize,totalItems:items.length,totalPages:Math.ceil(items.length/pageSize)}};
    };
    if(path==="/api/v1/admin/student-profiles/candidates"){
      const q=(url.searchParams.get("q")??"").toLowerCase();
      return route.fulfill({json:paginate(state.candidates.filter(c=>(c.studentCode+" "+c.fullName).toLowerCase().includes(q)))});
    }
    if(path==="/api/v1/admin/accounts"&&method==="GET"){
      const q=(url.searchParams.get("q")??"").toLowerCase(),source=url.searchParams.get("actorKind"),filterRole=url.searchParams.get("role"),locked=url.searchParams.get("isLocked");
      const items=state.accounts.filter(a=>(a.identifier+" "+a.displayName).toLowerCase().includes(q)&&(!source||a.actorKind===source)&&(!filterRole||a.role===filterRole)&&(locked===null||String(a.isLocked)===locked));
      return route.fulfill({json:paginate(items)});
    }
    if(path==="/api/v1/admin/accounts"&&method==="POST"){
      if(state.createMode==="csrf"){state.createMode=undefined;state.csrf=ROTATED;return error(route,403,"CSRF_INVALID");}
      const input=body as unknown as AccountCreate;
      let created:Account;
      if(input.accountType==="STUDENT"){
        if(Object.keys(input).sort().join(",")!=="accountType,password,role,studentId")return error(route,422,"VALIDATION_ERROR");
        const candidate=state.candidates.find(c=>c.id===input.studentId);
        if(!candidate)return error(route,409,"ACCOUNT_ALREADY_EXISTS");
        created={id:uuid(state.accounts.length+100),actorKind:"STUDENT",identifier:candidate.studentCode,displayName:candidate.fullName,role:"SV",studentId:candidate.id,isLocked:false,createdAt:"2026-11-03T12:00:00.000Z",updatedAt:"2026-11-03T12:00:00.000Z"};
        state.candidates=state.candidates.filter(c=>c.id!==candidate.id);
      }else{
        if(Object.keys(input).sort().join(",")!=="accountType,displayName,password,role,username")return error(route,422,"VALIDATION_ERROR");
        if(state.accounts.some(a=>a.actorKind==="STAFF"&&a.identifier===input.username))return error(route,409,"DUPLICATE_USERNAME");
        created={id:uuid(state.accounts.length+100),actorKind:"STAFF",identifier:input.username,displayName:input.displayName,role:input.role,studentId:null,isLocked:false,createdAt:"2026-11-03T12:00:00.000Z",updatedAt:"2026-11-03T12:00:00.000Z"};
      }
      state.accounts.unshift(created);
      if(options.createDelay)await new Promise(r=>setTimeout(r,options.createDelay));
      if(state.createMode==="lost"){state.createMode=undefined;return route.abort("failed");}
      return route.fulfill({status:201,json:{data:created}});
    }
    const match=path.match(/^\/api\/v1\/admin\/accounts\/(STUDENT|STAFF)\/([a-f0-9-]+)(\/lock)?$/i);
    if(match){
      const a=state.accounts.find(a=>a.actorKind===match[1]&&a.id===match[2]);
      if(!a)return error(route,404,"NOT_FOUND");
      if(method==="GET")return route.fulfill({json:{data:a}});
      if(method==="PATCH"&&match[3]){
        if(Object.keys(body??{}).join(",")!=="isLocked"||typeof body?.isLocked!=="boolean")return error(route,422,"VALIDATION_ERROR");
        if(state.lockConflict){state.lockConflict=false;a.isLocked=body.isLocked;return error(route,409,"INVALID_STATE");}
        if(a.isLocked===body.isLocked)return error(route,409,"INVALID_STATE");
        a.isLocked=body.isLocked;a.updatedAt="2026-11-03T12:00:00.000Z";
        return route.fulfill({json:{data:a}});
      }
    }
    return error(route,404,"NOT_FOUND"); // Never forward a test call to the real backend.
  });
  return state;
}
