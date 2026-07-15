import { z } from "zod";

export const CreateListingSchema = z.object({
  propertyId: z.string().optional(),
  property: z
    .object({
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      propertyType: z.enum(["house", "apartment", "townhouse", "plot", "commercial"]),
      beds: z.number().int().min(0),
      baths: z.number().int().min(0),
      sqFt: z.number().positive().optional(),
      price: z.number().positive(),
      description: z.string().optional(),
      features: z.array(z.string()).default([]),
      amenities: z.array(z.string()).default([]),
      photos: z.array(z.string().url()).min(1).max(10),
    })
    .optional(),
  title: z.string().min(5).max(200),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000).optional(),
  listingType: z.enum(["for_sale", "for_rent"]),
  price: z.number().positive("Price must be greater than 0"),
});

export const UpdateListingSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(50).max(2000).optional(),
  price: z.number().positive().optional(),
  status: z.enum(["draft", "active", "pending", "sold", "expired"]).optional(),
});

export const ListingStatusSchema = z.object({
  status: z.enum(["active", "pending", "sold", "expired", "rejected"]),
});

export const ListingFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "active", "pending", "sold", "expired", "rejected"]).optional(),
  userId: z.string().optional(),
  listingType: z.enum(["for_sale", "for_rent"]).optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;
