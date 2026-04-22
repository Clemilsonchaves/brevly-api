import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  originalUrl: text("original_url").notNull(),
  shortUrl: text("short_url").notNull().unique(),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
