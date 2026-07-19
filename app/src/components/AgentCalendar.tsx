import { useEffect, useState, useCallback } from "react";
import { Calendar, Plus, Trash2, X } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { Skeleton } from "./Skeleton";

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AgentCalendar({ agentId }: { agentId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 7).toISOString();
      const result = await apiClient.getAvailabilitySlots(agentId, from, to);
      setSlots(result?.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [agentId, weekStart]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  async function handleAddSlot(dateKey: string) {
    if (!newStart || !newEnd) return;
    setSaving(true);
    try {
      await apiClient.createAvailabilitySlots([
        { date: new Date(dateKey).toISOString(), startTime: newStart, endTime: newEnd },
      ]);
      setAddingFor(null);
      setNewStart("09:00");
      setNewEnd("10:00");
      await fetchSlots();
    } catch {
      // Surfaced by lack of new slot appearing; keep it simple here
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSlot(id: string) {
    setSaving(true);
    try {
      await apiClient.deleteAvailabilitySlot(id);
      await fetchSlots();
    } finally {
      setSaving(false);
    }
  }

  const slotsByDay = weekDays.reduce<Record<string, Slot[]>>((acc, day) => {
    const key = formatDateKey(day);
    acc[key] = slots.filter((s) => s.date.slice(0, 10) === key);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-primary-text" size={20} />
          <h2 className="text-lg font-semibold text-white">Availability Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-white hover:border-primary hover:text-primary-text"
          >
            Previous
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-white hover:border-primary hover:text-primary-text"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-white hover:border-primary hover:text-primary-text"
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const daySlots = slotsByDay[dateKey] || [];
            const isToday = formatDateKey(new Date()) === dateKey;
            return (
              <div
                key={dateKey}
                className={`flex min-h-[160px] flex-col gap-2 rounded-lg border p-3 ${isToday ? "border-primary" : "border-border"}`}
              >
                <div className="flex flex-col">
                  <span className="text-xs text-subtle">{WEEKDAY_LABELS[day.getDay()]}</span>
                  <span className="text-sm font-medium text-white">{day.getDate()}</span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between rounded-md border px-2 py-1 text-xs ${
                        slot.isBooked
                          ? "border-primary/40 bg-primary/10 text-primary-text"
                          : "border-border text-muted"
                      }`}
                    >
                      <span>
                        {slot.startTime}–{slot.endTime}
                      </span>
                      {!slot.isBooked && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={saving}
                          className="text-subtle hover:text-red-400"
                          aria-label="Delete slot"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {addingFor === dateKey ? (
                  <div className="flex flex-col gap-1.5 rounded-md border border-border p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={newStart}
                        onChange={(e) => setNewStart(e.target.value)}
                        className="w-full rounded border border-border bg-transparent px-1 py-0.5 text-xs text-white focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs text-subtle">–</span>
                      <input
                        type="time"
                        value={newEnd}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="w-full rounded border border-border bg-transparent px-1 py-0.5 text-xs text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAddSlot(dateKey)}
                        disabled={saving}
                        className="flex-1 rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingFor(null)}
                        className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingFor(dateKey)}
                    className="flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-xs text-subtle hover:border-primary hover:text-primary-text"
                  >
                    <Plus size={12} /> Add slot
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
