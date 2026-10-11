import { safe,json,sameOrigin } from '../../../lib/service';
import {recordAudit} from '../../../lib/audit';
import { requireBackupOwner,listBackups,makeBackup,readBackup } from '../../../lib/backups';
export const dynamic='force-dynamic';
export async function GET(req:Request){return safe(async()=>{const auth=await requireBackupOwner();const key=new URL(req.url).searchParams.get('key');if(key){const b=await readBackup(key);await recordAudit(auth,'main','backup.download',key,{sha256:b.doc.sha256});return new Response(b.text,{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="'+key.split('/').pop()+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}return json({backups:await listBackups(),retention_days:30});});}
export async function POST(req:Request){return safe(async()=>{sameOrigin(req);const auth=await requireBackupOwner();return json(await makeBackup(true,auth));});}
