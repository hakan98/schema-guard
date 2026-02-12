import { NextResponse } from "next/server";
import { compareSchemas, deepCompareJSON } from "@/lib/compare-schemas";
import type { OpenAPISchema } from "@/types";

function isOpenAPISchema(obj: Record<string, unknown>): boolean {
    return !!(obj.openapi || obj.swagger || obj.paths || obj.definitions);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { oldSchema, newSchema } = body as {
            oldSchema: Record<string, unknown>;
            newSchema: Record<string, unknown>;
        };

        if (!oldSchema || !newSchema) {
            return NextResponse.json(
                { error: "Both oldSchema and newSchema are required" },
                { status: 400 }
            );
        }

        // Auto-detect: OpenAPI schema vs plain JSON
        const result =
            isOpenAPISchema(oldSchema) || isOpenAPISchema(newSchema)
                ? compareSchemas(oldSchema as OpenAPISchema, newSchema as OpenAPISchema)
                : deepCompareJSON(oldSchema, newSchema);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Compare error:", error);
        return NextResponse.json(
            { error: "Failed to compare schemas" },
            { status: 500 }
        );
    }
}
