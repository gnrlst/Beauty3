import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const ledger = sqliteTable('business_state', {
 id:text('id').primaryKey(), data:text('data').notNull(), revision:integer('revision').notNull().default(0), lastOperation:text('last_operation'), updatedAt:text('updated_at').notNull()
});
export const members = sqliteTable('members', {
 id:text('id').primaryKey(), email:text('email').notNull(), name:text('name').notNull(), company:text('company').notNull(), role:text('role').notNull(), userId:text('user_id'), active:integer('active').notNull().default(1), owner:integer('is_owner').notNull().default(0), createdAt:text('created_at').notNull()
},table=>[uniqueIndex('members_email_company_unique').on(table.email,table.company)]);
export const audit = sqliteTable('audit', {
 id:text('id').primaryKey(), userId:text('user_id').notNull(), email:text('email').notNull(), company:text('company').notNull(), action:text('action').notNull(), objectId:text('object_id'), details:text('details').notNull(), createdAt:text('created_at').notNull()
});
