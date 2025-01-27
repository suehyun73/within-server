import { isNull, relations } from 'drizzle-orm';
import {
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  googleId: varchar('google_id').notNull().unique(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  roles: varchar('roles')
    .array()
    .$type<('general' | 'admin')[]>()
    .notNull(),
  profileUrl: varchar('profile_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const memos = pgTable(
  'memos',
  {
    id: serial('id').primaryKey(),
    localId: varchar('local_id').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    targetUrl: varchar('target_url').notNull(),
    domain: varchar('domain').notNull(),
    markdown: text('markdown').notNull(),
    scope: varchar('scope')
      .$type<'domain' | 'full-path'>()
      .notNull(),
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
    idx: uniqueIndex('memos_local_id_user_id_target_url_idx')
      .on(table.localId, table.userId, table.targetUrl)
      .where(isNull(table.deletedAt)),
  }),
);

export const highlights = pgTable(
  'highlights',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
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
      'highlights_user_id_target_url_selector_idx',
    )
      .on(table.userId, table.targetUrl, table.selector)
      .where(isNull(table.deletedAt)),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  memos: many(memos),
  highlights: many(highlights),
}));

export const memoRelations = relations(memos, ({ one }) => ({
  user: one(users, {
    fields: [memos.userId],
    references: [users.id],
  }),
}));

export const highlightRelations = relations(
  highlights,
  ({ one }) => ({
    user: one(users, {
      fields: [highlights.userId],
      references: [users.id],
    }),
  }),
);
