import {safe,json,identity,readLedger,access,body,sameOrigin,HttpError,P} from '../../../lib/service';
import {recordAudit} from '../../../lib/audit';
import A from '../../../lib/audit.cjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){return safe(async()=>{sameOrigin(req);const auth=await identity(),d=await body(req),current=await readLedger(),a=access(current.state,auth.members,String(d.company));if(typeof d.eventId!=='string'||!d.eventId||d.eventId.length>100)throw new HttpError('Нет номера события');const details=A.activity(a,d);let objectId=null;if(d.objectId){if(typeof d.objectId!=='string'||d.objectId.length>100)throw new HttpError('Некорректный объект');P.checkTail(current.state,d.objectId,a);objectId=d.objectId;}await recordAudit(auth,a.company,d.action,objectId,{...details,source:'browser'},'ui:'+auth.user.userId+':'+d.eventId);return json({ok:true});});}
