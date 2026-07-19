const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
  };
}

export interface Requires2FAResponse {
  requires2FA: true;
  userId: string;
}

class ApiClient {
  // Access/refresh tokens live in httpOnly cookies set by the backend — the
  // browser attaches them automatically via `credentials: "include"`. There
  // is no token for JS to hold, which is the point: it can't be read or
  // exfiltrated by an XSS payload the way a localStorage token could.

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        console.error(`API Error: ${data.error?.code} - ${data.error?.message}`);
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API call failed (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  // Auth endpoints
  async register(payload: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: string;
    company?: string;
    license?: string;
    licenseState?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', payload);
    return response.data!;
  }

  async login(email: string, password: string): Promise<AuthResponse | Requires2FAResponse> {
    const response = await this.request<AuthResponse | Requires2FAResponse>('POST', '/auth/login', { email, password });
    return response.data!;
  }

  async requestOtpLogin(email: string): Promise<any> {
    const response = await this.request('POST', '/auth/otp/login/request', { email });
    return response.data;
  }

  async verifyOtpLogin(email: string, code: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/otp/login/verify', { email, code });
    return response.data!;
  }

  async getMe(): Promise<{ user: any }> {
    const response = await this.request<{ user: any }>('GET', '/auth/me');
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.request('POST', '/auth/logout');
  }

  // Properties endpoints
  async getProperties(params: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    location?: string;
    listingStatus?: string;
    sortBy?: string;
  }): Promise<any> {
    const query = new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null) acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    );
    const response = await this.request('GET', `/properties?${query}`);
    return response.data;
  }

  async getPropertyById(id: string): Promise<any> {
    const response = await this.request('GET', `/properties/${id}`);
    return response.data;
  }

  async incrementPropertyViews(id: string): Promise<void> {
    await this.request('POST', `/properties/${id}/views`);
  }

  async uploadFile(file: File, folder = "listings"): Promise<{ url: string; key: string }> {
    const body = new FormData();
    body.append("file", file);
    body.append("type", folder);

    const response = await fetch(`${API_URL}/uploads`, { method: "POST", credentials: "include", body });
    const result: ApiResponse<{ url: string; key: string }> = await response.json();
    if (!response.ok || !result.data) {
      throw new Error(result.error?.message || "Upload failed");
    }
    return result.data;
  }

  // Public contact/lead endpoint (no auth required)
  async submitContactMessage(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message: string;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    const response = await this.request('POST', '/contact', payload);
    return response.data;
  }

  // Telemetry — best-effort, never throws (a broken error reporter shouldn't
  // itself become a second error).
  async reportError(payload: { message: string; stack?: string; context?: Record<string, unknown>; url?: string }): Promise<void> {
    try {
      await this.request('POST', '/telemetry/error', payload);
    } catch {
      // swallow — nothing useful to do if telemetry itself fails
    }
  }

  async trackEvent(name: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await this.request('POST', '/telemetry/event', { name, metadata });
    } catch {
      // swallow
    }
  }

  // Inquiries endpoints
  async createInquiry(payload: {
    propertyId: string;
    message: string;
    viewingRequested?: boolean;
    viewingDate?: string;
    viewingTime?: string;
    contactMethod: string;
    phone?: string;
    agentId?: string;
    slotId?: string;
  }): Promise<any> {
    const response = await this.request('POST', '/inquiries', payload);
    return response.data;
  }

  async getInquiries(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await this.request('GET', `/inquiries${query}`);
    return response.data;
  }

  async getInquiryById(id: string): Promise<any> {
    const response = await this.request('GET', `/inquiries/${id}`);
    return response.data;
  }

  async replyToInquiry(id: string, message: string): Promise<any> {
    const response = await this.request('POST', `/inquiries/${id}/reply`, { message });
    return response.data;
  }

  async updateInquiryStatus(id: string, status: string): Promise<any> {
    const response = await this.request('PUT', `/inquiries/${id}/status`, { status });
    return response.data;
  }

  async updateViewingStatus(id: string, viewingStatus: string): Promise<any> {
    const response = await this.request('PUT', `/inquiries/${id}/viewing-status`, { viewingStatus });
    return response.data;
  }

  async deleteInquiry(id: string): Promise<void> {
    await this.request('DELETE', `/inquiries/${id}`);
  }

  // Favorites endpoints
  async addFavorite(propertyId: string): Promise<void> {
    await this.request('POST', `/favorites/${propertyId}`);
  }

  async removeFavorite(propertyId: string): Promise<void> {
    await this.request('DELETE', `/favorites/${propertyId}`);
  }

  async getFavorites(): Promise<any> {
    const response = await this.request('GET', '/favorites');
    return response.data;
  }

  async isFavorited(propertyId: string): Promise<{ favorited: boolean }> {
    const response = await this.request<{ favorited: boolean }>('GET', `/favorites/${propertyId}`);
    return response.data!;
  }

  // Listings endpoints
  async createListing(payload: any): Promise<any> {
    const response = await this.request('POST', '/listings', payload);
    return response.data;
  }

  async getListings(): Promise<any> {
    const response = await this.request('GET', '/listings');
    return response.data;
  }

  async updateListing(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/listings/${id}`, payload);
    return response.data;
  }

  async deleteListing(id: string): Promise<void> {
    await this.request('DELETE', `/listings/${id}`);
  }

  // Users endpoints
  async getUserProfile(id: string): Promise<any> {
    const response = await this.request('GET', `/users/${id}`);
    return response.data;
  }

  async updateUserProfile(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/users/${id}`, payload);
    return response.data;
  }

  // Agents endpoints
  async getAgents(params?: { page?: number; limit?: number }): Promise<any> {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await this.request('GET', `/agents${query}`);
    return response.data;
  }

  async getAgentById(id: string): Promise<any> {
    const response = await this.request('GET', `/agents/${id}`);
    return response.data;
  }

  // Mortgage endpoints
  async calculateMortgage(payload: {
    homePrice: number;
    downPayment: number;
    interestRate: number;
    loanTerm: number;
  }): Promise<any> {
    const response = await this.request('POST', '/mortgage/calculate', payload);
    return response.data;
  }

  async getMortgageRates(): Promise<any> {
    const response = await this.request('GET', '/mortgage/rates');
    return response.data;
  }

  // Saved Searches endpoints
  async getSavedSearches(): Promise<any> {
    const response = await this.request('GET', '/saved-searches');
    return response.data;
  }

  async createSavedSearch(payload: { name: string; filters: string }): Promise<any> {
    const response = await this.request('POST', '/saved-searches', payload);
    return response.data;
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await this.request('DELETE', `/saved-searches/${id}`);
  }

  // Password endpoints
  async changePassword(id: string, payload: { currentPassword: string; newPassword: string }): Promise<any> {
    const response = await this.request('PUT', `/users/${id}/password`, payload);
    return response.data;
  }

  // Market endpoints
  async getMarketTrends(location: string): Promise<any> {
    const response = await this.request('GET', `/market/trends/${location}`);
    return response.data;
  }

  // Admin endpoints
  async getPendingListings(): Promise<any> {
    const response = await this.request('GET', '/admin/pending-listings');
    return response.data;
  }

  async approveListing(id: string, reason?: string): Promise<any> {
    const response = await this.request('PUT', `/admin/listings/${id}/approve`, { reason });
    return response.data;
  }

  async rejectListing(id: string, reason?: string): Promise<any> {
    const response = await this.request('PUT', `/admin/listings/${id}/reject`, { reason });
    return response.data;
  }

  async getAdminUsers(params?: Record<string, string>): Promise<any> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const response = await this.request('GET', `/admin/users${qs}`);
    return response.data;
  }

  async updateUserStatus(id: string, status: string): Promise<any> {
    const response = await this.request('PUT', `/admin/users/${id}/status`, { status });
    return response.data;
  }

  async getAdminStats(): Promise<any> {
    const response = await this.request('GET', '/admin/stats');
    return response.data;
  }

  // KYC/Verification endpoints
  async submitVerification(payload: { idDocumentUrl: string; idNumber: string }): Promise<any> {
    const response = await this.request('POST', '/kyc/submit', payload);
    return response.data;
  }

  async getVerificationStatus(): Promise<any> {
    const response = await this.request('GET', '/kyc/status');
    return response.data;
  }

  async getPendingVerifications(): Promise<any> {
    const response = await this.request('GET', '/admin/pending-verification');
    return response.data;
  }

  async verifyUser(userId: string, action: 'verified' | 'rejected', reason?: string): Promise<any> {
    const response = await this.request('PUT', `/admin/users/${userId}/verify`, { action, reason });
    return response.data;
  }

  // Property valuation endpoints
  async getZestimate(propertyId: string): Promise<any> {
    const response = await this.request('GET', `/properties/${propertyId}/zestimate`);
    return response.data;
  }

  async getComparableProperties(propertyId: string): Promise<any> {
    const response = await this.request('GET', `/properties/${propertyId}/comparable`);
    return response.data;
  }

  async getPriceHistory(propertyId: string): Promise<any> {
    const response = await this.request('GET', `/properties/${propertyId}/price-history`);
    return response.data;
  }

  // Market endpoints (additional)
  async getMarketInventory(location: string): Promise<any> {
    const response = await this.request('GET', `/market/inventory/${location}`);
    return response.data;
  }

  async getMarketSoldData(location: string): Promise<any> {
    const response = await this.request('GET', `/market/sold/${location}`);
    return response.data;
  }

  async getMarketDaysOnMarket(location: string): Promise<any> {
    const response = await this.request('GET', `/market/days-on-market/${location}`);
    return response.data;
  }

  // Elasticsearch reindex (admin only)
  async reindexProperties(): Promise<any> {
    const response = await this.request('POST', '/admin/reindex');
    return response.data;
  }

  // OTP endpoints
  async sendOtp(type: string): Promise<any> {
    const response = await this.request('POST', '/auth/otp/send', { type });
    return response.data;
  }

  async verifyOtp(code: string, type: string): Promise<any> {
    const response = await this.request('POST', '/auth/otp/verify', { code, type });
    return response.data;
  }

  // Two-factor authentication endpoints
  async enable2FA(): Promise<any> {
    const response = await this.request('POST', '/auth/2fa/enable');
    return response.data;
  }

  async confirm2FA(code: string): Promise<any> {
    const response = await this.request('POST', '/auth/2fa/confirm', { code });
    return response.data;
  }

  async disable2FA(code: string): Promise<any> {
    const response = await this.request('POST', '/auth/2fa/disable', { code });
    return response.data;
  }

  async verifyLogin2FA(userId: string, code: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/2fa/verify-login', { userId, code });
    return response.data as AuthResponse;
  }

  // Booking / viewing scheduling
  async rescheduleViewing(id: string, viewingDate: string, viewingTime: string): Promise<any> {
    const response = await this.request('PUT', `/inquiries/${id}/viewing-schedule`, { viewingDate, viewingTime });
    return response.data;
  }

  // Payments
  async initiatePayment(amount: number, method: string, phoneNumber: string, description: string): Promise<any> {
    const response = await this.request('POST', '/payments/initiate', { amount, method, phoneNumber, description });
    return response.data;
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    const response = await this.request('GET', `/payments/${paymentId}/status`);
    return response.data;
  }

  // Developer project endpoints
  async getDeveloperProjects(params?: { developerId?: string; page?: number; limit?: number }): Promise<any> {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await this.request('GET', `/developer-projects${query}`);
    return response.data;
  }

  async getDeveloperProjectById(id: string): Promise<any> {
    const response = await this.request('GET', `/developer-projects/${id}`);
    return response.data;
  }

  async createDeveloperProject(payload: any): Promise<any> {
    const response = await this.request('POST', '/developer-projects', payload);
    return response.data;
  }

  async updateDeveloperProject(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/developer-projects/${id}`, payload);
    return response.data;
  }

  async deleteDeveloperProject(id: string): Promise<void> {
    await this.request('DELETE', `/developer-projects/${id}`);
  }

  async getPhasesByProject(projectId: string): Promise<any> {
    const response = await this.request('GET', `/project-phases/project/${projectId}`);
    return response.data;
  }

  async createPhase(projectId: string, payload: any): Promise<any> {
    const response = await this.request('POST', `/project-phases/project/${projectId}`, payload);
    return response.data;
  }

  async updatePhase(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/project-phases/${id}`, payload);
    return response.data;
  }

  async deletePhase(id: string): Promise<void> {
    await this.request('DELETE', `/project-phases/${id}`);
  }

  async getUnitsByPhase(phaseId: string): Promise<any> {
    const response = await this.request('GET', `/project-units/phase/${phaseId}`);
    return response.data;
  }

  async createUnit(phaseId: string, payload: any): Promise<any> {
    const response = await this.request('POST', `/project-units/phase/${phaseId}`, payload);
    return response.data;
  }

  async updateUnit(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/project-units/${id}`, payload);
    return response.data;
  }

  async deleteUnit(id: string): Promise<void> {
    await this.request('DELETE', `/project-units/${id}`);
  }

  async reserveUnit(id: string): Promise<any> {
    const response = await this.request('POST', `/project-units/${id}/reserve`);
    return response.data;
  }

  // Property manager: tenants
  async getTenants(): Promise<any> {
    const response = await this.request('GET', '/tenants');
    return response.data;
  }

  async getTenantById(id: string): Promise<any> {
    const response = await this.request('GET', `/tenants/${id}`);
    return response.data;
  }

  async createTenant(payload: any): Promise<any> {
    const response = await this.request('POST', '/tenants', payload);
    return response.data;
  }

  async updateTenant(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/tenants/${id}`, payload);
    return response.data;
  }

  async deleteTenant(id: string): Promise<void> {
    await this.request('DELETE', `/tenants/${id}`);
  }

  // Property manager: maintenance requests
  async getMaintenanceRequests(): Promise<any> {
    const response = await this.request('GET', '/maintenance-requests');
    return response.data;
  }

  async getMaintenanceRequestById(id: string): Promise<any> {
    const response = await this.request('GET', `/maintenance-requests/${id}`);
    return response.data;
  }

  async createMaintenanceRequest(payload: any): Promise<any> {
    const response = await this.request('POST', '/maintenance-requests', payload);
    return response.data;
  }

  async updateMaintenanceRequest(id: string, payload: any): Promise<any> {
    const response = await this.request('PUT', `/maintenance-requests/${id}`, payload);
    return response.data;
  }

  async deleteMaintenanceRequest(id: string): Promise<void> {
    await this.request('DELETE', `/maintenance-requests/${id}`);
  }

  // Geospatial endpoints
  async getNearbyAmenities(lat: number, lng: number, radiusKm: number = 5): Promise<any> {
    const response = await this.request('GET', `/geo/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
    return response.data;
  }

  async searchByBounds(polygon: Array<{ lat: number; lng: number }>): Promise<any> {
    const response = await this.request('POST', '/geo/search-bounds', { polygon });
    return response.data;
  }

  async getDistance(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<any> {
    const response = await this.request('GET', `/geo/distance?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`);
    return response.data;
  }

  // Agent availability (booking) endpoints
  async createAvailabilitySlots(slots: Array<{ date: string; startTime: string; endTime: string }>): Promise<any> {
    const response = await this.request('POST', '/availability', { slots });
    return response.data;
  }

  async getAvailabilitySlots(agentId: string, from?: string, to?: string): Promise<any> {
    let url = `/availability/${agentId}`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await this.request('GET', url);
    return response.data;
  }

  async deleteAvailabilitySlot(id: string): Promise<void> {
    await this.request('DELETE', `/availability/${id}`);
  }

  // 2FA Backup codes
  async generateBackupCodes(): Promise<any> {
    const response = await this.request('POST', '/auth/2fa/backup-codes/generate');
    return response.data;
  }

  async verifyBackupCode(userId: string, code: string): Promise<any> {
    const response = await this.request('POST', '/auth/2fa/backup-codes/verify', { userId, code });
    return response.data;
  }

  // Admin analytics endpoints
  async getAnalyticsOverview(from?: string, to?: string): Promise<any> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request('GET', `/admin/analytics/overview${query}`);
    return response.data;
  }

  async getPropertyAnalytics(propertyId: string): Promise<any> {
    const response = await this.request('GET', `/admin/analytics/properties/${propertyId}`);
    return response.data;
  }

  async getAgentPerformance(agentId: string): Promise<any> {
    const response = await this.request('GET', `/admin/analytics/agents/${agentId}/performance`);
    return response.data;
  }

  async getRegionalTrends(): Promise<any> {
    const response = await this.request('GET', '/admin/analytics/regional');
    return response.data;
  }

  async exportAnalytics(format: 'csv' | 'json' = 'csv'): Promise<Response> {
    return fetch(`${API_URL}/admin/analytics/export?format=${format}`, {
      credentials: 'include',
    });
  }
}

export const apiClient = new ApiClient();
