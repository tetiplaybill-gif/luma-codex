'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const path=require('node:path');
test('child process inherits the two framed debug streams',async()=>{
  const child=spawn(process.execPath,[path.join(__dirname,'mock-pipe.cjs')],{stdio:['ignore','ignore','pipe','pipe','pipe']});
  try {
    const response=await new Promise((resolve,reject)=>{let data='';const timeout=setTimeout(()=>reject(Error('pipe timeout')),5000);
      child.once('error',reject);child.once('exit',()=>reject(Error('child exited before response')));
      child.stdio[4].on('data',chunk=>{data+=chunk;const i=data.indexOf('\0');if(i>=0){clearTimeout(timeout);resolve(JSON.parse(data.slice(0,i)))}});
      child.stdio[3].write(JSON.stringify({id:41,method:'Target.getTargets'})+'\0');
    });
    assert.deepEqual(response,{id:41,result:{method:'Target.getTargets'}});
  } finally {child.kill()}
});
