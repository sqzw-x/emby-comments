import { PrismaClient } from "@prisma/client";

export const dbClient = new PrismaClient({
  log:
    process.env.NODE_ENV === "development" ? [{ emit: "event", level: "query" }, "info", "warn", "error"] : ["error"],
});

if (process.env.NODE_ENV === "development" && process.env.PRISMA_LOG_QUERIES === "true") {
  dbClient.$on("query", (e) => console.log(`Execute SQL (${e.duration}ms): ${e.query} ${e.params}`));
}
