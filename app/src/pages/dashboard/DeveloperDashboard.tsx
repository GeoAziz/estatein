import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Building2,
  ChevronLeft,
  Home as HomeIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  X,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { SkeletonRow, SkeletonStatCard } from "../../components/Skeleton";
import { useAuth } from "../../lib/auth-api";
import { apiClient } from "../../lib/api-client";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { unwrapList } from "../../lib/normalizers";
import { useModalA11y } from "../../lib/useModalA11y";
import SEO from "../../components/SEO";

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard/developer", icon: LayoutDashboard, end: true },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];

const CURRENCIES = ["KSH", "USD", "EUR", "GBP"] as const;
const PROJECT_STATUSES = ["planning", "under_construction", "completed", "on_hold", "cancelled"] as const;
const UNIT_STATUSES = ["available", "reserved", "sold", "under_offer"] as const;

const PROJECT_STATUS_STYLES: Record<string, string> = {
  planning: "border-amber-500/50 text-amber-400",
  under_construction: "border-blue-500/50 text-blue-400",
  completed: "border-emerald-500/50 text-emerald-400",
  on_hold: "border-white/20 text-muted",
  cancelled: "border-red-500/50 text-red-400",
};

const UNIT_STATUS_STYLES: Record<string, string> = {
  available: "border-emerald-500/50 text-emerald-400",
  reserved: "border-amber-500/50 text-amber-400",
  sold: "border-white/20 text-muted",
  under_offer: "border-blue-500/50 text-blue-400",
};

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  city: string;
  county: string;
  totalUnits: number;
  availableUnits: number;
  startingPrice: number | null;
  currency: string;
  photos: string[];
  status: string;
  launchDate: string;
  completionDate: string;
  features: string[];
  amenities: string[];
};

type Phase = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  phaseNumber: number;
  totalUnits: number;
  availableUnits: number;
  startingPrice: number | null;
  status: string;
  launchDate: string;
  completionDate: string;
};

type Unit = {
  id: string;
  phaseId: string;
  unitNumber: string;
  unitType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqFt: number | null;
  floor: number | null;
  price: number;
  currency: string;
  status: string;
  features: string[];
  photos: string[];
};

function toDateInput(v?: string | null) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function mapProject(p: any): Project {
  return {
    id: p.id,
    name: p.name || "",
    slug: p.slug || "",
    description: p.description || "",
    location: p.location || "",
    city: p.city || "",
    county: p.county || "",
    totalUnits: p.totalUnits ?? 0,
    availableUnits: p.availableUnits ?? 0,
    startingPrice: p.startingPrice ?? null,
    currency: p.currency || "KSH",
    photos: p.photos || [],
    status: p.status || "planning",
    launchDate: toDateInput(p.launchDate),
    completionDate: toDateInput(p.completionDate),
    features: p.features || [],
    amenities: p.amenities || [],
  };
}

function mapPhase(p: any): Phase {
  return {
    id: p.id,
    projectId: p.projectId,
    name: p.name || "",
    description: p.description || "",
    phaseNumber: p.phaseNumber ?? 0,
    totalUnits: p.totalUnits ?? 0,
    availableUnits: p.availableUnits ?? 0,
    startingPrice: p.startingPrice ?? null,
    status: p.status || "planning",
    launchDate: toDateInput(p.launchDate),
    completionDate: toDateInput(p.completionDate),
  };
}

