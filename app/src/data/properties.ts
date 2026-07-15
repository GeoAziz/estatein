import property1 from "../assets/img/property-1.jpg";
import property2 from "../assets/img/property-2.jpg";
import property3 from "../assets/img/property-3.jpg";

export type Property = {
  slug: string;
  name: string;
  location: string;
  category: string;
  price: string;
  beds: number;
  baths: number;
  type: string;
  area: string;
  image: string;
  summary: string;
  description: string;
  features: string[];
};

export const PROPERTIES: Property[] = [
  {
    slug: "seaside-serenity-villa",
    name: "Seaside Serenity Villa",
    location: "Malibu, California",
    category: "Coastal Escapes — Where Waves Beckon",
    price: "$1,250,000",
    beds: 4,
    baths: 3,
    type: "Villa",
    area: "2,500 Square Feet",
    image: property1,
    summary:
      "Wake up to the soothing melody of waves. This beachfront villa offers an open floor plan and direct sand access.",
    description:
      "Discover your own piece of paradise with the Seaside Serenity Villa. With an open floor plan, breathtaking ocean views from every room, and direct access to a pristine sandy beach, this property is the epitome of coastal living.",
    features: [
      "Expansive oceanfront terrace for outdoor entertaining",
      "Gourmet kitchen with top-of-the-line appliances",
      "Private beach access for morning strolls and sunset views",
      "Master suite with a spa-inspired bathroom and ocean-facing balcony",
      "Private garage and ample storage space",
    ],
  },
  {
    slug: "metropolitan-haven",
    name: "Metropolitan Haven",
    location: "Downtown, New York",
    category: "Urban Oasis — Life in the Heart of the City",
    price: "$650,000",
    beds: 2,
    baths: 2,
    type: "Apartment",
    area: "1,150 Square Feet",
    image: property2,
    summary:
      "Immerse yourself in the energy of the city. A chic, fully-furnished apartment with panoramic skyline views.",
    description:
      "This modern apartment sits in the heart of the city, moments from the best dining, shopping, and nightlife. Floor-to-ceiling windows flood the open living space with light, framing panoramic views of the skyline.",
    features: [
      "Floor-to-ceiling windows with panoramic city views",
      "Fully-furnished with designer finishes throughout",
      "Building amenities include gym, rooftop lounge, and concierge",
      "Walking distance to transit, dining, and entertainment",
      "Dedicated parking space included",
    ],
  },
  {
    slug: "rustic-retreat-cottage",
    name: "Rustic Retreat Cottage",
    location: "Willow Creek, Vermont",
    category: "Countryside Charm — Escape to Nature's Embrace",
    price: "$350,000",
    beds: 3,
    baths: 3,
    type: "Cottage",
    area: "1,800 Square Feet",
    image: property3,
    summary:
      "Find tranquility in the countryside. A charming cottage nestled amidst rolling hills in a gated community.",
    description:
      "An elegant townhouse-style cottage set within a peaceful, gated community. Rolling hills surround the property, offering privacy and calm just a short drive from town.",
    features: [
      "Wraparound porch overlooking rolling hills",
      "Wood-burning fireplace in the main living area",
      "Renovated kitchen with farmhouse-style finishes",
      "Gated community with shared trails and green space",
      "Detached workshop / bonus storage building",
    ],
  },
];

export const PRICING_BREAKDOWN = {
  listingPrice: "$1,250,000",
  additionalFees: [
    { label: "Property Transfer Tax", amount: "$25,000", note: "Based on the sale price and local regulations" },
    { label: "Legal Fees", amount: "$3,000", note: "Approximate cost for legal services, including title transfer" },
    { label: "Home Inspection", amount: "$500", note: "Recommended for due diligence" },
    { label: "Property Insurance", amount: "$1,200", note: "Annual cost for comprehensive property insurance" },
    { label: "Mortgage Fees", amount: "Varies", note: "If applicable, consult with your lender for specific details" },
  ],
  monthlyCosts: [
    { label: "Property Taxes", amount: "$1,250", note: "Approximate monthly property tax based on the sale price and local rates" },
    { label: "Homeowners' Association Fee", amount: "$300", note: "Monthly fee for common area maintenance and security" },
  ],
  totalInitialCosts: [
    { label: "Listing Price", amount: "$1,250,000" },
    { label: "Additional Fees", amount: "$29,700", note: "Property transfer tax, legal fees, inspection, insurance" },
    { label: "Down Payment", amount: "$250,000", note: "20%" },
    { label: "Mortgage Amount", amount: "$1,000,000", note: "If applicable" },
  ],
  monthlyExpenses: [
    { label: "Property Taxes", amount: "$1,250" },
    { label: "Homeowners' Association Fee", amount: "$300" },
    { label: "Mortgage Payment", amount: "Varies based on terms and interest rate", note: "If applicable" },
    { label: "Property Insurance", amount: "$100", note: "Approximate monthly cost" },
  ],
};
