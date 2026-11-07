import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlToText,assignmentContext,buildGroundedStudyGuide} from '../server/course-context.js';
test('Canvas assignment HTML is converted to readable text without scripts',()=>{
 const text=htmlToText('<h2>Essay</h2><p>Explain due process &amp; equal protection.</p><script>alert("secret")</script><p>Use two cases.</p>');
 assert.match(text,/Explain due process & equal protection/);
 assert.doesNotMatch(text,/alert|<p>/);
});
test('assignment brief is grounded in returned Canvas description',()=>{
 const context=assignmentContext({id:14,name:'Case analysis',description:'Explain the holding of two Supreme Court cases. Cite the assigned textbook.',html_url:'https://canvas.example/courses/3/assignments/14'},3);
 const guide=buildGroundedStudyGuide(context);
 assert.equal(context.courseId,'3');
 assert.equal(guide.sourceUrl,context.url);
 assert.match(guide.requirements.join(' '),/Supreme Court cases/);
});
test('missing description produces limitation rather than invented requirements',()=>{
 const guide=buildGroundedStudyGuide(assignmentContext({id:15,name:'Quiz',description:''},3));
 assert.equal(guide.requirements.length,0);
 assert.equal(guide.limited,true);
});
