// Shared helpers for turning API responses into the shapes dashboard pages
// render. Centralized so every consumer of /listings and /inquiries reads the
// same (nested user/property) response shape instead of drifting field lists.

export function unwrapList<T = any>(result: any, key: string): T[] {
  if (Array.isArray(result)) return result;
  return result?.[key] || result?.data || [];
}

export type NormalizedListing = {
  id: string;
  name: string;
  street: string;
  city: string;
  price: string;
  beds: number;
  baths: number;
  photos: string[];
  listingStatus: string;
  agentName: string;
  views: number;
  favorites: number;
  inquiries: number;
  createdAt: string;
};

export function mapListing(l: any): NormalizedListing {
  const property = l.property || {};
  return {
    id: l.id,
    name: l.title || l.name || "Untitled",
    street: property.address || l.street || l.address || "",
    city: property.city || l.city || "",
    price: (l.price ?? property.price) ? `$${Number(l.price ?? property.price).toLocaleString()}` : "N/A",
    beds: property.beds ?? l.bedrooms ?? l.beds ?? 0,
    baths: property.baths ?? l.bathrooms ?? l.baths ?? 0,
    photos: property.photos || l.photos || l.images || [],
    listingStatus: l.status || l.listingStatus || "pending",
    agentName: l.user?.name || l.agentName || "",
    views: l.views || 0,
    favorites: l.favorites || 0,
    inquiries: l.inquiries || 0,
    createdAt: l.createdAt || new Date().toISOString(),
  };
}

export type NormalizedInquiry = {
  id: string;
  listingId: string;
  buyerName: string;
  buyerEmail: string;
  message: string;
  contactMethod: string;
  viewingRequested: boolean;
  viewingDate?: string;
  viewingTime?: string;
  viewingStatus?: string;
  status: string;
  read: boolean;
  createdAt: string;
  property?: any;
};

export function mapInquiry(i: any): NormalizedInquiry {
  return {
    id: i.id,
    listingId: i.listingId || i.propertyId || "",
    buyerName: i.buyerName || i.buyer?.name || "Buyer",
    buyerEmail: i.buyerEmail || i.buyer?.email || "",
    message: i.message || "",
    contactMethod: i.contactMethod || "Email",
    viewingRequested: i.viewingRequested || false,
    viewingDate: i.viewingDate,
    viewingTime: i.viewingTime,
    viewingStatus: i.viewingStatus,
    status: i.status || "New",
    read: i.read !== false,
    createdAt: i.createdAt || new Date().toISOString(),
    property: i.property,
  };
}
