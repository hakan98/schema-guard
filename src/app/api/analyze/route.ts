import { NextResponse } from "next/server";
import openai from "@/lib/openai";
import type { AnalyzeRequest, AIAnalysisResult, SchemaChange } from "@/types";

function buildMockAnalysis(changes: SchemaChange[], reason: string): AIAnalysisResult {
    return {
        affectedComponents: changes
            .filter((c) => c.severity === "critical")
            .map((c) => ({
                name: c.path.split(".").slice(0, 3).join("/"),
                reason: c.description,
                severity: c.severity,
            })),
        suggestedInterfaces: [
            {
                name: "UpdatedAPIResponse",
                code: `// Auto-generated interface based on schema changes\ninterface UpdatedAPIResponse {\n  // Review the ${changes.length} change(s) detected\n  // and update your types accordingly\n}`,
            },
        ],
        summary: `⚠️ ${reason}. ${changes.length} change(s) detected: ${changes.filter((c) => c.severity === "critical").length} critical, ${changes.filter((c) => c.severity === "warning").length} warnings, ${changes.filter((c) => c.severity === "info").length} informational.`,
        migrationSteps: [
            "Configure a valid OPENAI_API_KEY in .env.local for detailed AI analysis",
            `Review ${changes.filter((c) => c.severity === "critical").length} breaking change(s) manually`,
            "Update TypeScript interfaces to match new schema",
            "Run your test suite to identify affected components",
        ],
    };
}

export async function POST(request: Request) {
    let parsedChanges: SchemaChange[] = [];

    try {
        const body = (await request.json()) as AnalyzeRequest;
        const { changes, oldSchema, newSchema } = body;
        parsedChanges = changes || [];

        if (!changes || changes.length === 0) {
            return NextResponse.json(
                { error: "No changes provided for analysis" },
                { status: 400 }
            );
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                buildMockAnalysis(changes, "OpenAI API key not configured")
            );
        }

        // Build the prompt for GPT-4o
        const changesDescription = changes
            .map(
                (c, i) =>
                    `${i + 1}. [${c.severity.toUpperCase()}] ${c.type}: ${c.path}\n   ${c.description}${c.oldValue ? `\n   Old: ${JSON.stringify(c.oldValue)}` : ""}${c.newValue ? `\n   New: ${JSON.stringify(c.newValue)}` : ""}`
            )
            .join("\n\n");

        const systemPrompt = `You are an expert API architect and TypeScript developer. Analyze the following API schema changes and provide actionable insights for the frontend team.

Pay special attention to how these changes affect the frontend \`interface User { ... }\` structure. If a User-related model exists in the schema, show the updated interface.

You MUST respond with valid JSON in this exact format:
{
  "affectedComponents": [
    { "name": "ComponentName", "reason": "Why this component is affected", "severity": "critical|warning|info" }
  ],
  "suggestedInterfaces": [
    { "name": "InterfaceName", "code": "TypeScript interface code" }
  ],
  "summary": "A clear, human-readable summary of all changes and their impact on frontend interfaces",
  "migrationSteps": ["Step 1", "Step 2", ...]
}`;

        const schemasContext = oldSchema && newSchema
            ? `\n\nOld Schema:\n${JSON.stringify(oldSchema, null, 2)}\n\nNew Schema:\n${JSON.stringify(newSchema, null, 2)}`
            : "";

        const userPrompt = `Analyze these API schema changes and tell me:
1. Which frontend components might break?
2. How do these changes affect the frontend \`interface User { ... }\` structure? Show the before and after.
3. What should the new TypeScript interfaces look like?
4. Give me a plain-language summary of the changes.
5. What are the migration steps?

Changes detected:
${changesDescription}${schemasContext}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response from OpenAI");
        }

        const analysis = JSON.parse(content) as AIAnalysisResult;

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Analysis error:", error);

        // Fall back to mock analysis instead of returning 500
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const reason = errorMessage.includes("API key")
            ? "Invalid or missing OpenAI API key"
            : `OpenAI API unavailable (${errorMessage.slice(0, 80)})`;
        return NextResponse.json(buildMockAnalysis(parsedChanges, reason));
    }
}
