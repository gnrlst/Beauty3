import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import E from './engine.cjs';
import P from './policy.cjs';
type Member={id:string;email:string;name:string;company:string;role:string;user_id:string|null;active:number;is_owner:number};
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export class HttpError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
export function database(){if(!env.DB)throw new HttpError('База данных не подключена',503);return env.DB;}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new HttpError('Запрос должен исходить из приложения',403);if(!(req.headers.get('content-type')||'').startsWith('application/json'))throw new HttpError('Ожидается JSON',415);}
export async function identity(){const user=await getChatGPTUser();if(!user)throw new HttpError('Войдите через ChatGPT',401);const db=database(),email=user.email.toLowerCase();
 const count=await db.prepare('SELECT COUNT(*) AS n FROM members WHERE is_owner=1').first<{n:number}>();
 if(!count?.n&&env.OWNER_EMAIL&&email===env.OWNER_EMAIL.toLowerCase()){
  const initial=E.empty();initial.partners=[];const now=new Date().toISOString();
  await db.batch([db.prepare('INSERT OR IGNORE INTO business_state(id,data,revision,updated_at) VALUES(?,?,0,?)').bind('main',JSON.stringify(initial),now),db.prepare('INSERT INTO members(id,email,name,company,role,user_id,active,is_owner,created_at) SELECT ?,?,?,?,?,?,1,1,? WHERE NOT EXISTS(SELECT 1 FROM members WHERE is_owner=1)').bind('owner',email,user.displayName,'main','Руководитель',user.userId,now),db.prepare("INSERT OR IGNORE INTO audit(id,user_id,email,company,action,object_id,details,created_at) SELECT 'owner.initial',user_id,email,company,'owner.created',id,json_object('before',NULL,'after',json_object('id',id,'email',email,'name',name,'company',company,'role',role,'user_id',user_id,'active',active,'is_owner',is_owner)),? FROM members WHERE id='owner' AND user_id=?").bind(now,user.userId)]);
 }
 let records=(await db.prepare('SELECT * FROM members WHERE lower(email)=? AND active=1').bind(email).all<Member>()).results;
 if(!records.length)throw new HttpError('Доступ не назначен. Руководитель должен добавить ваш email в список сотрудников.',403);
 for(const m of records){if(m.user_id&&m.user_id!==user.userId)throw new HttpError('Учётная запись не соответствует назначенному доступу',403);if(!m.user_id)await db.batch([db.prepare('UPDATE members SET user_id=? WHERE id=? AND user_id IS NULL AND active=1').bind(user.userId,m.id),db.prepare("INSERT OR IGNORE INTO audit(id,user_id,email,company,action,object_id,details,created_at) SELECT ?,user_id,email,company,'auth.first_login',id,?,? FROM members WHERE id=? AND user_id=?").bind('login:'+m.id,JSON.stringify({before:{user_id:null},after:{user_id:user.userId}}),new Date().toISOString(),m.id,user.userId)]);}
 records=(await db.prepare('SELECT * FROM members WHERE user_id=? AND active=1').bind(user.userId).all<Member>()).results;
 return {user,members:records};
}
export async function readLedger(){const row=await database().prepare('SELECT * FROM business_state WHERE id=?').bind('main').first<{data:string;revision:number;last_operation:string|null}>();if(!row)throw new HttpError('Руководитель ещё не активировал базу',503);return {state:JSON.parse(row.data),revision:row.revision,lastOperation:row.last_operation};}
export function access(s:any,m:any[],company:string){return P.scope(s,m,company);}
export async function responseState(auth:any,company:string){const current=await readLedger(),a=access(current.state,auth.members,company);const companies=[...new Map(auth.members.map((m:any)=>[m.company,{id:m.company,name:m.company==='main'?'Главная компания':current.state.partners.find((p:any)=>p.id===m.company)?.name||m.company}])).values()];if(a.owner)for(const p of current.state.partners)if(!companies.some((c:any)=>c.id===p.id))companies.push({id:p.id,name:p.name});return {state:P.redact(current.state,a),revision:current.revision,access:a,user:{id:auth.user.userId,email:auth.user.email,name:auth.user.displayName},companies};}
export async function persist(auth:any,a:any,data:any,revision:number,operationId:string,kind:string,objectId:string|null,details:any){const db=database(),now=new Date().toISOString();const auditDetails=JSON.stringify(details);const results=await db.batch([
 db.prepare('UPDATE business_state SET data=?,revision=revision+1,last_operation=?,updated_at=? WHERE id=? AND revision=? RETURNING revision').bind(JSON.stringify(data),operationId,now,'main',revision),
 db.prepare('INSERT OR IGNORE INTO audit(id,user_id,email,company,action,object_id,details,created_at) SELECT ?,?,?,?,?,?,?,? FROM business_state WHERE id=? AND last_operation=?').bind(operationId,auth.user.userId,auth.user.email,a.company,kind,objectId,auditDetails,now,'main',operationId)
 ]);if(!results[0].results?.length)throw new HttpError('Данные изменил другой сотрудник. Обновите страницу и повторите операцию.',409);}
export async function safe(fn:()=>Promise<Response>){try{return await fn();}catch(e:any){console.error('HairFlow API:',e.status||500,e.message);return json({error:e.status?e.message:'Не удалось выполнить операцию. '+(e.message||'')},e.status||400);}}
export async function body(req:Request){const text=await req.text();if(text.length>100000)throw new HttpError('Слишком большой запрос',413);try{return JSON.parse(text);}catch{throw new HttpError('Некорректный JSON');}}
export { E,P };
