// Read the latest Sites service token only through hidden stdin; never persist it.
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for backup JSON on stdin (input is hidden).\n');
const input=await new Promise((resolve,reject)=>{let text='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{if(chunk.includes('\u0003'))reject(Error('Cancelled'));text+=chunk;if(text.includes('\n')){process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);resolve(text.slice(0,text.indexOf('\n')));}});process.stdin.on('end',()=>reject(Error('Missing input')));});
const {token,url}=JSON.parse(input);if(new URL(url).origin!=='https://hairflow-accounting.bronzeduck2.chatgpt.site'||new URL(url).pathname!=='/api/backups/run')throw Error('Unexpected backup destination');
const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(60000),headers:{'OAI-Sites-Authorization':'Bearer '+token}});const data=await response.json();if(!response.ok)throw Error('Backup failed ('+response.status+'): '+(data.error||'unknown'));
if(!data.key||!/^\w{64}$/.test(data.sha256)||!data.counts)throw Error('Invalid backup acknowledgement');console.log(JSON.stringify(data));
