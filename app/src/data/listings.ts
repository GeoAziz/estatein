import property1 from "../assets/img/property-1.jpg";
import property2 from "../assets/img/property-2.jpg";
import property3 from "../assets/img/property-3.jpg";

export type RentalProperty = {
  slug: string;
  name: string;
  location: string;
  rent: string;
  beds: number;
  baths: number;
  leaseTerm: string;
  furnished: "Furnished" | "Unfurnished";
  utilitiesIncluded: boolean;
  petPolicy: string;
  image: string;
  summary: string;
};

export const RENTAL_PROPERTIES: RentalProperty[] = [
  {
    slug: "harbor-view-apartment",
    name: "Harbor View Apartment",
    location: "Downtown, New York",
    rent: "$3,200/mo",
    beds: 2,
    baths: 2,
    leaseTerm: "1-Year",
    furnished: "Furnished",
    utilitiesIncluded: true,
    petPolicy: "Cats & Dogs Welcome",
    image: property2,
    summary: "A chic, fully-furnished apartment with panoramic skyline and harbor views.",
  },
  {
    slug: "willow-creek-cottage-rental",
    name: "Willow Creek Cottage",
    location: "Willow Creek, Vermont",
    rent: "$1,850/mo",
    beds: 3,
    baths: 2,
    leaseTerm: "6-Month",
    furnished: "Unfurnished",
    utilitiesIncluded: false,
    petPolicy: "Cats Only",
    image: property3,
    summary: "A charming countryside cottage available for flexible-term leasing.",
  },
  {
    slug: "seaside-studio",
    name: "Seaside Studio",
    location: "Malibu, California",
    rent: "$2,450/mo",
    beds: 1,
    baths: 1,
    leaseTerm: "Month-to-Month",
    furnished: "Furnished",
    utilitiesIncluded: true,
    petPolicy: "No Pets",
    image: property1,
    summary: "A breezy beachfront studio, ideal for short or flexible stays near the coast.",
  },
];

export type NewConstructionProperty = {
  slug: string;
  name: string;
  location: string;
  developer: string;
  completionDate: string;
  startingPrice: string;
  beds: string;
  image: string;
  summary: string;
};

export const NEW_CONSTRUCTION_PROPERTIES: NewConstructionProperty[] = [
  {
    slug: "cedar-hills-residences",
    name: "Cedar Hills Residences",
    location: "Austin, Texas",
    developer: "Northbridge Development Group",
    completionDate: "March 2027",
    startingPrice: "From $480,000",
    beds: "2–4 Bedroom",
    image: property1,
    summary: "A brand-new gated community of modern homes with energy-efficient design.",
  },
  {
    slug: "the-meridian-towers",
    name: "The Meridian Towers",
    location: "Downtown, New York",
    developer: "Skyline Urban Partners",
    completionDate: "November 2026",
    startingPrice: "From $720,000",
    beds: "1–3 Bedroom",
    image: property2,
    summary: "High-rise condominiums with skyline views, concierge, and rooftop amenities.",
  },
  {
    slug: "orchard-grove-cottages",
    name: "Orchard Grove Cottages",
    location: "Willow Creek, Vermont",
    developer: "Green Valley Builders",
    completionDate: "June 2027",
    startingPrice: "From $395,000",
    beds: "3 Bedroom",
    image: property3,
    summary: "A boutique collection of craftsman-style cottages surrounded by orchards.",
  },
];

export type ComingSoonProperty = {
  slug: string;
  name: string;
  location: string;
  expectedDate: string;
  beds: number;
  baths: number;
  price: string;
  image: string;
  summary: string;
};

export const COMING_SOON_PROPERTIES: ComingSoonProperty[] = [
  {
    slug: "lakeside-modern-estate",
    name: "Lakeside Modern Estate",
    location: "Lake Tahoe, California",
    expectedDate: "Listing September 2026",
    beds: 5,
    baths: 4,
    price: "Est. $2,100,000",
    image: property1,
    summary: "A lakeside architectural showpiece with private dock, coming soon to the market.",
  },
  {
    slug: "midtown-sky-loft",
    name: "Midtown Sky Loft",
    location: "Downtown, New York",
    expectedDate: "Listing August 2026",
    beds: 2,
    baths: 2,
    price: "Est. $890,000",
    image: property2,
    summary: "An industrial-chic loft conversion in the heart of midtown, launching soon.",
  },
  {
    slug: "hillcrest-family-home",
    name: "Hillcrest Family Home",
    location: "Willow Creek, Vermont",
    expectedDate: "Listing October 2026",
    beds: 4,
    baths: 3,
    price: "Est. $525,000",
    image: property3,
    summary: "A spacious family home on a private hillside lot, coming soon.",
  },
];
