"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type ResumeSectionNavProps = {
  sections: Array<[string, string]>;
};

export function ResumeSectionNav({ sections }: ResumeSectionNavProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="sticky top-[142px] z-30 border border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex items-center gap-3 px-4 py-3">
        <nav className={`${collapsed ? "hidden" : "flex"} min-w-0 flex-1 gap-2 overflow-x-auto`} aria-label="Subgrupos do curriculo">
          {sections.map(([href, label]) => (
            <a
              key={href}
              href={`#${href}`}
              className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-[#174a86] hover:bg-[#eef5ff] hover:text-[#174a86]"
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-[#174a86] hover:bg-[#eef5ff] hover:text-[#174a86]"
          aria-label={collapsed ? "Expandir subgrupos do curriculo" : "Recolher subgrupos do curriculo"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown aria-hidden="true" size={18} /> : <ChevronUp aria-hidden="true" size={18} />}
        </button>
      </div>
    </div>
  );
}
