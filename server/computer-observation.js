// Browser observations are read-only snapshots, separate from proposals and execution.
export async function captureBrowserObservation(page,{quality=70}={}){
 const [url,title,buffer]=await Promise.all([
  Promise.resolve(page.url()),
  page.title().catch(()=> ''),
  page.screenshot({type:'jpeg',quality})
 ]);
 return {url,title,screen:'data:image/jpeg;base64,'+buffer.toString('base64'),observedAt:new Date().toISOString()};
}
