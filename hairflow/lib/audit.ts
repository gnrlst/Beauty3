import { database } from './service';
export async function recordAudit(auth:any,company:string,action:string,objectId:string|null,details:any,id=crypto.randomUUID()){
 await database().prepare('INSERT OR IGNORE INTO audit(id,user_id,email,company,action,object_id,details,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,auth.user.userId,auth.user.email,company,action,objectId,JSON.stringify(details??{}),new Date().toISOString()).run();
}
