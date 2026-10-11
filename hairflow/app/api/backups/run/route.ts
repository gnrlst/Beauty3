import { getChatGPTUser } from '../../../chatgpt-auth';
import { safe,json,sameOrigin } from '../../../../lib/service';
import { requireBackupOwner,makeBackup } from '../../../../lib/backups';
export const dynamic='force-dynamic';
// Owner-private Sites dispatch is the unattended access boundary. Its service
// bearer is consumed by dispatch and supplies no visitor identity. This route
// only creates a daily backup and returns counts/hash; it never exports data.
// Before making this Site public, replace this boundary with service auth.
export async function POST(req:Request){return safe(async()=>{const user=await getChatGPTUser();if(user){sameOrigin(req);await requireBackupOwner();}return json(await makeBackup());});}
