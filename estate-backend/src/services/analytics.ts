import prisma from '../config/database.js';

interface DateRange {
  from?: Date;
  to?: Date;
}

function dateFilter({ from, to }: DateRange) {
  if (!from && !to) return undefined;
  const filter: any = {};
  if (from) filter.gte = from;
  if (to) filter.lte = to;
  return filter;
}

/**
 * Platform-wide overview metrics: MAU proxy, listings, inquiries, revenue.
 */
export async function getOverview(range: DateRange = {}) {
  const createdAt = dateFilter(range);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalListings,
    activeListings,
    totalInquiries,
    totalUsers,
    revenueAgg,
    activeUserEvents,
  ] = await Promise.all([
    prisma.property.count(createdAt ? { where: { createdAt } } : undefined),
    prisma.property.count({ where: { listingStatus: 'for_sale' } }),
    prisma.inquiry.count(createdAt ? { where: { createdAt } } : undefined),
    prisma.user.count(createdAt ? { where: { createdAt } } : undefined),
    prisma.payment.aggregate({
      where: { status: 'completed', ...(createdAt ? { createdAt } : {}) },
      _sum: { amount: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  return {
    totalListings,
    activeListings,
    totalInquiries,
    totalUsers,
    totalRevenue: revenueAgg._sum.amount || 0,
    monthlyActiveUsers: activeUserEvents.length,
  };
}

/**
 * Per-property analytics: views, inquiries, conversion rate.
 */
export async function getPropertyAnalytics(propertyId: string) {
  const [property, inquiryCount, favoriteCount] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, address: true, views: true, favorites: true, price: true, createdAt: true },
    }),
    prisma.inquiry.count({ where: { propertyId } }),
    prisma.favorite.count({ where: { propertyId } }),
  ]);

  if (!property) return null;

  const conversionRate = property.views > 0 ? (inquiryCount / property.views) * 100 : 0;

  return {
    property,
    inquiryCount,
    favoriteCount,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

/**
 * Per-agent performance: listings, closed deals, rating.
 */
export async function getAgentPerformance(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      totalSales: true,
      averageSalePrice: true,
      rating: true,
      reviewCount: true,
      userId: true,
    },
  });

  if (!agent) return null;

  const [listingsCount, activeListingsCount, slotsBooked] = await Promise.all([
    prisma.listing.count({ where: { userId: agent.userId } }),
    prisma.listing.count({ where: { userId: agent.userId, status: 'active' } }),
    prisma.agentAvailabilitySlot.count({ where: { agentId: agent.id, isBooked: true } }),
  ]);

  return {
    agent,
    listingsCount,
    activeListingsCount,
    viewingsBooked: slotsBooked,
  };
}

/**
 * Regional trend analysis: property count, avg price, inquiries by county.
 */
export async function getRegionalTrends() {
  const properties = await prisma.property.groupBy({
    by: ['county'],
    where: { county: { not: null } },
    _count: { id: true },
    _avg: { price: true },
  });

  const regional = await Promise.all(
    properties.map(async (p) => {
      const inquiryCount = await prisma.inquiry.count({
        where: { property: { county: p.county } },
      });
      return {
        county: p.county,
        propertyCount: p._count.id,
        avgPrice: p._avg.price ? Math.round(p._avg.price) : 0,
        inquiryCount,
      };
    })
  );

  return regional.sort((a, b) => b.propertyCount - a.propertyCount);
}

/**
 * Export overview + regional data as flat rows for CSV.
 */
export async function getExportData() {
  const [overview, regional] = await Promise.all([getOverview(), getRegionalTrends()]);
  return { overview, regional };
}
