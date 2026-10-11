'use client';
import { useEffect } from 'react';
export default function ClientApp(){
 useEffect(()=>{let cancelled=false;const start=async()=>{for(const src of ['/engine.js','/app.js']){if(cancelled)return;await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.dataset.hairflow='true';script.onload=()=>resolve();script.onerror=()=>reject(new Error('Не удалось загрузить интерфейс'));document.body.appendChild(script);});}};start().catch(()=>{const n=document.querySelector('#app');if(n)n.textContent='Не удалось загрузить приложение. Обновите страницу.';});return()=>{cancelled=true;};},[]);
 return <><link rel="stylesheet" href="/style.css" /><div id="app"><div style={{padding:40}}>Подключаем общую базу данных…</div></div><div id="modal-root"/><div id="toast" role="status"/></>;
}
