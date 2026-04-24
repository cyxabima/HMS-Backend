import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const testUsersTable = pgTable("test_users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

// if we use the relation api we have to check how to do this in multiple files
