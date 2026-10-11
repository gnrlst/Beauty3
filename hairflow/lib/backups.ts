import { env } from 'cloudflare:workers';
import { database,HttpError,identity } from './service';
import F from './backup-format.cjs';
const PREFIX='hairflow-backups/',PROJECT='appgprj_6acb6d2d738081918d612c3a00ac3165';
const quote=(s:string)=>'"'+s.replaceAll('"','""')+'"';
function bucket(){if(!env.BUCKET)throw new HttpError('Хранилище копий не подключено',503);return env.BUCKET;}
async function digest(text:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function verifyBackup(text:string){const doc=JSON.parse(text);F.validatePayload(doc.payload);if(doc.sha256!==await digest(JSON.stringify(doc.payload)))throw new HttpError('Контрольная сумма копии не совпала',500);return doc;}
export async function requireBackupOwner(){const a=await identity();if(!a.members.some(m=>m.company==='main'&&m.is_owner===1&&m.active===1))throw new HttpError('Копии доступны только владельцу главной компании',403);return a;}
export async function capture(){const db=database(),schemaSql="SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('table','index') AND sql IS NOT NULL ORDER BY type,name";
 const initial=(await db.prepare(schemaSql).all()).results as any[];
 // Include application and migration tables; exclude SQLite/Cloudflare runtime internals.
 const names=initial.filter(x=>x.type==='table'&&!x.name.startsWith('sqlite_')&&!x.name.toLowerCase().startsWith('_cf')).map(x=>x.name);
 const statements=[db.prepare(schemaSql)];for(const name of names){statements.push(db.prepare('PRAGMA table_info('+quote(name)+')'));statements.push(db.prepare('SELECT * FROM '+quote(name)));}const batch=await db.batch(statements),schema=batch[0].results as any[];
 if(JSON.stringify(initial)!==JSON.stringify(schema))throw new HttpError('Структура базы изменилась во время копирования. Повторите запуск.',409);
 const tables=names.map((name:string,i:number)=>({name,sql:schema.find(x=>x.type==='table'&&x.name===name)?.sql,columns:(batch[1+i*2].results as any[]).map(c=>c.name),rows:batch[2+i*2].results}));return F.validatePayload({format:F.FORMAT,version:F.VERSION,project:PROJECT,created_at:new Date().toISOString(),tables,indexes:schema.filter(x=>x.type==='index'&&names.includes(x.tbl_name)).map(x=>({name:x.name,table:x.tbl_name,sql:x.sql}))});}
function metadata(key:string,doc:any){return {key,created_at:doc.payload.created_at,sha256:doc.sha256,counts:F.counts(doc.payload),retention_days:30};}
async function objects(){let cursor:string|undefined,items:R2Object[]=[];do{const page=await bucket().list({prefix:PREFIX,limit:1000,cursor});items.push(...page.objects);cursor=page.truncated?page.cursor:undefined;}while(cursor);return items;}
export async function listBackups(){return (await objects()).map(o=>({key:o.key,size:o.size,created_at:o.uploaded.toISOString()})).sort((a,b)=>b.created_at.localeCompare(a.created_at));}
export async function readBackup(key:string){if(!/^hairflow-backups\/(daily-\d{4}-\d{2}-\d{2}|manual-[\w-]+)\.json$/.test(key))throw new HttpError('Некорректный номер копии');const obj=await bucket().get(key);if(!obj)throw new HttpError('Копия не найдена',404);const text=await obj.text(),doc=await verifyBackup(text);return {text,doc};}
export async function makeBackup(manual=false){const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),key=PREFIX+(manual?'manual-'+crypto.randomUUID():'daily-'+day)+'.json';
 const existing=await bucket().get(key);if(existing){const doc=await verifyBackup(await existing.text());return {...metadata(key,doc),reused:true};}
 const payload=await capture(),doc={payload,sha256:await digest(JSON.stringify(payload))},text=JSON.stringify(doc);await bucket().put(key,text,{httpMetadata:{contentType:'application/json'},customMetadata:{sha256:doc.sha256,format:F.FORMAT}});
 const verified=await readBackup(key);if(verified.text!==text)throw new HttpError('Копия не прошла проверку чтения',500);
 // Delete expired copies only after a new copy has been stored and verified.
 const cutoff=Date.now()-30*86400000;const expired=(await objects()).filter(o=>o.key!==key&&o.uploaded.getTime()<cutoff&&/^hairflow-backups\/(daily-\d{4}-\d{2}-\d{2}|manual-[\w-]+)\.json$/.test(o.key)).map(o=>o.key);for(let i=0;i<expired.length;i+=100)await bucket().delete(expired.slice(i,i+100));return {...metadata(key,doc),reused:false};}
