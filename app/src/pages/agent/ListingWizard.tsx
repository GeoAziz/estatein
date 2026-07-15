import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, ImagePlus, Loader2, Minus, Plus, X } from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import {
  BarChart3,
  Calendar,
  Home as HomeIcon,
  LayoutDashboard,
  MessageSquare,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "../../lib/auth-api";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { apiClient } from "../../lib/api-client";
import Confetti from "../../components/Confetti";

const MAX_PHOTO_MB = 5;
const MAX_PHOTOS = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type AgentListing = {
  id: string;
  agentId: string;
  name: string;
  street: string;
  city: string;
  neighborhood?: string;
  postalCode?: string;
  propertyType: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  status: "For Sale" | "For Rent";
  listingStatus: string;
  leaseTerm?: string;
  photos: string[];
  video?: string;
  description: string;
  features: string[];
  amenities: string[];
  yearBuilt?: string;
  condition: string;
  views: number;
  favorites: number;
  inquiries: number;
  createdAt: string;
};

function generateId() {
  return `listing_${Math.random().toString(36).slice(2, 10)}`;
}

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard/agent", icon: LayoutDashboard },
  { label: "My Listings", to: "/agent/listings", icon: HomeIcon },
  { label: "Inquiries", to: "/agent/messages", icon: MessageSquare },
  { label: "Scheduled Viewings", to: "/dashboard/agent#viewings", icon: Calendar },
  { label: "Analytics", to: "/dashboard/agent#analytics", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];

const FEATURES = [
  "Air Conditioning", "Balcony", "Basement", "Built-in Closets", "Deck", "Fireplace",
  "Garage", "Hardwood Floors", "Heating", "Kitchen Island", "Laundry", "Outdoor Space",
  "Parking", "Pool", "Renovated Kitchen", "Renovated Bathroom", "Storage", "Swimming Pool",
  "Tennis Court", "Terrace",
];

const AMENITIES = ["Furnished", "Pet Friendly", "Utilities Included", "WiFi Included", "Gym", "Security", "Maintenance Included"];

const CONDITIONS = ["New", "Like New", "Excellent", "Good", "Fair", "Needs Repair"];

const STEP_LABELS = ["Basic Info", "Photos", "Details", "Review"];

function emptyDraft(agentId: string): AgentListing {
  return {
    id: generateId(),
    agentId,
    name: "",
    street: "",
    city: "",
    neighborhood: "",
    postalCode: "",
    propertyType: "House",
    price: "",
    beds: 1,
    baths: 1,
    area: "",
    status: "For Sale",
    listingStatus: "pending",
    leaseTerm: "",
    photos: [],
    video: "",
    description: "",
    features: [],
    amenities: [],
    yearBuilt: "",
    condition: "Excellent",
    views: 0,
    favorites: 0,
    inquiries: 0,
    createdAt: new Date().toISOString(),
  };
}

type PhotoFile = { url: string; sizeMb: number; uploading: boolean };

export default function ListingWizard() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AgentListing>(() => emptyDraft(user?.id ?? ""));
  const [photoMeta, setPhotoMeta] = useState<PhotoFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [confirmRight, setConfirmRight] = useState(false);
  const [touchedStep1, setTouchedStep1] = useState(false);
  const [touchedStep3, setTouchedStep3] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      apiClient.getListings().then((result) => {
        const items = Array.isArray(result) ? result : result?.listings || [];
        const existing = items.find((l: any) => l.id === id);
        if (existing) {
          setDraft({
            ...existing,
            price: existing.price ? `$${Number(existing.price).toLocaleString()}` : "",
            status: existing.status || "For Sale",
            listingStatus: existing.listingStatus || existing.status || "pending",
            photos: existing.photos || existing.images || [],
            features: existing.features || [],
            amenities: existing.amenities || [],
          });
          setPhotoMeta((existing.photos || existing.images || []).map((url: string) => ({ url, sizeMb: 0, uploading: false })));
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update<K extends keyof AgentListing>(key: K, value: AgentListing[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleFromList(key: "features" | "amenities", value: string) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));
  }

  // --- Step 1 validation ---
  const step1Errors = {
    name: !draft.name.trim() ? "Property name is required" : "",
    street: !draft.street.trim() ? "Street address is required" : "",
    city: !draft.city.trim() ? "City is required" : "",
    price: !draft.price || Number(draft.price.replace(/[^0-9]/g, "")) <= 0 ? "Enter a price greater than 0" : "",
  };
  const step1Valid = Object.values(step1Errors).every((e) => !e);

  function handleContinueFromStep1() {
    setTouchedStep1(true);
    if (step1Valid) setStep(2);
  }

  // --- Step 2: photo upload ---
  async function uploadOne(file: File) {
    const localUrl = URL.createObjectURL(file);
    const sizeMb = file.size / (1024 * 1024);
    setPhotoMeta((prev) => [...prev, { url: localUrl, sizeMb, uploading: true }]);
    setDraft((d) => ({ ...d, photos: [...d.photos, localUrl] }));

    try {
      const { url } = await apiClient.uploadFile(file, "listings");
      setPhotoMeta((prev) => prev.map((p) => (p.url === localUrl ? { ...p, url, uploading: false } : p)));
      setDraft((d) => ({ ...d, photos: d.photos.map((p) => (p === localUrl ? url : p)) }));
    } catch (err: any) {
      setUploadError(err.message || `Failed to upload "${file.name}". Please try again.`);
      setPhotoMeta((prev) => prev.filter((p) => p.url !== localUrl));
      setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p !== localUrl) }));
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError("");
    const remaining = MAX_PHOTOS - photoMeta.length;
    if (remaining <= 0) {
      setUploadError(`You've reached the ${MAX_PHOTOS}-photo limit.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" isn't a supported format. Use JPG, PNG, or WEBP.`);
        continue;
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_PHOTO_MB) {
        setUploadError(`"${file.name}" is ${sizeMb.toFixed(1)}MB — max size is ${MAX_PHOTO_MB}MB.`);
        continue;
      }
      accepted.push(file);
    }

    accepted.forEach((file) => {
      uploadOne(file);
    });
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  async function removePhoto(index: number) {
    const ok = await confirm({
      title: "Remove this photo?",
      message: "This photo will be removed from the listing.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setDraft((d) => ({ ...d, photos: d.photos.filter((_, i) => i !== index) }));
    setPhotoMeta((prev) => prev.filter((_, i) => i !== index));
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.photos.length) return;
    setDraft((d) => {
      const next = [...d.photos];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, photos: next };
    });
    setPhotoMeta((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const totalSizeMb = photoMeta.reduce((sum, p) => sum + p.sizeMb, 0);
  const anyUploading = photoMeta.some((p) => p.uploading);

  // --- Step 3 validation ---
  const step3Errors = {
    description: !draft.description.trim() ? "Description is required" : "",
  };
  const step3Valid = Object.values(step3Errors).every((e) => !e);

  function handleContinueFromStep3() {
    setTouchedStep3(true);
    if (step3Valid) setStep(4);
  }

  async function handlePublish() {
    if (!user || anyUploading) return;
    setPublishing(true);
    try {
      const payload = {
        ...draft,
        photos: draft.photos.filter((p) => !p.startsWith("blob:")),
        price: Number(draft.price.replace(/[^0-9]/g, "")),
        bedrooms: draft.beds,
        bathrooms: draft.baths,
        propertyType: draft.propertyType,
        status: isEdit ? draft.listingStatus : "pending",
      };

      if (isEdit && id) {
        await apiClient.updateListing(id, payload);
      } else {
        await apiClient.createListing(payload);
      }

      setPublishing(false);
      setPublished(true);
      showToast("success", isEdit ? "Listing updated successfully" : "Listing published successfully");
    } catch (error: any) {
      setPublishing(false);
      showToast("error", error.message || "Failed to publish listing");
    }
  }

  if (published) {
    return (
      <DashboardLayout navItems={NAV}>
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-4 overflow-hidden rounded-xl border border-border p-10 text-center">
          {!isEdit && <Confetti />}
          <CheckCircle2 className="text-primary-text" size={48} />
          <h1 className="text-2xl font-semibold text-white">
            {isEdit ? "Listing Updated Successfully" : "Listing Published!"}
          </h1>
          <p className="text-base text-muted">
            {isEdit
              ? "Your changes have been saved."
              : "Your property is now live on Estatein. It will appear after admin approval."}
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/agent/listings")}
              className="flex-1 rounded-[10px] bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
            {!isEdit && (
              <button
                onClick={() => {
                  setDraft(emptyDraft(user?.id ?? ""));
                  setPhotoMeta([]);
                  setStep(1);
                  setPublished(false);
                  setConfirmAccurate(false);
                  setConfirmTerms(false);
                  setConfirmRight(false);
                  setTouchedStep1(false);
                  setTouchedStep3(false);
                }}
                className="flex-1 rounded-[10px] border border-border px-6 py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text"
              >
                Add Another Property
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={NAV}>
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">
        {isEdit ? "Edit Your Listing" : "Add New Property"}
      </h1>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-white/10"}`} />
            <span className={`text-xs font-medium ${i + 1 <= step ? "text-white" : "text-subtle"}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="mt-10 flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            <p className="text-sm text-muted">Tell us about the property</p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">
              Property Name <span className="text-red-400">*</span>
            </span>
            <input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={() => setTouchedStep1(true)}
              placeholder="e.g. Seaside Serenity Villa"
              aria-invalid={touchedStep1 && Boolean(step1Errors.name)}
              className={`h-12 rounded-lg border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:outline-none ${
                touchedStep1 && step1Errors.name ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
            {touchedStep1 && step1Errors.name && <span className="text-xs text-red-400">{step1Errors.name}</span>}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Property Type</span>
            <select
              value={draft.propertyType}
              onChange={(e) => update("propertyType", e.target.value)}
              className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white focus:outline-none"
            >
              {["House", "Apartment", "Townhouse", "Plot", "Commercial", "Other"].map((t) => (
                <option key={t} value={t} className="bg-base text-white">
                  {t}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                Street Address <span className="text-red-400">*</span>
              </span>
              <input
                value={draft.street}
                onChange={(e) => update("street", e.target.value)}
                onBlur={() => setTouchedStep1(true)}
                placeholder="123 Main St"
                aria-invalid={touchedStep1 && Boolean(step1Errors.street)}
                className={`h-12 rounded-lg border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:outline-none ${
                  touchedStep1 && step1Errors.street ? "border-red-500" : "border-border focus:border-primary"
                }`}
              />
              {touchedStep1 && step1Errors.street && <span className="text-xs text-red-400">{step1Errors.street}</span>}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                City <span className="text-red-400">*</span>
              </span>
              <input
                value={draft.city}
                onChange={(e) => update("city", e.target.value)}
                onBlur={() => setTouchedStep1(true)}
                placeholder="Malibu, California"
                aria-invalid={touchedStep1 && Boolean(step1Errors.city)}
                className={`h-12 rounded-lg border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:outline-none ${
                  touchedStep1 && step1Errors.city ? "border-red-500" : "border-border focus:border-primary"
                }`}
              />
              {touchedStep1 && step1Errors.city && <span className="text-xs text-red-400">{step1Errors.city}</span>}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted">Neighborhood (optional)</span>
              <input
                value={draft.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted">Postal Code (optional)</span>
              <input
                value={draft.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">
              Price <span className="text-red-400">*</span>
            </span>
            <div
              className={`flex h-12 items-center gap-2 rounded-lg border px-4 focus-within:border-primary ${
                touchedStep1 && step1Errors.price ? "border-red-500" : "border-border"
              }`}
            >
              <span className="text-subtle">$</span>
              <input
                value={draft.price.replace(/[^0-9]/g, "")}
                onChange={(e) => update("price", e.target.value ? `$${Number(e.target.value).toLocaleString()}` : "")}
                onBlur={() => setTouchedStep1(true)}
                inputMode="numeric"
                placeholder="450,000"
                className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
              />
            </div>
            {touchedStep1 && step1Errors.price && <span className="text-xs text-red-400">{step1Errors.price}</span>}
          </label>

          <div className="grid grid-cols-2 gap-6">
            {(["beds", "baths"] as const).map((field) => (
              <label key={field} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white capitalize">{field === "beds" ? "Bedrooms" : "Bathrooms"}</span>
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => update(field, Math.max(0, draft[field] - 1))}
                    aria-label={`Decrease ${field}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-white hover:border-primary"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-base font-medium text-white">{draft[field]}</span>
                  <button
                    type="button"
                    onClick={() => update(field, draft[field] + 1)}
                    aria-label={`Increase ${field}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-white hover:border-primary"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </label>
            ))}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Square Footage / Area</span>
            <input
              value={draft.area}
              onChange={(e) => update("area", e.target.value)}
              placeholder="2,500 sq ft"
              className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Property Status</span>
            <div className="flex gap-3">
              {(["For Sale", "For Rent"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update("status", s)}
                  className={`min-h-[44px] rounded-[10px] border px-6 py-3 text-sm font-medium transition ${
                    draft.status === s ? "border-primary text-primary-text" : "border-border text-muted hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {draft.status === "For Rent" && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Lease Term</span>
              <select
                value={draft.leaseTerm}
                onChange={(e) => update("leaseTerm", e.target.value)}
                className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white focus:outline-none"
              >
                {["Month-to-month", "3 months", "6 months", "1 year", "Other"].map((t) => (
                  <option key={t} value={t} className="bg-base text-white">
                    {t}
                  </option>
                ))}
              </select>
            </label>
          )}

          {touchedStep1 && !step1Valid && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              Please fill in all required fields before continuing.
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
              Save &amp; Continue Later
            </button>
            <button
              onClick={handleContinueFromStep1}
              className="min-h-[44px] rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              Continue to Photos
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="mt-10 flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">Property Photos</h2>
            <p className="text-sm text-muted">Upload 3–10 high-quality photos</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center transition ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"
            }`}
          >
            <ImagePlus className={dragActive ? "text-primary-text" : "text-subtle"} size={32} />
            <span className="text-base text-white">
              {dragActive ? "Drop photos to upload" : "Drag photos here or click to browse"}
            </span>
            <span className="text-xs text-subtle">JPG, PNG, or WEBP · Max {MAX_PHOTO_MB}MB each</span>
          </button>

          {uploadError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted">
            <span>{draft.photos.length} of {MAX_PHOTOS} photos</span>
            {totalSizeMb > 0 && <span>{totalSizeMb.toFixed(1)}MB uploaded</span>}
          </div>

          {draft.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {draft.photos.map((src, i) => {
                const meta = photoMeta[i];
                return (
                  <div key={src + i} className="group relative overflow-hidden rounded-lg border border-border">
                    <img
                      src={src}
                      alt={`Upload ${i + 1}`}
                      className="h-[140px] w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    {meta?.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="animate-spin text-white" size={22} />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      {i > 0 && (
                        <button
                          onClick={() => movePhoto(i, -1)}
                          aria-label="Move photo earlier"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-base/80 text-white hover:bg-primary"
                        >
                          <ArrowUp size={13} />
                        </button>
                      )}
                      {i < draft.photos.length - 1 && (
                        <button
                          onClick={() => movePhoto(i, 1)}
                          aria-label="Move photo later"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-base/80 text-white hover:bg-primary"
                        >
                          <ArrowDown size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        aria-label="Remove photo"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-base/80 text-white hover:bg-red-500/80"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Video Tour (Optional)</span>
            <input
              value={draft.video}
              onChange={(e) => update("video", e.target.value)}
              placeholder="Paste YouTube or Vimeo link"
              className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mt-4 flex justify-between gap-3">
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                Back
              </button>
              <button className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                Save &amp; Continue Later
              </button>
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={anyUploading}
              className="min-h-[44px] rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {anyUploading ? "Uploading…" : "Continue to Details"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="mt-10 flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">Property Details</h2>
            <p className="text-sm text-muted">Describe the property and highlight features</p>
          </div>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Description <span className="text-red-400">*</span>
              </span>
              <span className="text-xs text-subtle">{draft.description.length}/500 characters</span>
            </div>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value.slice(0, 500))}
              onBlur={() => setTouchedStep3(true)}
              rows={5}
              aria-invalid={touchedStep3 && Boolean(step3Errors.description)}
              placeholder="Describe the property, its condition, special features, recent renovations, etc."
              className={`w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-base text-white placeholder:text-subtle focus:outline-none ${
                touchedStep3 && step3Errors.description ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
            {touchedStep3 && step3Errors.description && (
              <span className="text-xs text-red-400">{step3Errors.description}</span>
            )}
          </label>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-white">Features</span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <label key={f} className="flex min-h-[32px] items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={draft.features.includes(f)}
                    onChange={() => toggleFromList("features", f)}
                    className="h-5 w-5 rounded border-border bg-transparent accent-primary"
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>

          {draft.status === "For Rent" && (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-white">Amenities</span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AMENITIES.map((a) => (
                  <label key={a} className="flex min-h-[32px] items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={draft.amenities.includes(a)}
                      onChange={() => toggleFromList("amenities", a)}
                      className="h-5 w-5 rounded border-border bg-transparent accent-primary"
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Year Built</span>
            <input
              value={draft.yearBuilt}
              onChange={(e) => update("yearBuilt", e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="2018"
              className="h-12 w-32 rounded-lg border border-border bg-transparent px-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-white">Property Condition</span>
            <div className="flex flex-wrap gap-3">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("condition", c)}
                  className={`min-h-[44px] rounded-[10px] border px-5 py-2.5 text-sm font-medium transition ${
                    draft.condition === c ? "border-primary text-primary-text" : "border-border text-muted hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-between gap-3">
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                Back
              </button>
              <button className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                Save &amp; Continue Later
              </button>
            </div>
            <button
              onClick={handleContinueFromStep3}
              className="min-h-[44px] rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              Continue to Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="mt-10 flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">Review Your Listing</h2>
            <p className="text-sm text-muted">Make sure everything looks good before publishing</p>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Property Overview</h3>
              <button onClick={() => setStep(1)} className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
                Edit
              </button>
            </div>
            <div className="flex gap-4">
              {draft.photos[0] && <img src={draft.photos[0]} alt={draft.name} className="h-20 w-20 rounded-lg object-cover" />}
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold text-white">{draft.name || "Untitled Property"}</span>
                <span className="text-sm text-muted">{draft.street}, {draft.city}</span>
                <span className="text-sm text-muted">{draft.price || "—"} · {draft.beds} bd · {draft.baths} ba</span>
                <span className="text-xs text-subtle">{draft.propertyType} · {draft.status}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Photos &amp; Video</h3>
              <button onClick={() => setStep(2)} className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {draft.photos.map((src, i) => (
                <img key={src + i} src={src} alt="" className="h-16 w-full rounded-lg object-cover" />
              ))}
              {draft.photos.length === 0 && <span className="text-sm text-muted">No photos added</span>}
            </div>
            {draft.video && <span className="text-sm text-muted">Video: {draft.video}</span>}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Description</h3>
              <button onClick={() => setStep(3)} className="text-sm font-medium text-white underline underline-offset-4 hover:text-primary-text">
                Edit
              </button>
            </div>
            <p className="text-sm text-muted">{draft.description || "No description provided"}</p>
            <div className="flex flex-wrap gap-2">
              {[...draft.features, ...draft.amenities].map((tag) => (
                <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-white">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-6">
            <label className="flex min-h-[32px] items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" checked={confirmAccurate} onChange={(e) => setConfirmAccurate(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-border bg-transparent accent-primary" />
              I confirm this information is accurate
            </label>
            <label className="flex min-h-[32px] items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" checked={confirmTerms} onChange={(e) => setConfirmTerms(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-border bg-transparent accent-primary" />
              I agree to the Terms &amp; Conditions
            </label>
            <label className="flex min-h-[32px] items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" checked={confirmRight} onChange={(e) => setConfirmRight(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-border bg-transparent accent-primary" />
              I have the right to list this property
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button onClick={() => setStep(3)} className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
              Back
            </button>
            <button
              disabled={!confirmAccurate || !confirmTerms || !confirmRight || !draft.name || publishing || anyUploading}
              onClick={handlePublish}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-4 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {publishing && <Loader2 size={18} className="animate-spin" />}
              {publishing ? "Publishing…" : isEdit ? "Publish Changes" : "Publish Listing"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
