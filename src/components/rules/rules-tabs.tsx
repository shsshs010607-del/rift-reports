"use client";

import { useState } from "react";
import { BookOpen, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";

export function RulesTabs({ guide, glossary }: { guide: React.ReactNode; glossary: React.ReactNode }) {
  const [tab, setTab] = useState<"guide" | "glossary">("guide");

  return (
    <div>
      <div className="mb-6 inline-flex rounded-full bg-primary-wash p-1">
        {(
          [
            { id: "guide", label: "초보자 가이드", icon: BookOpen },
            { id: "glossary", label: "룰 & 용어", icon: ListTree },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-label-lg transition",
              tab === id ? "bg-card text-primary-strong shadow-e1" : "text-ink-soft hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div hidden={tab !== "guide"}>{guide}</div>
      <div hidden={tab !== "glossary"}>{glossary}</div>
    </div>
  );
}
