import { safe,json,identity,responseState,readLedger,access,persist,sameOrigin,body,HttpError,P,E,database } from '../../../lib/service';
import { recordAudit } from '../../../lib/audit';
import A from '../../../lib/audit.cjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){return safe(async()=>{
 sameOrigin(req);const auth=await identity(),d=await body(req),current=await readLedger();let a:any;
 try{
 a=access(current.state,auth.members,String(d.company));
 if(!['purchase','process','move','sell','settings','partner','payment','return'].includes(d.kind))throw new HttpError('Неизвестная операция');if(typeof d.operationId!=='string'||d.operationId.length>100||!d.operationId)throw new HttpError('Нет идентификатора операции');
 const prior=await database().prepare('SELECT id,user_id,company FROM audit WHERE id=?').bind(d.operationId).first<any>();if(prior){if(prior.user_id!==auth.user.userId||prior.company!==a.company)throw new HttpError('Конфликт идентификатора операции',409);await recordAudit(auth,a.company,'operation.retry',null,{operationId:d.operationId,kind:d.kind});return json(await responseState(auth,a.company));}
 if(d.revision!==current.revision)throw new HttpError('Есть более новые изменения. Обновите данные и повторите операцию.',409);
 const state=E.copy(current.state),eventCount=state.events.length,result=P.apply(state,a,d.kind,d.data||{});for(const e of state.events.slice(eventCount)){e.company=a.company;e.actor=auth.user.displayName;e.userId=auth.user.userId;}
 await persist(auth,a,state,current.revision,d.operationId,d.kind,result?.id||d.data?.tail||null,{input:d.data,before:A.operationSnapshot(current.state,a,d.kind,d.data||{}),after:A.operationSnapshot(state,a,d.kind,d.data||{},result),resultId:result?.id,revisionBefore:current.revision,revisionAfter:current.revision+1});return json(await responseState(auth,a.company));
 }catch(e:any){await recordAudit(auth,a?.company||auth.members[0].company,'operation.failed',null,{kind:String(d.kind||'').slice(0,50),operationId:String(d.operationId||'').slice(0,100),input:d.data||null,requestedCompany:String(d.company||'').slice(0,100),reason:String(e.message||'').slice(0,500),status:e.status||400});throw e;}
 });}
