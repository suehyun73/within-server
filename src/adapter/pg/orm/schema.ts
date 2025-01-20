import { isNull, relations } from 'drizzle-orm';
import {
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['general', 'admin']);
export const scopeEnum = pgEnum('scope', [
  'domain',
  'full-path',
]);

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
    markdown: text('markdown').notNull(),
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
    idx: uniqueIndex('local_id_user_id_target_url_nodes_idx')
      .on(table.localId, table.userId, table.targetUrl)
      .where(isNull(table.deletedAt)),
  }),
);

export const highlightTable = pgTable(
  'highlight_table',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id),
    targetUrl: varchar('target_url').notNull(),
    selector: varchar('selector').notNull(),
    spans: json('spans')
      .array()
      .$type<{ start: number; text: string }[]>()
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    idx: uniqueIndex(
      'user_id_target_url_selector_highlights_idx',
    )
      .on(table.userId, table.targetUrl, table.selector)
      .where(isNull(table.deletedAt)),
  }),
);

export const userRelations = relations(
  userTable,
  ({ many }) => ({
    nodes: many(nodeTable),
    highlights: many(highlightTable),
  }),
);

export const nodeRelations = relations(nodeTable, ({ one }) => ({
  user: one(userTable, {
    fields: [nodeTable.userId],
    references: [userTable.id],
  }),
}));

export const highlightRelations = relations(
  highlightTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [highlightTable.userId],
      references: [userTable.id],
    }),
  }),
);
