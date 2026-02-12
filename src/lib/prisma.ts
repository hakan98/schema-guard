import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        // Return a PrismaClient that will fail gracefully when used
        // This allows the app to run without a database for schema comparison features
        console.warn("DATABASE_URL not set. Database features will be unavailable.");
    }

    const adapter = new PrismaPg({ connectionString: connectionString || "" });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
