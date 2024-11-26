import { PrismaClient } from "@prisma/client";

const db_url = process.env.DATABASE_URL;
console.log("connecting to database at", db_url);

export const prismaClient = new PrismaClient({
  datasourceUrl: db_url,
});
