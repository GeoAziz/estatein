// Drop-in replacement for the `apiClient` singleton in ../api-client, used
// only when VITE_DEMO_MODE=true. Implements the same method names/signatures
// so every page that calls `apiClient.xxx()` keeps working unmodified — see
// the demo-mode branch at the bottom of api-client.ts.
//
// Reads/writes go through the tiny localStorage collection helpers in
// demo-db.ts, seeded from demo-data.ts, so state persists across reloads
// within a visitor's own browser without any server involved.
import {
  DEMO_ADMIN_STATS,
  DEMO_AGENTS,
  DEMO_ANALYTICS_OVERVIEW,
  DEMO_FAVORITES,
  DEMO_INQUIRIES,
  DEMO_LISTINGS,
  DEMO_MARKET_TRENDS,
  DEMO_PROPERTIES,
  DEMO_USERS,
} from "./demo-data";
import { deleteItem, genId, getCollection, getSession, insertItem, setCollection, updateItem } from "./demo-db";

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

type DemoPayment = { id: string; amount: number; method: string; phoneNumber: string; description: string; status: string };

function currentUser(): any {
  const session = getSession();
  if (!session) return undefined;
  return DEMO_USERS.find((u) => u.id === session.userId);
}

function collection<T extends { id: string }>(key: string, seed: T[]) {
  return getCollection<T>(key, seed);
}

// Generic CRUD helper for the many resource types (tenants, maintenance
// requests, developer projects/phases/units...) that don't need bespoke demo
// behavior — just a persisted, listable, editable set of records.
function crud<T extends { id: string }>(key: string, seed: T[], idPrefix: string) {
  return {
    list: async () => {
      await delay();
      return collection(key, seed);
    },
    get: async (id: string) => {
      await delay();
      return collection(key, seed).find((item) => item.id === id);
    },
    create: async (payload: any) => {
      await delay();
      const item = { id: genId(idPrefix), createdAt: new Date().toISOString(), ...payload } as T;
      return insertItem(key, seed, item);
    },
    update: async (id: string, payload: any) => {
      await delay();
      return updateItem(key, seed, id, payload);
    },
    remove: async (id: string) => {
      await delay();
      deleteItem(key, seed, id);
    },
  };
}

const tenantsStore = crud("tenants", [], "demo-tenant");
const maintenanceStore = crud("maintenance", [], "demo-maint");
const developerProjectsStore = crud("dev-projects", [], "demo-project");
const projectPhasesStore = crud("project-phases", [], "demo-phase");
const projectUnitsStore = crud("project-units", [], "demo-unit");
const savedSearchesStore = crud("saved-searches", [], "demo-search");
const availabilityStore = crud("availability", [], "demo-slot");

