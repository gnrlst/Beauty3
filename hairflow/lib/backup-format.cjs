'use strict';
const FORMAT='hairflow-database-backup',VERSION=1;
const TABLES=['business_state','members','audit'];
function validatePayload(p){
 if(!p||p.format!==FORMAT||p.version!==VERSION||p.project!=='appgprj_6acb6d2d738081918d612c3a00ac3165'||!Number.isFinite(Date.parse(p.created_at)))throw Error('Некорректный формат резервной копии');
 if(!Array.isArray(p.tables)||p.tables.length<TABLES.length||new Set(p.tables.map(t=>t.name)).size!==p.tables.length)throw Error('Неполная копия таблиц');
 if(TABLES.some(name=>!p.tables.some(t=>t.name===name)))throw Error('Неполная копия таблиц');
 for(const t of p.tables){const name=t.name;if(typeof name!=='string'||!name||typeof t.sql!=='string'||!/^CREATE TABLE /i.test(t.sql)||!Array.isArray(t.columns)||!t.columns.length||!Array.isArray(t.rows))throw Error('Некорректная таблица '+name);for(const row of t.rows){if(!row||Object.keys(row).length!==t.columns.length||t.columns.some(c=>!Object.hasOwn(row,c)||!["string","number"].includes(typeof row[c])&&row[c]!==null))throw Error('Некорректная строка '+name);}}
 const ledger=p.tables.find(t=>t.name==='business_state');for(const row of ledger.rows){JSON.parse(row.data);if(!Number.isInteger(row.revision)||row.revision<0)throw Error('Некорректная версия реестра');}
 if(!Array.isArray(p.indexes)||p.indexes.some(i=>typeof i.sql!=='string'||!/^CREATE (UNIQUE )?INDEX /i.test(i.sql)||!p.tables.some(t=>t.name===i.table)))throw Error('Некорректные индексы');return p;
}
function counts(p){return Object.fromEntries(p.tables.map(t=>[t.name,t.rows.length]));}
module.exports={FORMAT,VERSION,TABLES,validatePayload,counts};
