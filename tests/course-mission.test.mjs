import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCourseMission} from '../server/course-mission.js';
test('course mission sorts assignments and excludes expired work',()=>{
 const now=new Date('2026-11-07T12:00:00Z');
 const data=buildCourseMission([
  {id:1,course:'Biology',title:'Final',dueAt:'2026-11-14T12:00:00Z',url:'https://school.example/a'},
  {id:2,course:'Criminal Justice',title:'Quiz',dueAt:'2026-11-08T12:00:00Z'},
  {id:3,course:'History',title:'Old work',dueAt:'2026-11-01T12:00:00Z'}
 ],now);
 assert.equal(data.totalUpcoming,2);
 assert.equal(data.dueThisWeek,2);
 assert.deepEqual(data.tasks.map(t=>t.id),['2','1']);
 assert.equal(data.tasks[0].priority,'urgent');
 assert.equal(data.tasks[1].url,'https://school.example/a');
 assert.match(data.nextAction,/Quiz/);
});
test('empty course mission does not invent deadlines',()=>{
 const data=buildCourseMission([],new Date('2026-11-07T12:00:00Z'));
 assert.equal(data.totalUpcoming,0);
 assert.equal(data.tasks.length,0);
 assert.match(data.nextAction,/No upcoming/);
});
test('invalid or undated assignments are skipped',()=>{
 const data=buildCourseMission([null,{id:'x',title:'Undated',dueAt:'not-a-date'}],new Date('2026-11-07T12:00:00Z'));
 assert.equal(data.totalUpcoming,0);
});
