"use client";

import {
    Brain,
    Code2,
    AlertTriangle,
    ListChecks,
    FileCode,
    Zap,
    Copy,
    Check,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { AIAnalysisResult, Severity } from "@/types";
import { useState } from "react";

interface AIAnalysisPanelProps {
    result: AIAnalysisResult | null;
    isLoading: boolean;
}

const severityColorMap: Record<Severity, string> = {
    critical: "border-red-500/30 bg-red-500/10 text-red-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7"
        >
            {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
            ) : (
                <Copy className="h-3 w-3" />
            )}
        </Button>
    );
}

export function AIAnalysisPanel({ result, isLoading }: AIAnalysisPanelProps) {
    if (isLoading) {
        return (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 opacity-20 blur-xl animate-pulse" />
                        <Brain className="relative h-12 w-12 text-violet-500 animate-pulse" />
                    </div>
                    <p className="mt-4 text-sm font-medium">AI Analyzing Changes...</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        GPT-4o is evaluating frontend impact
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!result) return null;

    return (
        <Card className="border-violet-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 opacity-50 blur-sm" />
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                            <Brain className="h-4 w-4 text-violet-500" />
                        </div>
                    </div>
                    AI Analysis
                </CardTitle>
                <CardDescription>
                    Powered by GPT-4o — Frontend impact analysis
                </CardDescription>
            </CardHeader>

            <Separator className="opacity-50" />

            <CardContent className="pt-4">
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                <Zap className="h-4 w-4 text-amber-400" />
                                Summary
                            </h3>
                            <p className="rounded-lg border border-border/50 bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground">
                                {result.summary}
                            </p>
                        </div>

                        {/* Affected Components */}
                        {result.affectedComponents.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                    Affected Components ({result.affectedComponents.length})
                                </h3>
                                <div className="space-y-2">
                                    {result.affectedComponents.map((comp, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-lg border p-3 ${severityColorMap[comp.severity]}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] uppercase"
                                                >
                                                    {comp.severity}
                                                </Badge>
                                                <span className="text-sm font-medium">{comp.name}</span>
                                            </div>
                                            <p className="mt-1 text-xs opacity-80">{comp.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Interfaces */}
                        {result.suggestedInterfaces.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <Code2 className="h-4 w-4 text-cyan-400" />
                                    Suggested TypeScript Interfaces
                                </h3>
                                <div className="space-y-3">
                                    {result.suggestedInterfaces.map((iface, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-cyan-500/20 bg-cyan-500/5"
                                        >
                                            <div className="flex items-center justify-between border-b border-cyan-500/10 px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                                                    <span className="text-sm font-medium text-cyan-400">
                                                        {iface.name}
                                                    </span>
                                                </div>
                                                <CopyButton text={iface.code} />
                                            </div>
                                            <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
                                                <code>{iface.code}</code>
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Migration Steps */}
                        {result.migrationSteps.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <ListChecks className="h-4 w-4 text-emerald-400" />
                                    Migration Steps
                                </h3>
                                <div className="space-y-2">
                                    {result.migrationSteps.map((step, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 rounded-lg border border-border/30 bg-background/50 p-3"
                                        >
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
