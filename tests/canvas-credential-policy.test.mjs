import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCanvasCredential,canvasConnectionStatus} from '../server/canvas-credential-policy.js';
test('OAuth always takes precedence over legacy Canvas credentials',()=>{
 assert.equal(resolveCanvasCredential({oauthAvailable:true,oauthConnected:true,oauthToken:'oauth-student',legacyToken:'other-student'}),'oauth-student');
 assert.equal(resolveCanvasCredential({oauthAvailable:true,oauthConnected:false,oauthToken:null,legacyToken:'other-student'}),null);
 assert.equal(resolveCanvasCredential({oauthAvailable:true,oauthConnected:true,oauthToken:null,legacyToken:'other-student'}),null);
});
test('legacy token works only when OAuth is not configured',()=>{
 assert.equal(resolveCanvasCredential({oauthAvailable:false,oauthConnected:false,legacyToken:'legacy'}),'legacy');
 assert.equal(resolveCanvasCredential({oauthAvailable:false,oauthConnected:false,legacyToken:''}),null);
});
test('connection status never reports a legacy account as OAuth-connected',()=>{
 assert.deepEqual(canvasConnectionStatus({oauthAvailable:true,oauthConnected:false,legacyToken:'legacy'}),{connected:false,mode:'oauth'});
 assert.deepEqual(canvasConnectionStatus({oauthAvailable:false,oauthConnected:false,legacyToken:'legacy'}),{connected:true,mode:'legacy-token'});
});
