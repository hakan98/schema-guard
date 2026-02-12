"use client";

import { useState } from "react";
import {
    Globe,
    FileJson,
    ArrowRightLeft,
    Loader2,
    Sparkles,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { ComparisonResult, AIAnalysisResult } from "@/types";

interface SchemaInputProps {
    onCompare: (result: ComparisonResult) => void;
    onAnalyze: (result: AIAnalysisResult) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const SAMPLE_OLD_SCHEMA = JSON.stringify(
    {
        openapi: "3.0.0",
        info: { title: "Pet Store API", version: "1.0.0" },
        paths: {
            "/pets": {
                get: {
                    summary: "List all pets",
                    parameters: [
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: { type: "integer" },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "A list of pets",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Pet" },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    summary: "Create a pet",
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Pet" },
                            },
                        },
                    },
                    responses: {
                        "201": { description: "Pet created" },
                    },
                },
            },
            "/pets/{petId}": {
                get: {
                    summary: "Get a pet by ID",
                    parameters: [
                        { name: "petId", in: "path", required: true, schema: { type: "string" } },
                    ],
                    responses: {
                        "200": {
                            description: "A pet",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/Pet" },
                                },
                            },
                        },
                    },
                },
                delete: {
                    summary: "Delete a pet",
                    parameters: [
                        { name: "petId", in: "path", required: true, schema: { type: "string" } },
                    ],
                    responses: {
                        "204": { description: "Pet deleted" },
                    },
                },
            },
        },
        components: {
            schemas: {
                Pet: {
                    type: "object",
                    required: ["id", "name"],
                    properties: {
                        id: { type: "integer", format: "int64" },
                        name: { type: "string" },
                        tag: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["available", "pending", "sold"],
                        },
                    },
                },
            },
        },
    },
    null,
    2
);

const SAMPLE_NEW_SCHEMA = JSON.stringify(
    {
        openapi: "3.0.0",
        info: { title: "Pet Store API", version: "2.0.0" },
        paths: {
            "/pets": {
                get: {
                    summary: "List all pets",
                    parameters: [
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: { type: "string" },
                        },
                        {
                            name: "cursor",
                            in: "query",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "A list of pets",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: {
                                                type: "array",
                                                items: { $ref: "#/components/schemas/Pet" },
                                            },
                                            nextCursor: { type: "string" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    summary: "Create a pet",
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreatePetInput" },
                            },
                        },
                    },
                    responses: {
                        "201": { description: "Pet created" },
                    },
                },
            },
            "/pets/{petId}": {
                get: {
                    summary: "Get a pet by ID",
                    parameters: [
                        { name: "petId", in: "path", required: true, schema: { type: "integer" } },
                    ],
                    responses: {
                        "200": {
                            description: "A pet",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/Pet" },
                                },
                            },
                        },
                    },
                },
            },
            "/pets/search": {
                get: {
                    summary: "Search pets",
                    parameters: [
                        { name: "q", in: "query", required: true, schema: { type: "string" } },
                    ],
                    responses: {
                        "200": { description: "Search results" },
                    },
                },
            },
        },
        components: {
            schemas: {
                Pet: {
                    type: "object",
                    required: ["id", "name", "ownerId"],
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        ownerId: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["available", "pending", "sold", "archived"],
                        },
                    },
                },
                CreatePetInput: {
                    type: "object",
                    required: ["name"],
                    properties: {
                        name: { type: "string" },
                        tag: { type: "string" },
                    },
                },
            },
        },
    },
    null,
    2
);

export function SchemaInput({
    onCompare,
    onAnalyze,
    isLoading,
    setIsLoading,
}: SchemaInputProps) {
    const [inputMode, setInputMode] = useState<"paste" | "url">("paste");
    const [oldSchema, setOldSchema] = useState("");
    const [newSchema, setNewSchema] = useState("");
    const [oldUrl, setOldUrl] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [error, setError] = useState<string | null>(null);

    const loadSampleData = () => {
        setOldSchema(SAMPLE_OLD_SCHEMA);
        setNewSchema(SAMPLE_NEW_SCHEMA);
        setError(null);
    };

    const handleCompare = async () => {
        setError(null);
        setIsLoading(true);

        try {
            let oldJson: Record<string, unknown>;
            let newJson: Record<string, unknown>;

            if (inputMode === "url") {
                // Fetch from URLs
                const [oldResp, newResp] = await Promise.all([
                    fetch(oldUrl),
                    fetch(newUrl),
                ]);
                oldJson = await oldResp.json();
                newJson = await newResp.json();
            } else {
                oldJson = JSON.parse(oldSchema);
                newJson = JSON.parse(newSchema);
            }

            // Compare schemas
            const compareResp = await fetch("/api/compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldSchema: oldJson, newSchema: newJson }),
            });

            if (!compareResp.ok) throw new Error("Comparison failed");
            const compareResult = (await compareResp.json()) as ComparisonResult;
            onCompare(compareResult);

            // AI Analysis
            if (compareResult.changes.length > 0) {
                const analyzeResp = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        changes: compareResult.changes,
                        oldSchema: oldJson,
                        newSchema: newJson,
                    }),
                });

                if (analyzeResp.ok) {
                    const analysisResult = (await analyzeResp.json()) as AIAnalysisResult;
                    onAnalyze(analysisResult);
                }
            }
        } catch (err) {
            setError(
                err instanceof SyntaxError
                    ? "Invalid JSON format. Please check your schema input."
                    : err instanceof Error
                        ? err.message
                        : "An unexpected error occurred"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <ArrowRightLeft className="h-5 w-5 text-violet-500" />
                            Schema Comparison
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Paste your OpenAPI/Swagger JSON schemas or provide URLs to compare
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSampleData}
                        className="gap-1.5 text-xs"
                    >
                        <Sparkles className="h-3 w-3" />
                        Load Sample
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs
                    value={inputMode}
                    onValueChange={(v) => setInputMode(v as "paste" | "url")}
                >
                    <TabsList className="grid w-full max-w-xs grid-cols-2">
                        <TabsTrigger value="paste" className="gap-1.5">
                            <FileJson className="h-3.5 w-3.5" />
                            Paste JSON
                        </TabsTrigger>
                        <TabsTrigger value="url" className="gap-1.5">
                            <Globe className="h-3.5 w-3.5" />
                            URL
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-amber-500/30 bg-amber-500/10 text-amber-500"
                                    >
                                        OLD
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Previous Version
                                    </span>
                                </div>
                                <Textarea
                                    placeholder='{"openapi": "3.0.0", ...}'
                                    value={oldSchema}
                                    onChange={(e) => setOldSchema(e.target.value)}
                                    className="h-64 resize-none font-mono text-xs leading-relaxed"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                    >
                                        NEW
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Current Version
                                    </span>
                                </div>
                                <Textarea
                                    placeholder='{"openapi": "3.0.0", ...}'
                                    value={newSchema}
                                    onChange={(e) => setNewSchema(e.target.value)}
                                    className="h-64 resize-none font-mono text-xs leading-relaxed"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-amber-500/30 bg-amber-500/10 text-amber-500"
                                    >
                                        OLD
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Previous Version URL
                                    </span>
                                </div>
                                <Input
                                    placeholder="https://api.example.com/v1/swagger.json"
                                    value={oldUrl}
                                    onChange={(e) => setOldUrl(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                    >
                                        NEW
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Current Version URL
                                    </span>
                                </div>
                                <Input
                                    placeholder="https://api.example.com/v2/swagger.json"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleCompare}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-700 hover:to-cyan-700"
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Changes...
                        </>
                    ) : (
                        <>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Compare & Analyze
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
