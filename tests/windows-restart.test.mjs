import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { windowsRestartLaunchPlan } from '../lib/windows-restart.js';

test('Windows restart helper survives the initiating process and preserves path arguments', {skip:process.platform!=='win32',timeout:20000}, async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"dsh relay 测试's "));
  const script=path.join(dir,'probe.ps1');
  const marker=path.join(dir,'done.json');
  const asar=path.join(dir,'archive with spaces.asar');
  const exe=path.join(dir,'fixture.exe');
  // No process termination, archive mutation, or executable launch in this fixture.
  fs.writeFileSync(script,'\ufeff'+[
    'param([int]$WaitPid,[string]$AsarPath,[string]$ExePath)',
    'Start-Sleep -Milliseconds 1200',
    '$parent = (Get-CimInstance Win32_Process -Filter ("ProcessId=" + $PID)).ParentProcessId',
    '@{waitPid=$WaitPid;asar=$AsarPath;exe=$ExePath;parent=$parent;pid=$PID} | ConvertTo-Json -Compress | Set-Content -LiteralPath (Join-Path $PSScriptRoot "done.json") -Encoding UTF8',
  ].join('\r\n'));
  const input={script,waitPid:999999,asar,exe};
  const plan=windowsRestartLaunchPlan(input);
  assert.match(plan.body,/'s \\|''s /);
  const entry=new URL('../lib/windows-restart.js',import.meta.url).href;
  const child=spawnSync(process.execPath,['--input-type=module','-e',
    'import {launchWindowsRestartHelper} from '+JSON.stringify(entry)+'; console.log(JSON.stringify(launchWindowsRestartHelper('+JSON.stringify(input)+')));'
  ],{encoding:'utf8',windowsHide:true,timeout:16000});
  assert.equal(child.status,0,child.stderr);
  const started=JSON.parse(child.stdout.trim());
  assert.equal(started.scheduled,true);
  const deadline=Date.now()+8000;
  while(!fs.existsSync(marker)&&Date.now()<deadline) await new Promise(resolve=>setTimeout(resolve,100));
  assert(fs.existsSync(marker),'Independent helper failed after initiator exited');
  const result=JSON.parse(fs.readFileSync(marker,'utf8').replace(/^\ufeff/,''));
  assert.equal(result.asar,asar);
  assert.equal(result.exe,exe);
  assert(result.pid>0);
  assert.notEqual(result.parent,child.pid);
});
