import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { MODALITY_VALUES } from "@/config/taxonomy";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const roleEnum = pgEnum("user_role", ["admin", "editor"]);
export const modalityEnum = pgEnum("post_modality", MODALITY_VALUES);
export const originEnum = pgEnum("post_origin", ["curadoria", "propria"]);
export const statusEnum = pgEnum("post_status", ["draft", "published"]);
export const pageSlugEnum = pgEnum("page_slug", [
  "sobre",
  "politica-de-privacidade",
  "termos-de-uso",
  "politica-editorial",
]);
export const contactSubjectEnum = pgEnum("contact_subject", [
  "pauta",
  "correcao",
  "imprensa",
  "parcerias",
  "outro",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    dek: text("dek").notNull().default(""),
    body: text("body").notNull().default(""),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    modality: modalityEnum("modality").notNull(),
    origin: originEnum("origin").notNull(),
    sponsored: boolean("sponsored").notNull().default(false),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    imageAi: boolean("image_ai").notNull().default(false),
    /** Caixa opcional "O que fazer agora" (markdown). */
    takeaways: text("takeaways"),
    /** Nota de correção exibida no topo do corpo da matéria. */
    correctionNote: text("correction_note"),
    /** null = "Redação TI MAGAZINE". */
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    status: statusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    views: integer("views").notNull().default(0),
    // Depende de f_unaccent(), criada na migração 0000 antes da tabela.
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('portuguese', f_unaccent(coalesce(title,''))), 'A') || setweight(to_tsvector('portuguese', f_unaccent(coalesce(dek,''))), 'B') || setweight(to_tsvector('portuguese', f_unaccent(coalesce(body,''))), 'C')`,
    ),
  },
  (t) => [
    index("posts_search_vector_idx").using("gin", t.searchVector),
    index("posts_status_published_at_idx").on(t.status, t.publishedAt.desc()),
    index("posts_category_idx").on(t.categoryId),
  ],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const homeHighlights = pgTable(
  "home_highlights",
  {
    position: integer("position").primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
  },
  (t) => [check("home_highlights_position_check", sql`${t.position} between 1 and 5`)],
);

export const pages = pgTable("pages", {
  slug: pageSlugEnum("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: contactSubjectEnum("subject").notNull(),
  message: text("message").notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
  /** sha256(IP + AUTH_SECRET); nunca o IP bruto. */
  ipHash: text("ip_hash"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_email_attempted_at_idx").on(t.email, t.attemptedAt)],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
