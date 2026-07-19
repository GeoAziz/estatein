import { z } from 'zod';

export const NearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().default(5),
});

export const PointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const SearchBoundsSchema = z.object({
  polygon: z.array(PointSchema).min(3),
});

export const DistanceSchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
});

export type Nearby = z.infer<typeof NearbySchema>;
export type SearchBounds = z.infer<typeof SearchBoundsSchema>;
export type Distance = z.infer<typeof DistanceSchema>;
