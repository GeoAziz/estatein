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

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', { email, password });
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

  async getAdminUsers(): Promise<any> {
    const response = await this.request('GET', '/admin/users');
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
}

export const apiClient = new ApiClient();
