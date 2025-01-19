import { eq, isNull, relations, sql } from 'drizzle-orm';
import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['general', 'admin']);
export const scopeEnum = pgEnum('scope', ['global', 'domain', 'full-path']);

export const userTable = pgTable('user_table', {
  id: serial('id').primaryKey(),
  googleId: varchar('google_id').notNull().unique(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  roles: roleEnum().array().notNull(),
  profileUrl: varchar('profile_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const nodeTable = pgTable(
  'node_table',
  {
    id: serial('id').primaryKey(),
    localId: varchar('local_id').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id),
    targetUrl: varchar('target_url').notNull(),
    domain: varchar('domain').notNull(),
    md: text('md').notNull(),
    scope: scopeEnum().notNull(),
    posX: integer('pos_x').notNull(),
    posY: integer('pos_y').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    idx: uniqueIndex('local_id_user_id_url_nodes_idx')
      .on(table.localId, table.userId, table.targetUrl)
      .where(isNull(table.deletedAt)),
  }),
);

export const userRelations = relations(userTable, ({ many }) => ({
  nodes: many(nodeTable),
}));

export const nodeRelations = relations(nodeTable, ({ one }) => ({
  user: one(userTable, {
    fields: [nodeTable.userId],
    references: [userTable.id],
  }),
}));
