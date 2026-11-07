import { loadEnvFile } from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { childEnvironment } from './run-tests.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const envFile=new URL('../.env.test',import.meta.url);
if(existsSync(envFile)) loadEnvFile(envFile);
const env=childEnvironment('system',process.env);
env.TEST_FRONTEND_ORIGIN='http://localhost:3200';
const result=spawnSync(process.execPath,['--import','tsx','--test','tests/system/backendFlow.test.ts'],{
  cwd:root,env,stdio:'inherit',windowsHide:true,
});
if(result.error) throw result.error;
process.exitCode=result.status ?? 1;