function mapUnit(u: any): Unit {
  return {
    id: u.id,
    phaseId: u.phaseId,
    unitNumber: u.unitNumber || "",
    unitType: u.unitType || "",
    bedrooms: u.bedrooms ?? null,
    bathrooms: u.bathrooms ?? null,
    sqFt: u.sqFt ?? null,
    floor: u.floor ?? null,
    price: u.price ?? 0,
    currency: u.currency || "KSH",
    status: u.status || "available",
    features: u.features || [],
    photos: u.photos || [],
  };
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) return "N/A";
  return `${currency} ${Number(amount).toLocaleString()}`;
}

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phasesLoading, setPhasesLoading] = useState(false);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const [projectModal, setProjectModal] = useState<{ open: boolean; editing: Project | null }>({ open: false, editing: null });
  const [phaseModal, setPhaseModal] = useState<{ open: boolean; editing: Phase | null }>({ open: false, editing: null });
  const [unitModal, setUnitModal] = useState<{ open: boolean; editing: Unit | null }>({ open: false, editing: null });

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await apiClient.getDeveloperProjects({ developerId: user.id, limit: 100 } as any);
      setProjects(unwrapList(result, "projects").map(mapProject));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchPhases = useCallback(async (projectId: string) => {
    setPhasesLoading(true);
    try {
      const result = await apiClient.getPhasesByProject(projectId);
      setPhases(unwrapList(result, "phases").map(mapPhase));
    } catch {
      setPhases([]);
    } finally {
      setPhasesLoading(false);
    }
  }, []);

  const fetchUnits = useCallback(async (phaseId: string) => {
    setUnitsLoading(true);
    try {
      const result = await apiClient.getUnitsByPhase(phaseId);
      setUnits(unwrapList(result, "units").map(mapUnit));
    } catch {
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  function selectProject(id: string) {
    setSelectedProjectId(id);
    setSelectedPhaseId(null);
    setUnits([]);
    fetchPhases(id);
  }

  function selectPhase(id: string) {
    setSelectedPhaseId(id);
    fetchUnits(id);
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;
  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || null;

  const totalUnits = projects.reduce((sum, p) => sum + p.totalUnits, 0);
  const availableUnits = projects.reduce((sum, p) => sum + p.availableUnits, 0);
  const soldOrReserved = Math.max(totalUnits - availableUnits, 0);

  const STATS = [
    { label: "Total Projects", value: projects.length, icon: Building2 },
    { label: "Total Units", value: totalUnits, icon: Package },
    { label: "Available Units", value: availableUnits, icon: HomeIcon },
    { label: "Sold / Reserved", value: soldOrReserved, icon: Layers },
  ];

  // --- Project CRUD ---
  async function handleSaveProject(payload: any) {
    try {
      if (projectModal.editing) {
        const result = await apiClient.updateDeveloperProject(projectModal.editing.id, payload);
        const updated = mapProject(result?.project ?? result);
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast("success", "Project updated");
      } else {
        const result = await apiClient.createDeveloperProject(payload);
        const created = mapProject(result?.project ?? result);
        setProjects((prev) => [created, ...prev]);
        showToast("success", "Project created");
      }
      setProjectModal({ open: false, editing: null });
    } catch (error: any) {
      showToast("error", error?.message || "Failed to save project");
    }
  }

  async function handleDeleteProject(project: Project) {
    const ok = await confirm({
      title: "Delete this project?",
      message: `"${project.name}" and all its phases and units will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deleteDeveloperProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      if (selectedProjectId === project.id) {
        setSelectedProjectId(null);
        setSelectedPhaseId(null);
      }
      showToast("success", "Project deleted");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to delete project");
    }
  }

  // --- Phase CRUD ---
  async function handleSavePhase(payload: any) {
    if (!selectedProjectId) return;
    try {
      if (phaseModal.editing) {
        const result = await apiClient.updatePhase(phaseModal.editing.id, payload);
        const updated = mapPhase(result?.phase ?? result);
        setPhases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast("success", "Phase updated");
      } else {
        const result = await apiClient.createPhase(selectedProjectId, payload);
        const created = mapPhase(result?.phase ?? result);
        setPhases((prev) => [...prev, created]);
        showToast("success", "Phase created");
      }
      setPhaseModal({ open: false, editing: null });
    } catch (error: any) {
      showToast("error", error?.message || "Failed to save phase");
    }
  }

  async function handleDeletePhase(phase: Phase) {
    const ok = await confirm({
      title: "Delete this phase?",
      message: `"${phase.name}" and all its units will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deletePhase(phase.id);
      setPhases((prev) => prev.filter((p) => p.id !== phase.id));
      if (selectedPhaseId === phase.id) setSelectedPhaseId(null);
      showToast("success", "Phase deleted");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to delete phase");
    }
  }

  // --- Unit CRUD ---
  async function handleSaveUnit(payload: any) {
    if (!selectedPhaseId) return;
    try {
      if (unitModal.editing) {
        const result = await apiClient.updateUnit(unitModal.editing.id, payload);
        const updated = mapUnit(result?.unit ?? result);
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast("success", "Unit updated");
      } else {
        const result = await apiClient.createUnit(selectedPhaseId, payload);
        const created = mapUnit(result?.unit ?? result);
        setUnits((prev) => [...prev, created]);
        showToast("success", "Unit created");
      }
      setUnitModal({ open: false, editing: null });
    } catch (error: any) {
      showToast("error", error?.message || "Failed to save unit");
    }
  }

  async function handleDeleteUnit(unit: Unit) {
    const ok = await confirm({
      title: "Delete this unit?",
      message: `Unit "${unit.unitNumber}" will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.deleteUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      showToast("success", "Unit deleted");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to delete unit");
    }
  }

  async function handleReserveUnit(unit: Unit) {
    try {
      const result = await apiClient.reserveUnit(unit.id);
      const updated = mapUnit(result?.unit ?? result);
      setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast("success", "Unit marked as reserved");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to reserve unit");
    }
  }

  return (
    <DashboardLayout navItems={NAV}>
      <SEO title="Developer Dashboard" description="Manage your development projects, phases, and units, and track sales progress on Estatein." />
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welcome, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-base text-muted">Manage your development projects, phases, and units.</p>
        </div>
        <button
          onClick={() => setProjectModal({ open: true, editing: null })}
          className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-[14px] text-base font-medium text-white hover:bg-primary/90"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 rounded-xl border border-border p-6">
                <stat.icon className="text-primary-text" size={22} />
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
            ))}
      </div>

      {/* Breadcrumb */}
      {(selectedProject || selectedPhase) && (
        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted">
          <button
            onClick={() => {
              setSelectedProjectId(null);
              setSelectedPhaseId(null);
            }}
            className="flex items-center gap-1 font-medium text-white hover:text-primary-text"
          >
            <ChevronLeft size={14} /> Projects
          </button>
          {selectedProject && (
            <>
              <span>/</span>
              <button
                onClick={() => setSelectedPhaseId(null)}
                className={`font-medium hover:text-primary-text ${selectedPhaseId ? "text-white" : "text-primary-text"}`}
              >
                {selectedProject.name}
              </button>
            </>
          )}
          {selectedPhase && (
            <>
              <span>/</span>
              <span className="font-medium text-primary-text">{selectedPhase.name}</span>
            </>
          )}
        </div>
      )}

      {/* Projects list */}
      {!selectedProjectId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">My Projects</h2>
          {loading ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="mt-6 rounded-xl border border-border p-10 text-center text-base text-muted">
              No projects yet — create your first development project.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="flex flex-col gap-4 rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-white">{p.name}</span>
                      <span className="text-sm text-muted">{p.location}, {p.city}</span>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${PROJECT_STATUS_STYLES[p.status] || PROJECT_STATUS_STYLES.planning}`}>
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted">
                    <span>{p.availableUnits}/{p.totalUnits} available</span>
                    <span>{formatMoney(p.startingPrice, p.currency)}</span>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => selectProject(p.id)}
                      className="rounded-[10px] border border-primary px-4 py-2 text-sm font-medium text-primary-text hover:bg-primary/10"
                    >
                      View Phases
                    </button>
                    <button
                      onClick={() => setProjectModal({ open: true, editing: p })}
                      className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p)}
                      aria-label="Delete project"
                      className="ml-auto flex h-9 w-9 items-center justify-center text-muted hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phases list */}
      {selectedProject && !selectedPhaseId && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Phases</h2>
            <button
              onClick={() => setPhaseModal({ open: true, editing: null })}
              className="flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus size={16} /> New Phase
            </button>
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border text-sm text-muted">
                  <th className="p-4 font-medium">#</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Units</th>
                  <th className="p-4 font-medium">Starting Price</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {phasesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                ) : phases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted">No phases yet — add the first phase.</td>
                  </tr>
                ) : (
                  phases.map((ph) => (
                    <tr key={ph.id} className="border-b border-border text-sm last:border-0">
                      <td className="p-4 text-muted">{ph.phaseNumber}</td>
                      <td className="p-4 font-medium text-white">{ph.name}</td>
                      <td className="p-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${PROJECT_STATUS_STYLES[ph.status] || PROJECT_STATUS_STYLES.planning}`}>
                          {ph.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-muted">{ph.availableUnits}/{ph.totalUnits}</td>
                      <td className="p-4 text-muted">{formatMoney(ph.startingPrice, selectedProject.currency)}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <button onClick={() => selectPhase(ph.id)} className="text-xs font-medium text-primary-text underline underline-offset-4">
                            View Units
                          </button>
                          <button onClick={() => setPhaseModal({ open: true, editing: ph })} className="text-xs font-medium text-white underline underline-offset-4 hover:text-primary-text">
                            Edit
                          </button>
                          <button onClick={() => handleDeletePhase(ph)} aria-label="Delete phase" className="flex h-8 w-8 items-center justify-center text-muted hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Units table */}
      {selectedProject && selectedPhase && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Units</h2>
            <button
              onClick={() => setUnitModal({ open: true, editing: null })}
              className="flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus size={16} /> New Unit
            </button>
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-border text-sm text-muted">
                  <th className="p-4 font-medium">Unit #</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Bed / Bath</th>
                  <th className="p-4 font-medium">Sq Ft</th>
                  <th className="p-4 font-medium">Floor</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unitsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted">No units yet — add the first unit.</td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr key={u.id} className="border-b border-border text-sm last:border-0">
                      <td className="p-4 font-medium text-white">{u.unitNumber}</td>
                      <td className="p-4 text-muted">{u.unitType}</td>
                      <td className="p-4 text-muted">{u.bedrooms ?? "-"} bd / {u.bathrooms ?? "-"} ba</td>
                      <td className="p-4 text-muted">{u.sqFt ?? "-"}</td>
                      <td className="p-4 text-muted">{u.floor ?? "-"}</td>
                      <td className="p-4 text-muted">{formatMoney(u.price, u.currency)}</td>
                      <td className="p-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${UNIT_STATUS_STYLES[u.status] || UNIT_STATUS_STYLES.available}`}>
                          {u.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {u.status === "available" && (
                            <button onClick={() => handleReserveUnit(u)} className="text-xs font-medium text-amber-400 underline underline-offset-4">
                              Reserve
                            </button>
                          )}
                          <button onClick={() => setUnitModal({ open: true, editing: u })} className="text-xs font-medium text-white underline underline-offset-4 hover:text-primary-text">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteUnit(u)} aria-label="Delete unit" className="flex h-8 w-8 items-center justify-center text-muted hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {projectModal.open && (
        <ProjectFormModal
          initial={projectModal.editing}
          onClose={() => setProjectModal({ open: false, editing: null })}
          onSubmit={handleSaveProject}
        />
      )}
      {phaseModal.open && (
        <PhaseFormModal
          initial={phaseModal.editing}
          onClose={() => setPhaseModal({ open: false, editing: null })}
          onSubmit={handleSavePhase}
        />
      )}
      {unitModal.open && (
        <UnitFormModal
          initial={unitModal.editing}
          onClose={() => setUnitModal({ open: false, editing: null })}
          onSubmit={handleSaveUnit}
        />
      )}
    </DashboardLayout>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(dialogRef, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in flex h-full w-full max-w-lg flex-col gap-6 overflow-y-auto border border-border bg-base p-6 shadow-2xl focus:outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center text-subtle hover:text-white">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = "h-11 rounded-lg border border-border bg-transparent px-4 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-sm text-muted";

function ProjectFormModal({ initial, onClose, onSubmit }: { initial: Project | null; onClose: () => void; onSubmit: (payload: any) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [county, setCounty] = useState(initial?.county ?? "");
  const [totalUnits, setTotalUnits] = useState(String(initial?.totalUnits ?? ""));
  const [startingPrice, setStartingPrice] = useState(String(initial?.startingPrice ?? ""));
  const [currency, setCurrency] = useState(initial?.currency ?? "KSH");
  const [status, setStatus] = useState(initial?.status ?? "planning");
  const [launchDate, setLaunchDate] = useState(initial?.launchDate ?? "");
  const [completionDate, setCompletionDate] = useState(initial?.completionDate ?? "");
  const [features, setFeatures] = useState((initial?.features ?? []).join(", "));
  const [amenities, setAmenities] = useState((initial?.amenities ?? []).join(", "));
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length > 0 && location.trim().length > 0 && city.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim(),
      city: city.trim(),
      county: county.trim() || undefined,
      totalUnits: totalUnits ? Number(totalUnits) : undefined,
      startingPrice: startingPrice ? Number(startingPrice) : undefined,
      currency,
      status,
      launchDate: launchDate || undefined,
      completionDate: completionDate || undefined,
      features: parseCsv(features),
      amenities: parseCsv(amenities),
    });
    setSubmitting(false);
  }

  return (
    <ModalShell title={initial ? "Edit Project" : "New Project"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Project Name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Location *</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>City *</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>County</span>
            <input value={county} onChange={(e) => setCounty(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Total Units</span>
            <input type="number" min={0} value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Starting Price</span>
            <input type="number" min={0} value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-base text-white">{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelTextClass}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-base text-white capitalize">{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Launch Date</span>
            <input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Completion Date</span>
            <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelTextClass}>Features (comma separated)</span>
          <input value={features} onChange={(e) => setFeatures(e.target.value)} className={inputClass} placeholder="Gated community, Solar backup" />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Amenities (comma separated)</span>
          <input value={amenities} onChange={(e) => setAmenities(e.target.value)} className={inputClass} placeholder="Gym, Pool, Playground" />
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border border-border py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text">
            Cancel
          </button>
          <button type="submit" disabled={!isValid || submitting} className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {initial ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PhaseFormModal({ initial, onClose, onSubmit }: { initial: Phase | null; onClose: () => void; onSubmit: (payload: any) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [phaseNumber, setPhaseNumber] = useState(String(initial?.phaseNumber ?? ""));
  const [totalUnits, setTotalUnits] = useState(String(initial?.totalUnits ?? ""));
  const [startingPrice, setStartingPrice] = useState(String(initial?.startingPrice ?? ""));
  const [status, setStatus] = useState(initial?.status ?? "planning");
  const [launchDate, setLaunchDate] = useState(initial?.launchDate ?? "");
  const [completionDate, setCompletionDate] = useState(initial?.completionDate ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length > 0 && phaseNumber.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      phaseNumber: Number(phaseNumber),
      totalUnits: totalUnits ? Number(totalUnits) : undefined,
      startingPrice: startingPrice ? Number(startingPrice) : undefined,
      status,
      launchDate: launchDate || undefined,
      completionDate: completionDate || undefined,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell title={initial ? "Edit Phase" : "New Phase"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Phase Name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Phase Number *</span>
            <input type="number" min={1} value={phaseNumber} onChange={(e) => setPhaseNumber(e.target.value)} className={inputClass} required />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelTextClass}>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Total Units</span>
            <input type="number" min={0} value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Starting Price</span>
            <input type="number" min={0} value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelTextClass}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-base text-white capitalize">{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Launch Date</span>
            <input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Completion Date</span>
            <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border border-border py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text">
            Cancel
          </button>
          <button type="submit" disabled={!isValid || submitting} className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {initial ? "Save Changes" : "Create Phase"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function UnitFormModal({ initial, onClose, onSubmit }: { initial: Unit | null; onClose: () => void; onSubmit: (payload: any) => Promise<void> }) {
  const [unitNumber, setUnitNumber] = useState(initial?.unitNumber ?? "");
  const [unitType, setUnitType] = useState(initial?.unitType ?? "");
  const [bedrooms, setBedrooms] = useState(String(initial?.bedrooms ?? ""));
  const [bathrooms, setBathrooms] = useState(String(initial?.bathrooms ?? ""));
  const [sqFt, setSqFt] = useState(String(initial?.sqFt ?? ""));
  const [floor, setFloor] = useState(String(initial?.floor ?? ""));
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [currency, setCurrency] = useState(initial?.currency ?? "KSH");
  const [status, setStatus] = useState(initial?.status ?? "available");
  const [features, setFeatures] = useState((initial?.features ?? []).join(", "));
  const [submitting, setSubmitting] = useState(false);

  const isValid = unitNumber.trim().length > 0 && unitType.trim().length > 0 && price.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    await onSubmit({
      unitNumber: unitNumber.trim(),
      unitType: unitType.trim(),
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      sqFt: sqFt ? Number(sqFt) : undefined,
      floor: floor ? Number(floor) : undefined,
      price: Number(price),
      currency,
      status,
      features: parseCsv(features),
    });
    setSubmitting(false);
  }

  return (
    <ModalShell title={initial ? "Edit Unit" : "New Unit"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Unit Number *</span>
            <input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Unit Type *</span>
            <input value={unitType} onChange={(e) => setUnitType(e.target.value)} className={inputClass} placeholder="2 Bedroom Apartment" required />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className={labelClass}>
            <span className={labelTextClass}>Beds</span>
            <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Baths</span>
            <input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Sq Ft</span>
            <input type="number" min={0} value={sqFt} onChange={(e) => setSqFt(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Floor</span>
            <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>Price *</span>
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-base text-white">{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelTextClass}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {UNIT_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-base text-white capitalize">{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Features (comma separated)</span>
          <input value={features} onChange={(e) => setFeatures(e.target.value)} className={inputClass} placeholder="Balcony, En-suite" />
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border border-border py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text">
            Cancel
          </button>
          <button type="submit" disabled={!isValid || submitting} className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {initial ? "Save Changes" : "Create Unit"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
