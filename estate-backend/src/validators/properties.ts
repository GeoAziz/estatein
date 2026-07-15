import { z } from "zod";

export const PropertyFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  propertyType: z.enum(["house", "apartment", "townhouse", "plot", "commercial"]).optional(),
  location: z.string().optional(),
  radius: z.coerce.number().positive().default(5),
  listingStatus: z.enum(["for_sale", "for_rent", "sold", "pending"]).optional(),
  sortBy: z.enum(["price", "date", "views"]).default("date"),
});

export const CreatePropertySchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  propertyType: z.enum(["house", "apartment", "townhouse", "plot", "commercial"]),
  beds: z.number().int().min(0),
  baths: z.number().int().min(0),
  sqFt: z.number().positive().optional(),
  lotSize: z.number().positive().optional(),
  yearBuilt: z.number().int().optional(),
  price: z.number().positive("Price must be greater than 0"),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).min(1).max(10),
  videoTour: z.string().url().optional(),
  neighborhoodId: z.string().optional(),
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

export type PropertyFilterInput = z.infer<typeof PropertyFilterSchema>;
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
