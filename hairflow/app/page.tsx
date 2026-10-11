import { requireChatGPTUser } from './chatgpt-auth';
import ClientApp from './client-app';
export const dynamic = 'force-dynamic';
export default async function Page(){ await requireChatGPTUser('/'); return <ClientApp />; }
