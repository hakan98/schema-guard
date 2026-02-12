"use client";

import {
    AlertTriangle,
    AlertCircle,
    Info,
    ShieldAlert,
    ShieldCheck,
    ArrowRight,
    ChevronDown,
    ChevronUp,
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
import type { ComparisonResult, SchemaChange, Severity } from "@/types";
import { useState } from "react";

interface ComparisonViewProps {
    result: ComparisonResult | null;
}

const severityConfig: Record<
    Severity,
    {
        icon: typeof AlertTriangle;
        label: string;
        color: string;
        bgColor: string;
        borderColor: string;
    }
> = {
    critical: {
        icon: ShieldAlert,
        label: "Critical",
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
    },
    warning: {
        icon: AlertCircle,
        label: "Warning",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
    },
    info: {
        icon: Info,
        label: "Info",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
    },
};

function ChangeRow({ change, index }: { change: SchemaChange; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const config = severityConfig[change.severity];
    const Icon = config.icon;

    return (
        <div
            className={`group rounded-lg border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-start gap-3 p-4 text-left"
            >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/50">
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`${config.borderColor} ${config.bgColor} ${config.color} text-[10px] uppercase`}
                        >
                            {config.label}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="text-[10px] uppercase text-muted-foreground"
                        >
                            {change.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{change.description}</p>
                    <code className="mt-1 block text-xs text-muted-foreground">
                        {change.path}
                    </code>
                </div>
                <div className="shrink-0 pt-1">
                    {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {expanded && (change.oldValue !== undefined || change.newValue !== undefined) && (
                <div className="border-t border-border/30 px-4 pb-4 pt-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        {change.oldValue !== undefined && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-red-400">
                                    ← Previous
                                </span>
                                <pre className="overflow-x-auto rounded-md bg-background/80 p-2 text-xs">
                                    {typeof change.oldValue === "object"
                                        ? JSON.stringify(change.oldValue, null, 2)
                                        : String(change.oldValue)}
                                </pre>
                            </div>
                        )}
                        {change.newValue !== undefined && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-emerald-400">
                                    → Current
                                </span>
                                <pre className="overflow-x-auto rounded-md bg-background/80 p-2 text-xs">
                                    {typeof change.newValue === "object"
                                        ? JSON.stringify(change.newValue, null, 2)
                                        : String(change.newValue)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ComparisonView({ result }: ComparisonViewProps) {
    const [filter, setFilter] = useState<Severity | "all">("all");

    if (!result) return null;

    const filteredChanges =
        filter === "all"
            ? result.changes
            : result.changes.filter((c) => c.severity === filter);

    const criticalCount = result.changes.filter(
        (c) => c.severity === "critical"
    ).length;
    const warningCount = result.changes.filter(
        (c) => c.severity === "warning"
    ).length;
    const infoCount = result.changes.filter((c) => c.severity === "info").length;

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            {result.breaking > 0 ? (
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                            ) : (
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            )}
                            Comparison Results
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {result.summary}
                        </CardDescription>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <button
                        onClick={() =>
                            setFilter(filter === "critical" ? "all" : "critical")
                        }
                        className={`rounded-lg border p-3 text-center transition-all ${filter === "critical"
                                ? "border-red-500 bg-red-500/20"
                                : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                            }`}
                    >
                        <div className="text-2xl font-bold text-red-400">
                            {criticalCount}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-red-400/70">
                            Critical
                        </div>
                    </button>
                    <button
                        onClick={() =>
                            setFilter(filter === "warning" ? "all" : "warning")
                        }
                        className={`rounded-lg border p-3 text-center transition-all ${filter === "warning"
                                ? "border-amber-500 bg-amber-500/20"
                                : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                            }`}
                    >
                        <div className="text-2xl font-bold text-amber-400">
                            {warningCount}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-amber-400/70">
                            Warning
                        </div>
                    </button>
                    <button
                        onClick={() => setFilter(filter === "info" ? "all" : "info")}
                        className={`rounded-lg border p-3 text-center transition-all ${filter === "info"
                                ? "border-blue-500 bg-blue-500/20"
                                : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
                            }`}
                    >
                        <div className="text-2xl font-bold text-blue-400">{infoCount}</div>
                        <div className="text-[10px] uppercase tracking-wider text-blue-400/70">
                            Info
                        </div>
                    </button>
                </div>
            </CardHeader>

            <Separator className="opacity-50" />

            <CardContent className="pt-4">
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                        {filteredChanges.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <ShieldCheck className="mb-3 h-12 w-12 text-emerald-500/50" />
                                <p className="text-sm">No changes in this category</p>
                            </div>
                        ) : (
                            filteredChanges.map((change, i) => (
                                <ChangeRow key={i} change={change} index={i} />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
