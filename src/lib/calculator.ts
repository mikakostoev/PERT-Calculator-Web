export type Familiarity = "FIRST_TIME" | "MODERATE" | "FAMILIAR";

export interface Task {
  id: string;
  title: string;
  optimisticHours: number;
  realisticHours: number;
  pessimisticHours: number;
  familiarity: Familiarity;
}

export interface BaseSettings {
  hourlyRate: number;
  bufferRisk: number;
}

export interface EstimateSummary {
  baseHours: number;
  familiarityAdjustedHours: number;
  bufferedHours: number;
  estimate: number;
}

export const FAMILIARITY_MULTIPLIERS: Record<Familiarity, number> = {
  FIRST_TIME: 1.7,
  MODERATE: 1.3,
  FAMILIAR: 1.0,
};

export const FAMILIARITY_LABELS: Record<Familiarity, string> = {
  FIRST_TIME: "FIRST TIME",
  MODERATE: "MODERATE",
  FAMILIAR: "FAMILIAR",
};

const FAMILIARITY_ORDER: Familiarity[] = [
  "FAMILIAR",
  "MODERATE",
  "FIRST_TIME",
];

let taskCounter = 0;

export const seedSettings: BaseSettings = {
  hourlyRate: 85,
  bufferRisk: 30,
};

export const seedTasks: Task[] = [
  {
    id: createTaskId(),
    title: "System Architecture Design",
    optimisticHours: 12,
    realisticHours: 18,
    pessimisticHours: 30,
    familiarity: "MODERATE",
  },
  {
    id: createTaskId(),
    title: "UI Component Library Development",
    optimisticHours: 40,
    realisticHours: 60,
    pessimisticHours: 100,
    familiarity: "FAMILIAR",
  },
];

export function createTask(
  overrides: Partial<Omit<Task, "id">> = {},
): Task {
  return {
    id: createTaskId(),
    title: "New Task",
    optimisticHours: 2,
    realisticHours: 5,
    pessimisticHours: 10,
    familiarity: "FAMILIAR",
    ...overrides,
  };
}

export function sanitizeNumber(
  value: number,
  options: { min?: number; max?: number } = {},
): number {
  const { min = 0, max = Number.POSITIVE_INFINITY } = options;
  if (!Number.isFinite(value)) {
    return Math.max(0, min);
  }

  return Math.min(Math.max(value, min), max);
}

export function parseNumericDraft(
  rawValue: string,
  options: { min?: number; max?: number } = {},
): number {
  if (rawValue.trim() === "") {
    return sanitizeNumber(0, options);
  }

  return sanitizeNumber(Number.parseFloat(rawValue), options);
}

export function normalizeNumericDraft(
  rawValue: string,
  options: { min?: number; max?: number } = {},
): string {
  if (rawValue.trim() === "") {
    return "";
  }

  return String(parseNumericDraft(rawValue, options));
}

export function calculatePert(
  optimisticHours: number,
  realisticHours: number,
  pessimisticHours: number,
): number {
  const optimistic = sanitizeNumber(optimisticHours);
  const realistic = sanitizeNumber(realisticHours);
  const pessimistic = sanitizeNumber(pessimisticHours);

  return (optimistic + 4 * realistic + pessimistic) / 6;
}

export function calculateTaskPert(task: Task): number {
  return calculatePert(
    task.optimisticHours,
    task.realisticHours,
    task.pessimisticHours,
  );
}

export function calculateEstimate(
  tasks: Task[],
  settings: BaseSettings,
): EstimateSummary {
  const hourlyRate = sanitizeNumber(settings.hourlyRate);
  const bufferRisk = sanitizeNumber(settings.bufferRisk, { min: 0, max: 100 });

  const baseHours = tasks.reduce((total, task) => {
    return total + calculateTaskPert(task);
  }, 0);

  const familiarityAdjustedHours = tasks.reduce((total, task) => {
    return total + calculateTaskPert(task) * FAMILIARITY_MULTIPLIERS[task.familiarity];
  }, 0);

  const bufferedHours = familiarityAdjustedHours * (1 + bufferRisk / 100);
  const estimate = bufferedHours * hourlyRate * 2;

  return {
    baseHours,
    familiarityAdjustedHours,
    bufferedHours,
    estimate,
  };
}

export function cycleFamiliarity(current: Familiarity): Familiarity {
  const currentIndex = FAMILIARITY_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % FAMILIARITY_ORDER.length;
  return FAMILIARITY_ORDER[nextIndex];
}

function createTaskId(): string {
  taskCounter += 1;
  return `task-${taskCounter}`;
}
