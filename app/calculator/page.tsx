"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";

import FormulaTabs from "@/app/components/FormulaTabs";

import {
  getLocalStorageItem,
  setLocalStorageItem,
  isDeveloperMode,
} from "@/app/lib/utils";

import {
  calculateClassic,
  calculateCamarilla,
  FormulaResult,
} from "./formulaUtils";

type FormulaSetType = "classic" | "camarilla";

export default function CalculatorPage() {
  // Inputs
  const [open, setOpen] = useState("");
  const [high, setHigh] = useState("");
  const [low, setLow] = useState("");
  const [close, setClose] = useState("");

  // Tabs (Classic / Camarilla)
  const [formulaSet, setFormulaSet] = useState<FormulaSetType>("classic");

  // Results saved for BOTH formula sets
  const [allResults, setAllResults] = useState<{
    classic: FormulaResult | null;
    camarilla: FormulaResult | null;
  }>({
    classic: null,
    camarilla: null,
  });

  // Result displayed (based on selected tab)
  const [result, setResult] = useState<FormulaResult | null>(null);

  // Trial system
  const [trialsLeft, setTrialsLeft] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  // Load trials on mount and check developer mode
  useEffect(() => {
    setMounted(true);
    
    // Check if developer mode is enabled
    const devMode = isDeveloperMode();
    setIsDeveloper(devMode);

    // Only load trials if not in developer mode
    if (!devMode) {
      const saved = getLocalStorageItem("trialsLeft");

      if (!saved) {
        setLocalStorageItem("trialsLeft", "3");
        setTrialsLeft(3);
      } else {
        const savedTrials = Number(saved);
        // Ensure trials are between 0 and 3
        const validTrials = Math.max(0, Math.min(3, savedTrials));
        setTrialsLeft(validTrials);
        if (savedTrials !== validTrials) {
          setLocalStorageItem("trialsLeft", String(validTrials));
        }
      }
    } else {
      // Developer mode: set unlimited trials
      setTrialsLeft(999);
    }
  }, []);

  // When switching tab → instantly show the available result (no need to recalc)
  useEffect(() => {
    setResult(allResults[formulaSet]);
  }, [formulaSet, allResults]);

  const handleCalculate = () => {
    if (!open || !high || !low || !close) {
      alert("Please enter all OHLC values.");
      return;
    }

    // Skip trial check for developers
    if (!isDeveloper) {
      if (trialsLeft <= 0) {
        alert("Trial limit reached. Please subscribe.");
        return;
      }

      // Deduct 1 trial only for non-developers
      const updatedTrials = trialsLeft - 1;
      setTrialsLeft(updatedTrials);
      setLocalStorageItem("trialsLeft", String(updatedTrials));
    }

    // Convert to numbers
    const o = Number(open);
    const h = Number(high);
    const l = Number(low);
    const c = Number(close);

    // Calculate both sets together
    const classic = calculateClassic(o, h, l, c);
    const camarilla = calculateCamarilla(o, h, l, c);

    // Save results
    setAllResults({
      classic,
      camarilla,
    });

    // Set shown result based on current tab
    setResult(formulaSet === "classic" ? classic : camarilla);
  };

  // Hide values after trial ends (only for non-developers)
  const blurValue = (val?: number) => {
    if (val == null) return "";
    if (isDeveloper) return val.toFixed(2); // Developers always see values
    return trialsLeft > 0 ? val.toFixed(2) : "█████ (Subscribe)";
  };

  return (
    <PageContainer centered maxWidth="3xl">
      <div className="w-full max-w-lg space-y-6">

        <SectionTitle
          align="center"
          size="md"
          title={
            <>
              <span className="text-white">Magic Formula </span>
              <span className="text-[#00ff88]">Calculator</span>
            </>
          }
          description="Choose formula type and enter OHLC to generate magical levels."
        />

        {/* FORM INPUT CARD */}
        <Card variant="light" className="space-y-5">

          {/* Formula Tabs */}
          <FormulaTabs
            value={formulaSet}
            onChange={(v) => setFormulaSet(v)}
          />

          <Input
            label="Open"
            type="number"
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            placeholder="Enter Open"
          />

          <Input
            label="High"
            type="number"
            value={high}
            onChange={(e) => setHigh(e.target.value)}
            placeholder="Enter High"
          />

          <Input
            label="Low"
            type="number"
            value={low}
            onChange={(e) => setLow(e.target.value)}
            placeholder="Enter Low"
          />

          <Input
            label="Close"
            type="number"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            placeholder="Enter Close"
          />

          <Button onClick={handleCalculate} fullWidth className="py-3">
            Calculate
          </Button>

          {isDeveloper ? (
            <p className="text-center text-[#00ff88] text-sm font-semibold">
              🛠️ Developer Mode: Unlimited Calculations
            </p>
          ) : (
            <p className="text-center text-gray-300 text-sm">
              Trials Left:{" "}
              <span className="text-yellow-400 font-semibold">
                {mounted ? trialsLeft : 3}
              </span>{" "}
              / 3
            </p>
          )}
        </Card>

        {/* RESULTS CARD */}
        {result && (
          <Card variant="light" className="space-y-4">

            <h2 className="text-2xl font-bold text-white text-center">
              Result ({formulaSet === "classic" ? "Classic" : "Camarilla"})
            </h2>

            {/* Pivot */}
            {result.pivot !== undefined && (
              <p className="text-gray-300">
                <span className="font-semibold text-white">Pivot:</span>{" "}
                <span className="text-yellow-400 font-bold">
                  {blurValue(result.pivot)}
                </span>
              </p>
            )}

            {/* Resistance Levels */}
            <div className="space-y-1">
              {(["r1", "r2", "r3", "r4"] as const).map((key) => (
                <p key={key} className="text-gray-300">
                  <span className="font-semibold text-white">
                    {key.toUpperCase()}:
                  </span>{" "}
                  <span className="text-[#00ff88] font-bold">
                    {blurValue(result[key])}
                  </span>
                </p>
              ))}
            </div>

            {/* Support Levels */}
            <div className="space-y-1">
              {(["s1", "s2", "s3", "s4"] as const).map((key) => (
                <p key={key} className="text-gray-300">
                  <span className="font-semibold text-white">
                    {key.toUpperCase()}:
                  </span>{" "}
                  <span className="text-red-400 font-bold">
                    {blurValue(result[key])}
                  </span>
                </p>
              ))}
            </div>

            {/* Subscription CTA (only for non-developers) */}
            {!isDeveloper && trialsLeft <= 0 && (
              <div className="text-center mt-4">
                <Button variant="warning" as="a" href="/subscribe">
                  Subscribe to Unlock Full Access
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
