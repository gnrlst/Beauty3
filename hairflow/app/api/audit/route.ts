import {safe,json,identity,readLedger,access,database,HttpError} from '../../../lib/service';
export const dynamic='force-dynamic';
// Audit has no employee-facing UI. This endpoint is reserved for the main owner.
export async function GET(req:Request){return safe(async()=>{const auth=await identity(),current=await readLedger(),params=new URL(req.url).searchParams,company=params.get('company')||'main',a=access(current.state,auth.members,company);if(!a.owner)throw new HttpError('Журнал доступен только владельцу',403);return json({entries:(await database().prepare('SELECT * FROM audit WHERE company=? ORDER BY created_at DESC LIMIT 100').bind(company).all()).results});});}
