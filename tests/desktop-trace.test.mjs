import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import vm from 'node:vm';
import {ALL_PATCHES,applyReplacementsToText} from '../lib/core.js';

for(const newline of ['\n','\r\n']) {
  test(`desktop traces stay single after repeated Apply (${JSON.stringify(newline)})`,()=>{
    const app=new EventEmitter();
    app.getAppPath=()=>'/fixture/app';
    const fakeProcess=new EventEmitter();
    const lines=[];
    const child=new EventEmitter();
    let timers=0;
    Object.assign(fakeProcess,{
      pid:123,versions:{electron:'fixture'},
      getBuiltinModule:name=>name==='node:fs'?{appendFileSync:(_file,line)=>lines.push(line)}:{tmpdir:()=>'/fixture'},
    });
    const close=ALL_PATCHES.find(p=>p.id===92);
    const main=ALL_PATCHES.find(p=>p.id===93);
    // A close callback and single-instance gate as used by the desktop main process.
    let source=`function traceHost() {\n${close.replacements[0].pattern}\n});\n}\ntraceHost.call({stderr:'fixture stderr'});\n${main.replacements[0].pattern} { focusPrimaryWindow(); }`;
    source=source.replaceAll('\n',newline);
    for(let i=0;i<5;i++) {
      const before=source;
      source=applyReplacementsToText(source,close,'main.js').text;
      source=applyReplacementsToText(source,main,'main.js').text;
      if(i>0) assert.equal(source,before,'Apply inserted duplicate diagnostics');
    }
    vm.runInNewContext(source,{
      app,process:fakeProcess,child,rendererConsole:{snapshot:()=>[]},
      claimDesktopSingleInstance:()=>false,focusPrimaryWindow:()=>{},
      setInterval:()=>{timers++;return {unref(){}};},
    });
    assert.equal(timers,1,'Only one heartbeat timer should be installed');
    assert.equal(app.listenerCount('quit'),1);
    assert.equal(fakeProcess.listenerCount('uncaughtExceptionMonitor'),1);
    assert.equal(child.listenerCount('close'),1);
    child.emit('close',0,null);
    app.emit('quit',{},0);
    assert.equal(lines.filter(s=>s.includes('[desktop.hostExit]')).length,1);
    assert.equal(lines.filter(s=>s.includes('quit code=0')).length,1);
  });
}