export const demoApiClient = {
  // Auth — real session handling lives in demo-auth.tsx; these exist only
  // because a few call sites import apiClient directly for auth actions.
  async register(payload: any) {
    await delay();
    return { user: currentUser() ?? DEMO_USERS[0], ...payload };
  },
  async login(_email: string, _password: string) {
    await delay();
    return { user: currentUser() ?? DEMO_USERS[0] };
  },
  async requestOtpLogin(_email: string) {
    await delay();
    return { sent: true };
  },
  async verifyOtpLogin(_email: string, _code: string) {
    await delay();
    return { user: currentUser() ?? DEMO_USERS[0] };
  },
  async getMe() {
    await delay();
    const user = currentUser();
    if (!user) throw new Error("Not authenticated");
    return { user };
  },
  async logout() {
    await delay();
  },

  // Properties — pages read `images`, some other consumers read `photos`
  // (matching the real Prisma field); alias both so pictures render either way.
  async getProperties(_params: Record<string, unknown>) {
    await delay();
    const properties = DEMO_PROPERTIES.map((p) => ({ ...p, images: p.photos }));
    return { properties, total: properties.length };
  },
  async getPropertyById(id: string) {
    await delay();
    const found = DEMO_PROPERTIES.find((p) => p.id === id || p.slug === id);
    const property = found ? { ...found, images: found.photos } : undefined;
    return { property };
  },
  async incrementPropertyViews(_id: string) {
    await delay();
  },
  async uploadFile(file: File, _folder = "listings") {
    await delay();
    return { url: URL.createObjectURL(file), key: genId("upload") };
  },
  async submitContactMessage(_payload: any) {
    await delay();
    return { received: true };
  },
  async reportError(_payload: any) {
    // no-op in demo mode
  },
  async trackEvent(_name: string, _metadata?: Record<string, unknown>) {
    // no-op in demo mode
  },

  // Inquiries
  async createInquiry(payload: any) {
    await delay();
    const user = currentUser();
    const inquiry = {
      id: genId("demo-inquiry"),
      status: "New",
      read: false,
      createdAt: new Date().toISOString(),
      buyerId: user?.id,
      buyerName: user?.name,
      buyerEmail: user?.email,
      ...payload,
    };
    return insertItem("inquiries", DEMO_INQUIRIES, inquiry);
  },
  async getInquiries(_params?: any) {
    await delay();
    return collection("inquiries", DEMO_INQUIRIES);
  },
  async getInquiryById(id: string) {
    await delay();
    return collection("inquiries", DEMO_INQUIRIES).find((i) => i.id === id);
  },
  async replyToInquiry(id: string, message: string) {
    await delay();
    return updateItem("inquiries", DEMO_INQUIRIES, id, { lastReply: message, respondedAt: new Date().toISOString() } as any);
  },
  async updateInquiryStatus(id: string, status: string) {
    await delay();
    return updateItem("inquiries", DEMO_INQUIRIES, id, { status } as any);
  },
  async updateViewingStatus(id: string, viewingStatus: string) {
    await delay();
    return updateItem("inquiries", DEMO_INQUIRIES, id, { viewingStatus } as any);
  },
  async deleteInquiry(id: string) {
    await delay();
    deleteItem("inquiries", DEMO_INQUIRIES, id);
  },

  // Favorites
  async addFavorite(propertyId: string) {
    await delay();
    const favs = collection<any>("favorites", DEMO_FAVORITES.map((id) => ({ id })));
    if (!favs.find((f) => f.id === propertyId)) setCollection("favorites", [...favs, { id: propertyId }]);
  },
  async removeFavorite(propertyId: string) {
    await delay();
    const favs = collection<any>("favorites", DEMO_FAVORITES.map((id) => ({ id })));
    setCollection("favorites", favs.filter((f) => f.id !== propertyId));
  },
  async getFavorites() {
    await delay();
    const favs = collection<any>("favorites", DEMO_FAVORITES.map((id) => ({ id })));
    return favs
      .map((f) => DEMO_PROPERTIES.find((p) => p.id === f.id))
      .filter((p): p is (typeof DEMO_PROPERTIES)[number] => Boolean(p))
      .map((p) => ({ ...p, name: p.title, image: p.photos[0], images: p.photos }));
  },
  async isFavorited(propertyId: string) {
    await delay();
    const favs = collection<any>("favorites", DEMO_FAVORITES.map((id) => ({ id })));
    return { favorited: favs.some((f) => f.id === propertyId) };
  },

  // Listings
  async createListing(payload: any) {
    await delay();
    const listing = { id: genId("demo-listing"), status: "pending", createdAt: new Date().toISOString(), ...payload };
    return insertItem("listings", DEMO_LISTINGS, listing);
  },
  async getListings() {
    await delay();
    return collection("listings", DEMO_LISTINGS);
  },
  async updateListing(id: string, payload: any) {
    await delay();
    return updateItem("listings", DEMO_LISTINGS, id, payload);
  },
  async deleteListing(id: string) {
    await delay();
    deleteItem("listings", DEMO_LISTINGS, id);
  },

  // Users
  async getUserProfile(id: string) {
    await delay();
    return DEMO_USERS.find((u) => u.id === id) ?? currentUser();
  },
  async updateUserProfile(_id: string, payload: any) {
    await delay();
    return { ...currentUser(), ...payload };
  },

  // Agents
  async getAgents(_params?: any) {
    await delay();
    return DEMO_AGENTS;
  },
  async getAgentById(id: string) {
    await delay();
    return DEMO_AGENTS.find((a) => a.id === id) ?? DEMO_AGENTS[0];
  },

  // Mortgage
  async calculateMortgage(payload: { homePrice: number; downPayment: number; interestRate: number; loanTerm: number }) {
    await delay();
    const principal = payload.homePrice - payload.downPayment;
    const monthlyRate = payload.interestRate / 100 / 12;
    const numPayments = payload.loanTerm * 12;
    const monthlyPayment =
      monthlyRate === 0
        ? principal / numPayments
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    return { monthlyPayment: Math.round(monthlyPayment), principal, totalPayment: Math.round(monthlyPayment * numPayments) };
  },
  async getMortgageRates() {
    await delay();
    return [
      { loanType: "Fixed", termYears: 15, ratePercentage: 12.5 },
      { loanType: "Fixed", termYears: 25, ratePercentage: 13.5 },
      { loanType: "Variable", termYears: 20, ratePercentage: 11.8 },
    ];
  },

  // Saved searches
  async getSavedSearches() {
    return savedSearchesStore.list();
  },
  async createSavedSearch(payload: { name: string; filters: string }) {
    return savedSearchesStore.create(payload);
  },
  async deleteSavedSearch(id: string) {
    return savedSearchesStore.remove(id);
  },

  // Password
  async changePassword(_id: string, _payload: any) {
    await delay();
    return { updated: true };
  },

  // Market
  async getMarketTrends(_location: string) {
    await delay();
    return DEMO_MARKET_TRENDS;
  },
  async getMarketInventory(_location: string) {
    await delay();
    return { inventory: DEMO_MARKET_TRENDS.inventory };
  },
  async getMarketSoldData(_location: string) {
    await delay();
    return { sold: 24, medianPrice: DEMO_MARKET_TRENDS.medianPrice };
  },
  async getMarketDaysOnMarket(_location: string) {
    await delay();
    return { averageDaysOnMarket: DEMO_MARKET_TRENDS.averageDaysOnMarket };
  },

  // Admin — listings moderation
  async getPendingListings() {
    await delay();
    return collection("listings", DEMO_LISTINGS).filter((l: any) => l.status === "pending");
  },
  async approveListing(id: string, _reason?: string) {
    await delay();
    return updateItem("listings", DEMO_LISTINGS, id, { status: "approved" } as any);
  },
  async rejectListing(id: string, reason?: string) {
    await delay();
    return updateItem("listings", DEMO_LISTINGS, id, { status: "rejected", rejectionReason: reason } as any);
  },
  async getAdminUsers(_params?: Record<string, string>) {
    await delay();
    return DEMO_USERS;
  },
  async updateUserStatus(id: string, status: string) {
    await delay();
    return { id, status };
  },
  async getAdminStats() {
    await delay();
    return DEMO_ADMIN_STATS;
  },

  // KYC / verification
  async submitVerification(_payload: any) {
    await delay();
    return { status: "pending" };
  },
  async getVerificationStatus() {
    await delay();
    return { status: currentUser()?.verified ? "verified" : "unverified" };
  },
  async getPendingVerifications() {
    await delay();
    return [];
  },
  async verifyUser(userId: string, action: "verified" | "rejected", _reason?: string) {
    await delay();
    return { userId, status: action };
  },

  // Property valuation
  async getZestimate(propertyId: string) {
    await delay();
    const property = DEMO_PROPERTIES.find((p) => p.id === propertyId);
    return { zestimate: property ? Math.round(property.price * 1.03) : 0 };
  },
  async getComparableProperties(propertyId: string) {
    await delay();
    return DEMO_PROPERTIES.filter((p) => p.id !== propertyId).slice(0, 3);
  },
  async getPriceHistory(propertyId: string) {
    await delay();
    const property = DEMO_PROPERTIES.find((p) => p.id === propertyId);
    const base = property?.price ?? 10_000_000;
    return [
      { date: "2025-01-01", price: Math.round(base * 0.9) },
      { date: "2025-07-01", price: Math.round(base * 0.95) },
      { date: "2026-01-01", price: base },
    ];
  },

  // Elasticsearch reindex — no-op, no search backend in demo mode
  async reindexProperties() {
    await delay();
    return { reindexed: DEMO_PROPERTIES.length };
  },

  // OTP
  async sendOtp(_type: string) {
    await delay();
    return { sent: true, demoCode: "123456" };
  },
  async verifyOtp(code: string, _type: string) {
    await delay();
    return { verified: code === "123456" };
  },

  // Two-factor authentication
  async enable2FA() {
    await delay();
    return { qrCode: "", secret: "DEMOSECRET", demoCode: "123456" };
  },
  async confirm2FA(code: string) {
    await delay();
    return { enabled: code === "123456" };
  },
  async disable2FA(_code: string) {
    await delay();
    return { enabled: false };
  },
  async verifyLogin2FA(userId: string, _code: string) {
    await delay();
    return { user: DEMO_USERS.find((u) => u.id === userId) ?? currentUser() };
  },

  // Booking / viewing scheduling
  async rescheduleViewing(id: string, viewingDate: string, viewingTime: string) {
    await delay();
    return updateItem("inquiries", DEMO_INQUIRIES, id, { viewingDate, viewingTime, viewingStatus: "requested" } as any);
  },

  // Payments — simulate an M-Pesa STK push succeeding after a short delay
  async initiatePayment(amount: number, method: string, phoneNumber: string, description: string) {
    await delay();
    const payment: DemoPayment = { id: genId("demo-payment"), amount, method, phoneNumber, description, status: "pending" };
    insertItem<DemoPayment>("payments", [], payment);
    return payment;
  },
  async checkPaymentStatus(paymentId: string) {
    await delay(400);
    // Always resolves to success in demo mode — this simulates the buyer
    // having approved the STK push prompt on their phone.
    updateItem<DemoPayment>("payments", [], paymentId, { status: "completed" });
    return { id: paymentId, status: "completed" };
  },

  // Developer projects / phases / units
  async getDeveloperProjects(_params?: any) {
    return developerProjectsStore.list();
  },
  async getDeveloperProjectById(id: string) {
    return developerProjectsStore.get(id);
  },
  async createDeveloperProject(payload: any) {
    return developerProjectsStore.create(payload);
  },
  async updateDeveloperProject(id: string, payload: any) {
    return developerProjectsStore.update(id, payload);
  },
  async deleteDeveloperProject(id: string) {
    return developerProjectsStore.remove(id);
  },
  async getPhasesByProject(projectId: string) {
    await delay();
    return collection("project-phases", []).filter((p: any) => p.projectId === projectId);
  },
  async createPhase(projectId: string, payload: any) {
    return projectPhasesStore.create({ ...payload, projectId });
  },
  async updatePhase(id: string, payload: any) {
    return projectPhasesStore.update(id, payload);
  },
  async deletePhase(id: string) {
    return projectPhasesStore.remove(id);
  },
  async getUnitsByPhase(phaseId: string) {
    await delay();
    return collection("project-units", []).filter((u: any) => u.phaseId === phaseId);
  },
  async createUnit(phaseId: string, payload: any) {
    return projectUnitsStore.create({ ...payload, phaseId });
  },
  async updateUnit(id: string, payload: any) {
    return projectUnitsStore.update(id, payload);
  },
  async deleteUnit(id: string) {
    return projectUnitsStore.remove(id);
  },
  async reserveUnit(id: string) {
    return projectUnitsStore.update(id, { reserved: true });
  },

  // Property manager: tenants
  async getTenants() {
    return tenantsStore.list();
  },
  async getTenantById(id: string) {
    return tenantsStore.get(id);
  },
  async createTenant(payload: any) {
    return tenantsStore.create(payload);
  },
  async updateTenant(id: string, payload: any) {
    return tenantsStore.update(id, payload);
  },
  async deleteTenant(id: string) {
    return tenantsStore.remove(id);
  },

  // Property manager: maintenance requests
  async getMaintenanceRequests() {
    return maintenanceStore.list();
  },
  async getMaintenanceRequestById(id: string) {
    return maintenanceStore.get(id);
  },
  async createMaintenanceRequest(payload: any) {
    return maintenanceStore.create(payload);
  },
  async updateMaintenanceRequest(id: string, payload: any) {
    return maintenanceStore.update(id, payload);
  },
  async deleteMaintenanceRequest(id: string) {
    return maintenanceStore.remove(id);
  },

  // Geospatial — approximate with the seeded properties, no real geo engine
  async getNearbyAmenities(_lat: number, _lng: number, _radiusKm = 5) {
    await delay();
    return [];
  },
  async searchByBounds(_polygon: Array<{ lat: number; lng: number }>) {
    await delay();
    return DEMO_PROPERTIES.map((p) => ({ ...p, images: p.photos }));
  },
  async getDistance(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    await delay();
    const R = 6371;
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLng = ((toLng - fromLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { distanceKm: Math.round(distanceKm * 10) / 10 };
  },

  // Agent availability
  async createAvailabilitySlots(slots: Array<{ date: string; startTime: string; endTime: string }>) {
    await delay();
    const created = slots.map((s) => ({ id: genId("demo-slot"), isBooked: false, ...s }));
    const existing = collection("availability", []);
    setCollection("availability", [...existing, ...created]);
    return created;
  },
  async getAvailabilitySlots(_agentId: string, _from?: string, _to?: string) {
    return availabilityStore.list();
  },
  async deleteAvailabilitySlot(id: string) {
    return availabilityStore.remove(id);
  },

  // 2FA backup codes — fixed, visible codes since there's no real 2FA secret
  async generateBackupCodes() {
    await delay();
    return { codes: ["1111-AAAA", "2222-BBBB", "3333-CCCC", "4444-DDDD", "5555-EEEE"] };
  },
  async verifyBackupCode(_userId: string, code: string) {
    await delay();
    return { valid: /^[0-9]{4}-[A-Z]{4}$/.test(code) };
  },

  // Admin analytics
  async getAnalyticsOverview(_from?: string, _to?: string) {
    await delay();
    return DEMO_ANALYTICS_OVERVIEW;
  },
  async getPropertyAnalytics(propertyId: string) {
    await delay();
    const property = DEMO_PROPERTIES.find((p) => p.id === propertyId);
    return { views: property?.views ?? 0, favorites: property?.favorites ?? 0, inquiries: property?.inquiries ?? 0 };
  },
  async getAgentPerformance(agentId: string) {
    await delay();
    const agent = DEMO_AGENTS.find((a) => a.id === agentId) ?? DEMO_AGENTS[0];
    return { totalSales: agent.totalSales, averageSalePrice: agent.averageSalePrice, rating: agent.rating };
  },
  async getRegionalTrends() {
    await delay();
    return [
      { region: "Nairobi", medianPrice: 14_200_000, growth: 6.8 },
      { region: "Mombasa", medianPrice: 9_800_000, growth: 4.2 },
    ];
  },
  async exportAnalytics(format: "csv" | "json" = "csv") {
    const body = format === "csv" ? "metric,value\nviews,24680\ninquiries,312" : JSON.stringify(DEMO_ANALYTICS_OVERVIEW);
    return new Response(body, { status: 200 });
  },
};
