"use client";

import React from "react";

type FormulaSetType = "classic" | "camarilla";

interface Props {
  value: FormulaSetType;
  onChange: (v: FormulaSetType) => void;
}

export default function FormulaTabs({ value, onChange }: Props) {
  const tabs: { id: FormulaSetType; label: string }[] = [
    { id: "classic", label: "Classic" },
    { id: "camarilla", label: "Camarilla" },
  ];

  return (
    <div className="w-full flex justify-center mt-2">
      <div className="inline-flex bg-black/40 border border-gray-700 rounded-xl p-1">
        {tabs.map((t) => {
          const active = value === t.id;

          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-200
                ${active
                  ? "bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/40"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
                }
              `}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
