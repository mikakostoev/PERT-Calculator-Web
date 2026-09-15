import { describe, expect, it } from "vitest";
import {
  calculateEstimate,
  calculatePert,
  cycleFamiliarity,
  normalizeNumericDraft,
  parseNumericDraft,
  sanitizeNumber,
  type BaseSettings,
  type Task,
} from "./calculator";

describe("calculator logic", () => {
  it("uses the HTML PERT formula", () => {
    expect(calculatePert(2, 5, 10)).toBeCloseTo(5.3333, 3);
    expect(calculatePert(12, 18, 30)).toBe(19);
  });

  it("applies familiarity multipliers, buffer, and final estimate", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Architecture",
        optimisticHours: 12,
        realisticHours: 18,
        pessimisticHours: 30,
        familiarity: "MODERATE",
      },
      {
        id: "task-2",
        title: "UI Library",
        optimisticHours: 40,
        realisticHours: 60,
        pessimisticHours: 100,
        familiarity: "FAMILIAR",
      },
    ];
    const settings: BaseSettings = {
      hourlyRate: 85,
      bufferRisk: 30,
    };

    const summary = calculateEstimate(tasks, settings);

    expect(summary.baseHours).toBeCloseTo(82.3333, 3);
    expect(summary.familiarityAdjustedHours).toBeCloseTo(88.0333, 3);
    expect(summary.bufferedHours).toBeCloseTo(114.4433, 3);
    expect(summary.estimate).toBeCloseTo(19455.3667, 3);
  });

  it("cycles familiarity in the requested order", () => {
    expect(cycleFamiliarity("FAMILIAR")).toBe("MODERATE");
    expect(cycleFamiliarity("MODERATE")).toBe("FIRST_TIME");
    expect(cycleFamiliarity("FIRST_TIME")).toBe("FAMILIAR");
  });

  it("clamps invalid numbers safely", () => {
    expect(sanitizeNumber(Number.NaN)).toBe(0);
    expect(sanitizeNumber(-12)).toBe(0);
    expect(sanitizeNumber(150, { min: 0, max: 100 })).toBe(100);
  });

  it("parses empty drafts as zero for calculations", () => {
    expect(parseNumericDraft("")).toBe(0);
    expect(parseNumericDraft("   ")).toBe(0);
    expect(parseNumericDraft("", { min: 0, max: 100 })).toBe(0);
  });

  it("normalizes drafts while preserving empty strings visually", () => {
    expect(normalizeNumericDraft("")).toBe("");
    expect(normalizeNumericDraft("2000")).toBe("2000");
    expect(normalizeNumericDraft("3.5")).toBe("3.5");
    expect(normalizeNumericDraft("120", { min: 0, max: 100 })).toBe("100");
  });
});
