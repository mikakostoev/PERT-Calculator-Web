import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  FAMILIARITY_LABELS,
  calculateEstimate,
  calculateTaskPert,
  createTask,
  cycleFamiliarity,
  normalizeNumericDraft,
  parseNumericDraft,
  seedSettings,
  seedTasks,
  type BaseSettings,
  type Task,
} from "./lib/calculator";

function App() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [settings, setSettings] = useState<BaseSettings>(seedSettings);
  const [settingDrafts, setSettingDrafts] = useState<Record<keyof BaseSettings, string>>({
    hourlyRate: String(seedSettings.hourlyRate),
    bufferRisk: String(seedSettings.bufferRisk),
  });
  const [taskHourDrafts, setTaskHourDrafts] = useState<
    Record<string, Record<HourFieldName, string>>
  >(() => createTaskHourDrafts(seedTasks));

  const summary = useMemo(
    () => calculateEstimate(tasks, settings),
    [tasks, settings],
  );

  const updateTaskTitle = (taskId: string, value: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, title: value } : task,
      ),
    );
  };

  const updateTaskHours = (
    taskId: string,
    field: HourFieldName,
    rawValue: string,
  ) => {
    const nextValue = parseNumericDraft(rawValue, { min: 0 });
    setTaskHourDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        ...currentDrafts[taskId],
        [field]: rawValue,
      },
    }));
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, [field]: nextValue } : task,
      ),
    );
  };

  const normalizeTaskHours = (taskId: string, field: HourFieldName) => {
    setTaskHourDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        ...currentDrafts[taskId],
        [field]: normalizeNumericDraft(currentDrafts[taskId]?.[field] ?? "", {
          min: 0,
        }),
      },
    }));
  };

  const updateSetting = (
    field: keyof BaseSettings,
    rawValue: string,
    options?: { min?: number; max?: number },
  ) => {
    const nextValue = parseNumericDraft(rawValue, options);
    setSettingDrafts((currentDrafts) => ({
      ...currentDrafts,
      [field]: rawValue,
    }));
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: nextValue,
    }));
  };

  const normalizeSetting = (
    field: keyof BaseSettings,
    options?: { min?: number; max?: number },
  ) => {
    setSettingDrafts((currentDrafts) => ({
      ...currentDrafts,
      [field]: normalizeNumericDraft(currentDrafts[field], options),
    }));
  };

  const addTask = () => {
    const newTask = createTask();
    setTasks((currentTasks) => [...currentTasks, newTask]);
    setTaskHourDrafts((currentDrafts) => ({
      ...currentDrafts,
      [newTask.id]: createTaskDraftRecord(newTask),
    }));
  };

  const removeTask = (taskId: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    setTaskHourDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[taskId];
      return nextDrafts;
    });
  };

  const rotateFamiliarity = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, familiarity: cycleFamiliarity(task.familiarity) }
          : task,
      ),
    );
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-[#f6f6f4] text-[#2d2f2e]">
      <div className="mx-auto flex h-full w-full max-w-[402px] flex-col overflow-hidden border-x border-black/5 bg-[#f6f6f4] shadow-[0_24px_80px_rgba(45,47,46,0.12)]">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(246,246,244,0.82)] backdrop-blur-[20px]">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="font-heading text-[24px] font-extrabold tracking-[-1.2px] text-[#2d2f2e]">
              PERT Calculator
            </div>
          </div>
        </header>

        <main className="muted-scrollbar flex-1 overflow-y-auto">
          <div className="flex flex-col gap-8 px-6 pb-24 pt-7">
            <section className="rounded-[12px] border border-[rgba(172,173,172,0.15)] bg-white p-[25px] shadow-[0_20px_40px_rgba(45,47,46,0.06)]">
              <div className="text-[12px] uppercase tracking-[1.2px] text-[#435f6d]">
                Current Estimate
              </div>
              <div className="pt-1 font-heading text-[56px] font-extrabold leading-[56px] tracking-[-2.8px] text-[#2d2f2e]">
                {formatEstimate(summary.estimate)}
              </div>
              <div className="pt-3">
                <div className="text-[10.4px] uppercase leading-[15.6px] text-[#767776]">
                  Total Hours
                </div>
                <div className="font-heading text-[18px] font-bold leading-[28px] text-[#2d2f2e]">
                  {formatHours(summary.bufferedHours)}
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeading icon={<SettingsIcon />} title="Base Parameters" />
              <div className="grid grid-cols-2 gap-2 px-2">
                <ParameterCard
                  label="HOURLY RATE"
                  value={settingDrafts.hourlyRate}
                  onChange={(value) =>
                    updateSetting("hourlyRate", value, { min: 0 })
                  }
                  onBlur={() => normalizeSetting("hourlyRate", { min: 0 })}
                />
                <ParameterCard
                  label="BUFFER RISK"
                  value={settingDrafts.bufferRisk}
                  prefix="%"
                  onChange={(value) =>
                    updateSetting("bufferRisk", value, { min: 0, max: 100 })
                  }
                  onBlur={() =>
                    normalizeSetting("bufferRisk", { min: 0, max: 100 })
                  }
                />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <SectionHeading icon={<TasksIcon />} title="Project Tasks" />
                <button
                  type="button"
                  onClick={addTask}
                  className="inline-flex items-center gap-2 rounded-[6px] bg-[#2e70a6] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.6px] text-[#ffefeb] transition hover:bg-[#276493] active:translate-y-px"
                >
                  <PlusIcon />
                  New Task
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {tasks.length === 0 ? (
                  <div className="rounded-[12px] border border-dashed border-[#cfd2cf] bg-[rgba(240,241,239,0.65)] px-5 py-8 text-center text-sm text-[#767776]">
                    No tasks yet. Add a new task to start estimating.
                  </div>
                ) : null}

                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={() => removeTask(task.id)}
                    onCycleFamiliarity={() => rotateFamiliarity(task.id)}
                    onTitleChange={(value) => updateTaskTitle(task.id, value)}
                    hourDrafts={taskHourDrafts[task.id] ?? createTaskDraftRecord(task)}
                    onHoursChange={(field, value) =>
                      updateTaskHours(task.id, field, value)
                    }
                    onHoursBlur={(field) => normalizeTaskHours(task.id, field)}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="text-[#2d2f2e]">{icon}</span>
      <h2 className="font-heading text-[18px] font-bold tracking-[-0.45px] text-[#2d2f2e]">
        {title}
      </h2>
    </div>
  );
}

