import { safe,json,identity,responseState } from '../../../lib/service';
export const dynamic='force-dynamic';
export async function GET(req:Request){return safe(async()=>{const auth=await identity();const company=new URL(req.url).searchParams.get('company')||auth.members[0].company;return json(await responseState(auth,company));});}
