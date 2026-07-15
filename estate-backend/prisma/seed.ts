import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inquiryReply.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.review.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.propertyNearbySchool.deleteMany();
  await prisma.school.deleteMany();
  await prisma.property.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.mortgageRate.deleteMany();
  await prisma.article.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password1", 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: "admin@estatein.com",
      passwordHash,
      name: "Estatein Admin",
      phone: "+1 (123) 555-0100",
      role: "admin",
      isVerified: true,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      email: "agent@estatein.com",
      passwordHash,
      name: "Sarah Johnson",
      phone: "+1 (123) 456-7890",
      role: "agent",
      isVerified: true,
    },
  });

  const buyerUser = await prisma.user.create({
    data: {
      email: "buyer@estatein.com",
      passwordHash,
      name: "Wade Warren",
      phone: "+1 (123) 555-0134",
      role: "buyer",
      isVerified: true,
    },
  });

  // Create agent profile
  const agent = await prisma.agent.create({
    data: {
      userId: agentUser.id,
      licenseNumber: "RE-88213",
      licenseState: "New York",
      brokerage: "Estatein Realty",
      yearsExperience: 8,
      serviceAreas: ["Malibu, California", "Downtown, New York", "Willow Creek, Vermont"],
      specialties: ["Luxury Homes", "Commercial", "First-Time Buyers"],
      totalSales: 47,
      averageSalePrice: 750000,
      rating: 4.8,
      reviewCount: 23,
      verified: true,
    },
  });

  // Create neighborhoods
  const malibu = await prisma.neighborhood.create({
    data: {
      name: "Malibu Beach",
      city: "Malibu",
      state: "California",
      zipCode: "90265",
      medianHomeValue: 3200000,
      medianRent: 8500,
      population: 12000,
      walkabilityScore: 45,
      transitScore: 25,
      crimeRate: 0.8,
      amenities: ["Beach Access", "Restaurants", "Shopping", "Parks"],
      lat: 34.0259,
      lng: -118.7798,
    },
  });

  const nyc = await prisma.neighborhood.create({
    data: {
      name: "Downtown Manhattan",
      city: "New York",
      state: "New York",
      zipCode: "10007",
      medianHomeValue: 1800000,
      medianRent: 5200,
      population: 60000,
      walkabilityScore: 98,
      transitScore: 100,
      crimeRate: 2.1,
      amenities: ["Transit", "Dining", "Shopping", "Entertainment"],
      lat: 40.7128,
      lng: -74.006,
    },
  });

  const vermont = await prisma.neighborhood.create({
    data: {
      name: "Willow Creek",
      city: "Willow Creek",
      state: "Vermont",
      zipCode: "05401",
      medianHomeValue: 420000,
      medianRent: 2100,
      population: 8000,
      walkabilityScore: 55,
      transitScore: 30,
      crimeRate: 0.5,
      amenities: ["Trails", "Parks", "Farmers Market", "Schools"],
      lat: 44.4759,
      lng: -73.2121,
    },
  });

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      address: "12 Ocean Drive",
      city: "Malibu",
      state: "California",
      zipCode: "90265",
      propertyType: "house",
      beds: 4,
      baths: 3,
      sqFt: 2500,
      lotSize: 8000,
      yearBuilt: 2015,
      price: 1250000,
      listingStatus: "for_sale",
      description: "Wake up to the soothing melody of waves. This beachfront villa offers an open floor plan and direct sand access.",
      features: ["Ocean Views", "Private Beach Access", "Gourmet Kitchen", "Spa Bathroom", "Private Garage"],
      amenities: ["Pool", "Fireplace", "Deck"],
      photos: [],
      daysOnMarket: 15,
      neighborhoodId: malibu.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      address: "88 Skyline Ave",
      city: "New York",
      state: "New York",
      zipCode: "10007",
      propertyType: "apartment",
      beds: 2,
      baths: 2,
      sqFt: 1150,
      yearBuilt: 2020,
      price: 650000,
      listingStatus: "for_sale",
      description: "A chic, fully-furnished apartment with panoramic skyline views in the heart of the city.",
      features: ["Floor-to-ceiling Windows", "Designer Finishes", "Gym", "Concierge", "Parking"],
      amenities: ["Furnished", "WiFi Included", "Security"],
      photos: [],
      daysOnMarket: 8,
      neighborhoodId: nyc.id,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      address: "4 Willow Lane",
      city: "Willow Creek",
      state: "Vermont",
      zipCode: "05401",
      propertyType: "house",
      beds: 3,
      baths: 3,
      sqFt: 1800,
      lotSize: 12000,
      yearBuilt: 2005,
      price: 350000,
      listingStatus: "for_sale",
      description: "Find tranquility in the countryside. A charming cottage nestled amidst rolling hills in a gated community.",
      features: ["Wraparound Porch", "Wood-burning Fireplace", "Renovated Kitchen", "Gated Community", "Workshop"],
      amenities: [],
      photos: [],
      daysOnMarket: 41,
      neighborhoodId: vermont.id,
    },
  });

  const rental = await prisma.property.create({
    data: {
      address: "200 Harbor Blvd",
      city: "New York",
      state: "New York",
      zipCode: "10006",
      propertyType: "apartment",
      beds: 2,
      baths: 2,
      sqFt: 1100,
      yearBuilt: 2018,
      price: 3200,
      rentEstimate: 3200,
      listingStatus: "for_rent",
      description: "A chic, fully-furnished apartment with panoramic skyline and harbor views.",
      features: ["Harbor Views", "In-unit Laundry", "Balcony"],
      amenities: ["Furnished", "Utilities Included", "Gym", "Maintenance Included"],
      photos: [],
      daysOnMarket: 5,
      neighborhoodId: nyc.id,
    },
  });

  // Create listings
  await prisma.listing.create({
    data: {
      userId: agentUser.id,
      propertyId: property1.id,
      title: "Seaside Serenity Villa",
      description: "Wake up to the soothing melody of waves in this beachfront villa.",
      listingType: "for_sale",
      price: 1250000,
      status: "active",
      views: 482,
      favorites: 36,
      inquiries: 5,
    },
  });

  await prisma.listing.create({
    data: {
      userId: agentUser.id,
      propertyId: property2.id,
      title: "Metropolitan Haven",
      description: "A chic, fully-furnished apartment with panoramic skyline views.",
      listingType: "for_sale",
      price: 650000,
      status: "pending",
      views: 214,
      favorites: 19,
      inquiries: 2,
    },
  });

  await prisma.listing.create({
    data: {
      userId: agentUser.id,
      propertyId: property3.id,
      title: "Rustic Retreat Cottage",
      description: "Find tranquility in the countryside in this charming gated cottage.",
      listingType: "for_sale",
      price: 350000,
      status: "active",
      views: 610,
      favorites: 52,
      inquiries: 8,
    },
  });

  // Create inquiries
  await prisma.inquiry.create({
    data: {
      buyerId: buyerUser.id,
      agentId: agentUser.id,
      propertyId: property1.id,
      message: "Is this property still available? I'd love to see it in person.",
      contactMethod: "email",
      viewingRequested: true,
      viewingDate: new Date(Date.now() + 3 * 86400000),
      viewingTime: "2:00 PM",
      viewingStatus: "requested",
      status: "new",
    },
  });

  await prisma.inquiry.create({
    data: {
      buyerId: buyerUser.id,
      agentId: agentUser.id,
      propertyId: property3.id,
      message: "Are you open to negotiating on price?",
      contactMethod: "phone",
      viewingRequested: false,
      status: "responded",
      respondedAt: new Date(Date.now() - 9 * 86400000),
    },
  });

  // Create favorites
  await prisma.favorite.create({
    data: { userId: buyerUser.id, propertyId: property1.id },
  });
  await prisma.favorite.create({
    data: { userId: buyerUser.id, propertyId: property2.id },
  });

  // Create saved searches
  await prisma.savedSearch.create({
    data: {
      userId: buyerUser.id,
      name: "3BR Homes in New York",
      searchType: "buy",
      location: "New York",
      filters: { minPrice: 0, maxPrice: 1000000, bedrooms: 3 },
      alertsEnabled: true,
      alertFrequency: "daily",
    },
  });

  // Create mortgage rates
  await prisma.mortgageRate.createMany({
    data: [
      { loanType: "30-Year Fixed", termYears: 30, ratePercentage: 6.5, apyPercentage: 6.65, points: 0.5 },
      { loanType: "15-Year Fixed", termYears: 15, ratePercentage: 5.8, apyPercentage: 5.95, points: 0.25 },
      { loanType: "5/1 ARM", termYears: 30, ratePercentage: 5.5, apyPercentage: 6.8, points: 0 },
      { loanType: "7/1 ARM", termYears: 30, ratePercentage: 5.75, apyPercentage: 6.5, points: 0 },
    ],
  });

  // Create articles
  await prisma.article.createMany({
    data: [
      {
        title: "First-Time Buyer's Guide to Mortgages",
        slug: "first-time-buyers-guide-to-mortgages",
        content: "Everything first-time buyers need to know before applying for a mortgage...",
        category: "Buying",
        authorName: "Sarah Johnson",
        readTimeMinutes: 6,
        publishedAt: new Date("2026-06-03"),
      },
      {
        title: "5 Tips for Staging Your Home",
        slug: "5-tips-for-staging-your-home",
        content: "Simple, high-impact staging changes that help your home sell faster...",
        category: "Selling",
        authorName: "David Brown",
        readTimeMinutes: 4,
        publishedAt: new Date("2026-05-22"),
      },
      {
        title: "2024 Real Estate Market Trends",
        slug: "2024-real-estate-market-trends",
        content: "From shifting mortgage rates to inventory recovery...",
        category: "Market Analysis",
        authorName: "Sarah Johnson",
        readTimeMinutes: 9,
        publishedAt: new Date("2026-06-10"),
      },
    ],
  });

  console.log("Database seeded successfully!");
  console.log("Demo accounts:");
  console.log("  Admin:  admin@estatein.com / Password1");
  console.log("  Agent:  agent@estatein.com / Password1");
  console.log("  Buyer:  buyer@estatein.com / Password1");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
