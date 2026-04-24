import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
  },
  schema, // this for making a relationship api other than sqlapi so that drizzle allow us to use special object with relationship things directly
});
