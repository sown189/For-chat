// Local beta: OAuth credentials take precedence over legacy environment tokens.
// Never silently fall back to a different student's legacy token after OAuth disconnect.
export function resolveCanvasCredential({oauthAvailable,oauthConnected,oauthToken,legacyToken}){
 if(oauthAvailable){
  if(!oauthConnected)return null;
  if(typeof oauthToken!=='string'||!oauthToken)return null;
  return oauthToken;
 }
 return typeof legacyToken==='string'&&legacyToken?legacyToken:null;
}
export function canvasConnectionStatus({oauthAvailable,oauthConnected,legacyToken}){
 return {connected:oauthAvailable?!!oauthConnected:!!legacyToken,mode:oauthAvailable?'oauth':legacyToken?'legacy-token':'none'};
}
