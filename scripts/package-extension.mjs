import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const dir='extension', names=['manifest.json','operator.js','popup.js','popup.html','popup.css','README.md'];
const read=n=>fs.readFileSync(path.join(dir,n));
const m=JSON.parse(read('manifest.json'));assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['activeTab','scripting','sidePanel']);assert.equal(m.side_panel.default_path,'popup.html?panel=1');assert.equal(m.action.default_popup,'popup.html');
const scope=vm.createContext({});new vm.Script(read('operator.js').toString()).runInContext(scope);new vm.Script(read('popup.js').toString());
const plan=(cmd,targets)=>JSON.parse(JSON.stringify(scope.commandPlan(cmd,targets)));
const t=[{id:0,label:'Courses',kind:'click',href:''},{id:1,label:'Search',kind:'search',href:''}];
assert.equal(plan('click Courses',t).target.id,0);assert.equal(plan('scroll down',t).direction,'down');assert.equal(plan('search for biology',t).text,'biology');assert.ok(plan('delete files',t).error);assert.ok(plan('click unknown',t).error);
const html=read('popup.html').toString();for(const id of ['connect','stop','capture','plan','targets','click','refresh','up','down','approve','cancel','review','proposal','command','status','screen','page','panel','activity'])assert.ok(html.includes('id="'+id+'"'),id);
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
const local=[],central=[];let offset=0;
for(const n of names){const name=Buffer.from('finessers-chrome/'+n),data=read(n),crc=crc32(data);const l=Buffer.alloc(30);l.writeUInt32LE(0x04034b50);l.writeUInt16LE(20,4);l.writeUInt16LE(33,12);l.writeUInt32LE(crc,14);l.writeUInt32LE(data.length,18);l.writeUInt32LE(data.length,22);l.writeUInt16LE(name.length,26);
const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);local.push(l,name,data);central.push(c,name);offset+=l.length+name.length+data.length}
const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(names.length,8);end.writeUInt16LE(names.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
fs.mkdirSync('public',{recursive:true});fs.writeFileSync('public/Finessers-Chrome-Operator.zip',Buffer.concat([...local,cd,end]));console.log('FINESSERS extension: manifest, syntax, command tests PASS; ZIP packaged.');