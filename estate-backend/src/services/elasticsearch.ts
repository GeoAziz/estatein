import elasticsearch from "../config/elasticsearch.js";
import prisma from "../config/database.js";
import logger from "../middleware/logging.js";

const PROPERTIES_INDEX = "properties";

export interface PropertyIndexDoc {
  id: string;
  address: string;
  city: string;
  state: string;
  county: string;
  estate: string;
  description: string;
  price: number;
  propertyType: string;
  listingStatus: string;
  beds: number;
  baths: number;
  sqFt: number | null;
  landSize: number | null;
  furnished: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  security: boolean;
  internet: boolean;
  petFriendly: boolean;
  investmentProperty: boolean;
  views: number;
  createdAt: string;
}

const INDEX_MAPPING = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        estate_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      address: { type: "text", analyzer: "estate_analyzer", fields: { keyword: { type: "keyword" } } },
      city: { type: "text", analyzer: "estate_analyzer", fields: { keyword: { type: "keyword" } } },
      state: { type: "text", analyzer: "estate_analyzer", fields: { keyword: { type: "keyword" } } },
      county: { type: "text", analyzer: "estate_analyzer", fields: { keyword: { type: "keyword" } } },
      estate: { type: "text", analyzer: "estate_analyzer", fields: { keyword: { type: "keyword" } } },
      description: { type: "text", analyzer: "estate_analyzer" },
      price: { type: "scaled_float", scaling_factor: 100 },
      propertyType: { type: "keyword" },
      listingStatus: { type: "keyword" },
      beds: { type: "short" },
      baths: { type: "short" },
      sqFt: { type: "integer" },
      landSize: { type: "integer" },
      furnished: { type: "boolean" },
      parking: { type: "boolean" },
      pool: { type: "boolean" },
      gym: { type: "boolean" },
      security: { type: "boolean" },
      internet: { type: "boolean" },
      petFriendly: { type: "boolean" },
      investmentProperty: { type: "boolean" },
      views: { type: "integer" },
      createdAt: { type: "date" },
    },
  },
};

export async function ensureIndex(): Promise<boolean> {
  if (!elasticsearch) return false;
  try {
    const exists = await elasticsearch.indices.exists({ index: PROPERTIES_INDEX });
    if (!exists) {
      await elasticsearch.indices.create({ index: PROPERTIES_INDEX, ...INDEX_MAPPING as any });
      logger.info("Created Elasticsearch index: properties");
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to ensure Elasticsearch index");
    return false;
  }
}

export async function indexProperty(property: PropertyIndexDoc): Promise<void> {
  if (!elasticsearch) return;
  try {
    await elasticsearch.index({
      index: PROPERTIES_INDEX,
      id: property.id,
      document: property,
    });
  } catch (err) {
    logger.error({ err, propertyId: property.id }, "Failed to index property");
  }
}

export async function removeProperty(id: string): Promise<void> {
  if (!elasticsearch) return;
  try {
    await elasticsearch.delete({ index: PROPERTIES_INDEX, id });
  } catch {
    // Document may not exist
  }
}

export async function reindexAllProperties(): Promise<number> {
  if (!elasticsearch) return 0;

  const indexed = await ensureIndex();
  if (!indexed) return 0;

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      county: true,
      estate: true,
      description: true,
      price: true,
      propertyType: true,
      listingStatus: true,
      beds: true,
      baths: true,
      sqFt: true,
      landSize: true,
      furnished: true,
      parking: true,
      pool: true,
      gym: true,
      security: true,
      internet: true,
      petFriendly: true,
      investmentProperty: true,
      views: true,
      createdAt: true,
    },
  });

  if (properties.length === 0) return 0;

  const operations = properties.flatMap((p) => [
    { index: { _index: PROPERTIES_INDEX, _id: p.id } },
    {
      ...p,
      createdAt: p.createdAt.toISOString(),
      description: p.description || "",
      county: p.county || "",
      estate: p.estate || "",
    },
  ]);

  const bulkResponse = await elasticsearch.bulk({ operations, refresh: true });

  if (bulkResponse.errors) {
    const failed = bulkResponse.items.filter((i: any) => i.index?.error);
    logger.error({ count: failed.length }, "Some property indexing operations failed");
  }

  return properties.length;
}

