'use strict';
const fs=require('node:fs');
const input=fs.createReadStream(null,{fd:3,autoClose:false});const output=fs.createWriteStream(null,{fd:4,autoClose:false});let buffer='';
input.on('data',chunk=>{buffer+=chunk.toString();let end;while((end=buffer.indexOf('\0'))!==-1){const request=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);output.write(JSON.stringify({id:request.id,result:{method:request.method}})+'\0')}});
