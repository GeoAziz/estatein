import prisma from "../config/database.js";

export async function computeValuation(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return null;

  // Find comparable properties
  const comparables = await prisma.property.findMany({
    where: {
      id: { not: propertyId },
      listingStatus: { not: "sold" },
      OR: [
        { city: property.city },
        { county: property.county || undefined },
      ],
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  // Score and weight comparables
  const scored = comparables.map((comp) => {
    let score = 0;
    let maxScore = 0;

    // Property type match (30% weight)
    maxScore += 30;
    if (comp.propertyType === property.propertyType) score += 30;
    else if (comp.propertyType.substring(0, 3) === property.propertyType.substring(0, 3)) score += 15;

    // Bedroom match (20% weight)
    maxScore += 20;
    if (comp.beds === property.beds) score += 20;
    else if (Math.abs(comp.beds - property.beds) === 1) score += 10;

    // Bathroom match (15% weight)
    maxScore += 15;
    if (comp.baths === property.baths) score += 15;
    else if (Math.abs(comp.baths - property.baths) <= 1) score += 7;

    // Price proximity (20% weight)
    maxScore += 20;
    const priceRatio = Math.min(comp.price, property.price) / Math.max(comp.price, property.price);
    score += priceRatio * 20;

    // Size proximity (15% weight)
    maxScore += 15;
    if (comp.sqFt && property.sqFt) {
      const sizeRatio = Math.min(comp.sqFt, property.sqFt) / Math.max(comp.sqFt, property.sqFt);
      score += sizeRatio * 15;
    } else {
      score += 7.5; // neutral if size unknown
    }

    return {
      ...comp,
      similarityScore: Math.round((score / maxScore) * 100),
    };
  });

  // Sort by similarity and take top 6
  const topComparables = scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 6);

  // Compute weighted estimate from comparables
  let estimatedValue = property.zestimate || property.price;
  if (topComparables.length >= 2) {
    const totalWeight = topComparables.reduce((sum, c) => sum + c.similarityScore, 0);
    const weightedPrice = topComparables.reduce(
      (sum, c) => sum + c.price * (c.similarityScore / totalWeight),
      0
    );

    // If we have size data, adjust by price per sqft
    if (property.sqFt && topComparables.some((c) => c.sqFt)) {
      const pricePerSqft = topComparables
        .filter((c) => c.sqFt)
        .map((c) => c.price / c.sqFt!);
      const avgPricePerSqft =
        pricePerSqft.reduce((s, v) => s + v, 0) / pricePerSqft.length;
      estimatedValue = Math.round(avgPricePerSqft * property.sqFt);
    } else {
      estimatedValue = Math.round(weightedPrice);
    }

    // Update the property's zestimate in DB
    await prisma.property.update({
      where: { id: propertyId },
      data: { zestimate: estimatedValue },
    });
  }

  // Compute confidence based on number of comparables and their similarity
  const avgSimilarity =
    topComparables.length > 0
      ? topComparables.reduce((s, c) => s + c.similarityScore, 0) / topComparables.length
      : 0;
  const confidence = Math.min(
    95,
    Math.round(avgSimilarity * 0.7 + Math.min(topComparables.length, 6) * 3)
  );

  // Compute price range
  const rangeSpread = estimatedValue * (1 - confidence / 100) * 0.5;
  const range = {
    low: Math.round(estimatedValue - rangeSpread),
    high: Math.round(estimatedValue + rangeSpread),
  };

  return {
    zestimate: estimatedValue,
    confidence,
    range,
    comparableCount: topComparables.length,
    comparables: topComparables.map((c) => ({
      id: c.id,
      name: c.address,
      price: c.price,
      beds: c.beds,
      baths: c.baths,
      sqFt: c.sqFt,
      address: c.address,
      city: c.city,
      similarityScore: c.similarityScore,
    })),
    factors: {
      propertyTypeMatch: topComparables.filter((c) => c.propertyType === property.propertyType).length,
      locationProximity: topComparables.filter((c) => c.city === property.city).length,
      avgPricePerSqft: property.sqFt
        ? Math.round(estimatedValue / property.sqFt)
        : null,
    },
  };
}

export async function computeMarketTrends(location: string) {
  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { city: { contains: location, mode: "insensitive" } },
        { county: { contains: location, mode: "insensitive" } },
        { estate: { contains: location, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (properties.length === 0) {
    return {
      medianPrice: 0,
      priceChange: "0%",
      daysOnMarket: 0,
      inventory: 0,
      trend: "stable" as const,
      pricePerSqft: 0,
      averagePrice: 0,
      priceHistory: [],
      byType: {},
    };
  }

  const prices = properties.map((p) => p.price).sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)];
  const averagePrice = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);

  // Compute actual price change from price history
  let priceChangePercent = 0;
  const priceHistory: { month: string; price: number }[] = [];

  // Group properties by month using createdAt and aggregate
  const monthMap = new Map<string, number[]>();
  for (const p of properties) {
    const month = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(p.price);
  }

  const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [month, monthPrices] of sortedMonths) {
    const avg = monthPrices.reduce((s, v) => s + v, 0) / monthPrices.length;
    priceHistory.push({ month, price: Math.round(avg) });
  }

  if (priceHistory.length >= 2) {
    const first = priceHistory[0].price;
    const last = priceHistory[priceHistory.length - 1].price;
    priceChangePercent = ((last - first) / first) * 100;
  }

  const avgDaysOnMarket =
    properties.reduce((sum, p) => sum + (p.daysOnMarket || 30), 0) / properties.length;

  // Determine trend
  let trend: "up" | "down" | "stable" = "stable";
  if (priceChangePercent > 1) trend = "up";
  else if (priceChangePercent < -1) trend = "down";

  // Aggregate by type
  const byType: Record<string, number> = {};
  for (const p of properties) {
    byType[p.propertyType] = (byType[p.propertyType] || 0) + 1;
  }

  // Price per sqft
  const withSqft = properties.filter((p) => p.sqFt && p.sqFt > 0);
  const pricePerSqft =
    withSqft.length > 0
      ? Math.round(
          withSqft.reduce((s, p) => s + p.price / p.sqFt!, 0) / withSqft.length
        )
      : 0;

  return {
    medianPrice,
    averagePrice,
    priceChange: `${priceChangePercent >= 0 ? "+" : ""}${priceChangePercent.toFixed(1)}%`,
    priceChangePercent,
    daysOnMarket: Math.round(avgDaysOnMarket),
    inventory: properties.length,
    trend,
    pricePerSqft,
    priceHistory,
    byType,
  };
}
