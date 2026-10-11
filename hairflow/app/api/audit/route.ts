import { safe,json,identity,readLedger,access,database,P } from '../../../lib/service';
export const dynamic='force-dynamic';
export async function GET(req:Request){return safe(async()=>{const auth=await identity(),current=await readLedger(),company=new URL(req.url).searchParams.get('company')||auth.members[0].company,a=access(current.state,auth.members,company);P.authorize(a,'members');return json({entries:(await database().prepare('SELECT id,email,company,action,object_id,created_at FROM audit WHERE company=? ORDER BY created_at DESC LIMIT 100').bind(company).all()).results});});}
