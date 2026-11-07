import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAnswers,validateBenchmark} from '../scripts/benchmark-core.mjs';

const questions=[{id:'q1',question:'What is 2 + 2?',options:['3','4','5'],answer:'B'},{id:'q2',question:'What is 3 + 3?',options:['5','6'],answer:'B'}];
test('verified answer benchmark calculates correct and incorrect responses',()=>{
 validateBenchmark(questions);
 const result=scoreAnswers(questions,[{id:'q1',answer:'B'},{id:'q2',answer:'A'}]);
 assert.equal(result.total,2);assert.equal(result.correct,1);assert.equal(result.accuracy,0.5);
});
test('benchmark counts missing predictions as incorrect',()=>{
 assert.equal(scoreAnswers(questions,[]).accuracy,0);
});
test('benchmark rejects invalid answer keys',()=>{
 assert.throws(()=>validateBenchmark([{...questions[0],answer:'D'}]));
});
