import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres() establishes the pool lazily — validated on first query, not at
// module load. This allows next build to succeed without DATABASE_URL in env.
const queryClient = postgres(process.env.DATABASE_URL ?? "", { prepare: false });

export const db = drizzle(queryClient, { schema });
