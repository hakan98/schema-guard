"use client";

import { Shield, Github, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function DashboardHeader() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    return (
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 opacity-75 blur" />
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                            <Shield className="h-5 w-5 text-violet-500" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Schema<span className="text-violet-500">Guard</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            API Change Tracker
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDark(!isDark)}
                        className="rounded-full"
                    >
                        {isDark ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Github className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
}
