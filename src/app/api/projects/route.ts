import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            include: {
                versions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json(projects);
    } catch (error) {
        console.error("Projects fetch error:", error);
        return NextResponse.json(
            { error: "Database not configured. Set DATABASE_URL in .env.local" },
            { status: 503 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, swaggerUrl } = body as { name: string; swaggerUrl?: string };

        if (!name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: { name, swaggerUrl },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Project create error:", error);
        return NextResponse.json(
            { error: "Database not configured. Set DATABASE_URL in .env.local" },
            { status: 503 }
        );
    }
}