export interface ESSearchFilters {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  listingStatus?: string;
  county?: string;
  estate?: string;
  furnished?: boolean;
  parking?: boolean;
  pool?: boolean;
  gym?: boolean;
  security?: boolean;
  internet?: boolean;
  petFriendly?: boolean;
  investmentProperty?: boolean;
  landSizeMin?: number;
  landSizeMax?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export async function searchPropertiesES(filters: ESSearchFilters) {
  if (!elasticsearch) return null;

  const must: any[] = [];
  const filter: any[] = [];
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;

  // Full-text query with multi_match across key fields
  if (filters.query) {
    must.push({
      multi_match: {
        query: filters.query,
        fields: ["address^3", "city^2", "county", "estate", "description"],
        fuzziness: "AUTO",
        prefix_length: 2,
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  // Filters
  if (filters.minPrice || filters.maxPrice) {
    const range: any = {};
    if (filters.minPrice) range.gte = filters.minPrice;
    if (filters.maxPrice) range.lte = filters.maxPrice;
    filter.push({ range: { price: range } });
  }

  if (filters.bedrooms) filter.push({ range: { beds: { gte: filters.bedrooms } } });
  if (filters.bathrooms) filter.push({ range: { baths: { gte: filters.bathrooms } } });
  if (filters.propertyType) filter.push({ term: { propertyType: filters.propertyType } });
  if (filters.listingStatus) filter.push({ term: { listingStatus: filters.listingStatus } });
  if (filters.county) filter.push({ match: { county: filters.county } });
  if (filters.estate) filter.push({ match: { estate: filters.estate } });
  if (filters.furnished !== undefined) filter.push({ term: { furnished: filters.furnished } });
  if (filters.parking !== undefined) filter.push({ term: { parking: filters.parking } });
  if (filters.pool !== undefined) filter.push({ term: { pool: filters.pool } });
  if (filters.gym !== undefined) filter.push({ term: { gym: filters.gym } });
  if (filters.security !== undefined) filter.push({ term: { security: filters.security } });
  if (filters.internet !== undefined) filter.push({ term: { internet: filters.internet } });
  if (filters.petFriendly !== undefined) filter.push({ term: { petFriendly: filters.petFriendly } });
  if (filters.investmentProperty !== undefined) filter.push({ term: { investmentProperty: filters.investmentProperty } });

  if (filters.landSizeMin || filters.landSizeMax) {
    const range: any = {};
    if (filters.landSizeMin) range.gte = filters.landSizeMin;
    if (filters.landSizeMax) range.lte = filters.landSizeMax;
    filter.push({ range: { landSize: range } });
  }

  // Sort
  let sort: any[];
  switch (filters.sortBy) {
    case "price":
      sort = [{ price: { order: "asc" } }];
      break;
    case "views":
      sort = [{ views: { order: "desc" } }];
      break;
    case "relevance":
    default:
      sort = filters.query ? ["_score"] : [{ createdAt: { order: "desc" } }];
      break;
  }

  const result = await elasticsearch.search({
    index: PROPERTIES_INDEX,
    query: { bool: { must, filter } },
    sort,
    from,
    size: limit,
    highlight: {
      fields: {
        title: {},
        address: {},
        city: {},
        description: { fragment_size: 150, number_of_fragments: 2 },
      },
    },
  });

  const ids = result.hits.hits.map((h: any) => h._id);

  // Fetch full property data from DB to ensure consistency
  if (ids.length === 0) {
    return { data: [], total: 0, pages: 0, page, limit };
  }

  const properties = await prisma.property.findMany({
    where: { id: { in: ids } },
    include: { neighborhood: { select: { id: true, name: true, city: true } } },
  }) as any[];

  // Preserve ES ordering
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  properties.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  // Get highlights for each hit
  const highlights = new Map<string, any>();
  for (const hit of result.hits.hits) {
    if (hit.highlight && hit._id) {
      highlights.set(hit._id, hit.highlight);
    }
  }

  return {
    data: properties.map((p) => ({
      ...p,
      _highlights: highlights.get(p.id) || null,
    })),
    total: typeof result.hits.total === "number" ? result.hits.total : result.hits.total?.value ?? 0,
    pages: Math.ceil((typeof result.hits.total === "number" ? result.hits.total : result.hits.total?.value ?? 0) / limit),
    page,
    limit,
  };
}

export async function autocompleteSearch(query: string, limit = 5): Promise<string[]> {
  if (!elasticsearch || !query) return [];

  try {
    const result = await elasticsearch.search({
      index: PROPERTIES_INDEX,
      query: {
        bool: {
          should: [
            { match_phrase_prefix: { address: { query, max_expansions: 10 } } },
            { match_phrase_prefix: { city: { query, max_expansions: 10 } } },
            { match_phrase_prefix: { county: { query, max_expansions: 10 } } },
            { match_phrase_prefix: { estate: { query, max_expansions: 10 } } },
          ],
        },
      },
      size: limit,
      _source: ["address", "city", "county", "estate"],
    });

    return result.hits.hits.map((h: any) => {
      const src = h._source;
      return [src.address, src.city, src.county, src.estate].filter(Boolean).join(", ");
    });
  } catch {
    return [];
  }
}