function ParameterCard({
  label,
  value,
  prefix,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  prefix?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="rounded-[12px] bg-[rgba(226,227,225,0.5)] p-4">
      <div className="text-[10.4px] uppercase tracking-[1.04px] text-[#5c5b5b]">
        {label}
      </div>
      <label className="mt-2 flex items-center gap-1">
        {prefix ? (
          <span className="text-[16px] font-semibold leading-6 text-[#2e70a6]">
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          min={0}
          max={label === "BUFFER RISK" ? 100 : undefined}
          step={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="font-heading min-w-0 flex-1 bg-transparent text-[24px] font-extrabold leading-8 text-[#2d2f2e] outline-none"
          aria-label={label}
        />
      </label>
    </div>
  );
}

function TaskCard({
  task,
  onDelete,
  onCycleFamiliarity,
  onTitleChange,
  hourDrafts,
  onHoursChange,
  onHoursBlur,
}: {
  task: Task;
  onDelete: () => void;
  onCycleFamiliarity: () => void;
  onTitleChange: (value: string) => void;
  hourDrafts: Record<HourFieldName, string>;
  onHoursChange: (field: HourFieldName, value: string) => void;
  onHoursBlur: (field: HourFieldName) => void;
}) {
  return (
    <article className="rounded-[12px] bg-[#f0f1ef] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <AutoResizeTextarea
            value={task.title}
            onChange={onTitleChange}
            ariaLabel="Task title"
            className="font-heading w-full bg-transparent text-[18px] font-bold leading-7 text-[#5a5c5b] outline-none placeholder:text-[#5a5c5b]/55"
          />
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#767776] transition hover:bg-white/60 hover:text-[#2d2f2e]"
          aria-label={`Delete ${task.title || "task"}`}
        >
          <TrashIcon />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <HoursField
          label="OPTIMISTIC"
          value={hourDrafts.optimisticHours}
          onChange={(value) => onHoursChange("optimisticHours", value)}
          onBlur={() => onHoursBlur("optimisticHours")}
        />
        <HoursField
          label="REALISTIC"
          value={hourDrafts.realisticHours}
          onChange={(value) => onHoursChange("realisticHours", value)}
          onBlur={() => onHoursBlur("realisticHours")}
        />
        <HoursField
          label="PESSIMISTIC"
          value={hourDrafts.pessimisticHours}
          onChange={(value) => onHoursChange("pessimisticHours", value)}
          onBlur={() => onHoursBlur("pessimisticHours")}
        />
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <button
          type="button"
          onClick={onCycleFamiliarity}
          className="inline-flex items-center gap-2 rounded-full bg-[rgba(220,221,219,0.5)] px-4 py-[6px] text-[11.2px] font-semibold uppercase tracking-[-0.28px] text-[#435f6d] transition hover:bg-[rgba(220,221,219,0.85)]"
          aria-label={`Cycle familiarity. Current: ${FAMILIARITY_LABELS[task.familiarity]}`}
        >
          <CycleIcon />
          {FAMILIARITY_LABELS[task.familiarity]}
        </button>

        <div className="text-right">
          <div className="text-[9.6px] uppercase leading-[14.4px] text-[#767776]">
            PERT Estimate
          </div>
          <div className="font-heading text-[16px] font-extrabold leading-6 text-[#2d2f2e]">
            {formatHours(calculateTaskPert(task))}
          </div>
        </div>
      </div>
    </article>
  );
}

function HoursField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9.6px] uppercase leading-[14.4px] text-[#767776]">
        {label}
      </div>
      <label className="flex items-center gap-1 rounded-[8px] bg-[#dcdddb] px-3 py-2">
        <input
          type="number"
          min={0}
          step={0.5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-label={label}
          className="font-heading min-w-0 flex-1 bg-transparent text-[14px] font-bold leading-5 text-[#2d2f2e] outline-none"
        />
        <span className="text-[10.4px] font-semibold leading-[15.6px] text-[#767776]">
          h
        </span>
      </label>
    </div>
  );
}

function AutoResizeTextarea({
  value,
  onChange,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    />
  );
}

function formatEstimate(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const formatted = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(1);

  return `${formatted}h`;
}

type HourFieldName =
  | "optimisticHours"
  | "realisticHours"
  | "pessimisticHours";

function createTaskHourDrafts(tasks: Task[]) {
  return Object.fromEntries(
    tasks.map((task) => [task.id, createTaskDraftRecord(task)]),
  ) as Record<string, Record<HourFieldName, string>>;
}

function createTaskDraftRecord(task: Task): Record<HourFieldName, string> {
  return {
    optimisticHours: String(task.optimisticHours),
    realisticHours: String(task.realisticHours),
    pessimisticHours: String(task.pessimisticHours),
  };
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M6.4 2.2h7.4M2.2 2.2h1.7m1.1 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 0 0-2.8 0Zm6.7 5.8h2.1m-11.6 0h6.3m1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 0 0-2.8 0Zm-4.2 5.8h7.4M2.2 13.8h1.7m1.1 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 0 0-2.8 0Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M3 3.3h9.8M3 8h9.8M3 12.7h9.8M1.8 3.3h.4M1.8 8h.4M1.8 12.7h.4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="10"
      height="10"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M2.8 4.2h10.4M6.2 2.8h3.6M5 4.2v7.2m3-7.2v7.2m3-7.2v7.2M4.3 4.2l.5 8.2c.05.84.74 1.5 1.58 1.5h3.28c.84 0 1.53-.66 1.58-1.5l.5-8.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CycleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M8 3a4.5 4.5 0 1 0 4.3 5.9M8 3V1.8M4.7 8H3.4m9.2.9 1.2.2-.3 1.2M9.7 5.2 12 7.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default App;
