// Kenyan locations management - counties and estates

import { Request, Response } from 'express';
import prisma from '../config/database.js';

// Kenyan counties data
const KENYAN_COUNTIES = [
  { name: 'Baringo', code: 'BA', region: 'Rift Valley' },
  { name: 'Bomet', code: 'BO', region: 'Rift Valley' },
  { name: 'Bungoma', code: 'BU', region: 'Western' },
  { name: 'Busia', code: 'BS', region: 'Western' },
  { name: 'Elgeyo-Marakwet', code: 'EM', region: 'Rift Valley' },
  { name: 'Embu', code: 'EM', region: 'Eastern' },
  { name: 'Garissa', code: 'GA', region: 'North Eastern' },
  { name: 'Homa Bay', code: 'HB', region: 'Nyanza' },
  { name: 'Isiolo', code: 'IS', region: 'North Eastern' },
  { name: 'Kajiado', code: 'KA', region: 'Rift Valley' },
  { name: 'Kakamega', code: 'KK', region: 'Western' },
  { name: 'Kericho', code: 'KE', region: 'Rift Valley' },
  { name: 'Kiambu', code: 'KI', region: 'Central' },
  { name: 'Kilifi', code: 'KL', region: 'Coast' },
  { name: 'Kirinyaga', code: 'KR', region: 'Central' },
  { name: 'Kisii', code: 'KI', region: 'Nyanza' },
  { name: 'Kisumu', code: 'KS', region: 'Nyanza' },
  { name: 'Kitui', code: 'KT', region: 'Eastern' },
  { name: 'Kwale', code: 'KW', region: 'Coast' },
  { name: 'Laikipia', code: 'LA', region: 'Rift Valley' },
  { name: 'Lamu', code: 'LU', region: 'Coast' },
  { name: 'Machakos', code: 'MA', region: 'Eastern' },
  { name: 'Makueni', code: 'MK', region: 'Eastern' },
  { name: 'Mandera', code: 'MD', region: 'North Eastern' },
  { name: 'Marsabit', code: 'MR', region: 'North Eastern' },
  { name: 'Meru', code: 'ME', region: 'Eastern' },
  { name: 'Migori', code: 'MG', region: 'Nyanza' },
  { name: 'Mombasa', code: 'MB', region: 'Coast' },
  { name: 'Murang\'a', code: 'MU', region: 'Central' },
  { name: 'Nakuru', code: 'NA', region: 'Rift Valley' },
  { name: 'Nairobi', code: 'NR', region: 'Central' },
  { name: 'Nandi', code: 'NA', region: 'Rift Valley' },
  { name: 'Narok', code: 'NK', region: 'Rift Valley' },
  { name: 'Nyamira', code: 'NY', region: 'Nyanza' },
  { name: 'Nyandarua', code: 'NY', region: 'Central' },
  { name: 'Nyeri', code: 'NY', region: 'Central' },
  { name: 'Samburu', code: 'SA', region: 'Rift Valley' },
  { name: 'Siaya', code: 'SI', region: 'Nyanza' },
  { name: 'Taita-Taveta', code: 'TT', region: 'Coast' },
  { name: 'Tana River', code: 'TR', region: 'Coast' },
  { name: 'Tharaka-Nithi', code: 'TN', region: 'Eastern' },
  { name: 'Trans Nzoia', code: 'TN', region: 'Rift Valley' },
  { name: 'Turkana', code: 'TU', region: 'Rift Valley' },
  { name: 'Uasin Gishu', code: 'UG', region: 'Rift Valley' },
  { name: 'Vihiga', code: 'VI', region: 'Western' },
  { name: 'Wajir', code: 'WJ', region: 'North Eastern' },
  { name: 'West Pokot', code: 'WP', region: 'Rift Valley' },
];

// Nairobi estates/suburbs data
const NAIROBI_ESTATES = [
  { name: 'Kilimani', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Westlands', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Karen', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Lavington', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Muthaiga', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Spring Valley', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Parklands', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Runda', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Gigiri', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Kileleshwa', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Upper Hill', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Hurlingham', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Langata', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Nyari', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Nairobi South', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Embakasi', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Kasarani', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Ruai', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Juja', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Makadara', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Roysambu', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Mathare', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Dagoretti', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Langata', county: 'Nairobi', city: 'Nairobi' },
  { name: 'Kawangware', county: 'Nairobi', city: 'Nairobi' },
];

export async function getCounties(req: Request, res: Response) {
  try {
    const { search } = req.query;

    const query = prisma.county.findMany({
      orderBy: { name: 'asc' },
    });

    if (search) {
      const searchStr = String(search).toLowerCase();
      const filtered = KENYAN_COUNTIES.filter(
        (c) =>
          c.name.toLowerCase().includes(searchStr) ||
          c.region?.toLowerCase().includes(searchStr)
      );

      return res.json({
        counties: filtered.map((c) => ({
          id: c.code,
          name: c.name,
          code: c.code,
          region: c.region,
        })),
      });
    }

    res.json({
      counties: KENYAN_COUNTIES.map((c) => ({
        id: c.code,
        name: c.name,
        code: c.code,
        region: c.region,
      })),
    });
  } catch (error) {
    console.error('Get counties error:', error);
    res.status(500).json({
      error: 'Failed to fetch counties',
    });
  }
}

export async function getEstates(req: Request, res: Response) {
  try {
    const { county, city, search, limit = '50' } = req.query;

    const whereClause: any = {};

    if (county) {
      whereClause.county = county;
    }

    if (city) {
      whereClause.city = city;
    }

    let estates = await prisma.estate.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      take: Math.min(parseInt(String(limit)), 100),
    });

    // If no results from database, use default data
    if (estates.length === 0 && String(county) === 'Nairobi') {
      estates = NAIROBI_ESTATES.map((e) => ({
        id: e.name,
        name: e.name,
        county: e.county,
        city: e.city,
        lat: null,
        lng: null,
      }));
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      estates = estates.filter((e) => e.name.toLowerCase().includes(searchStr));
    }

    res.json({
      estates: estates.map((e) => ({
        id: e.id,
        name: e.name,
        county: e.county,
        city: e.city,
      })),
    });
  } catch (error) {
    console.error('Get estates error:', error);
    res.status(500).json({
      error: 'Failed to fetch estates',
    });
  }
}

export async function seedLocations(req: Request, res: Response) {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Seed counties
    for (const county of KENYAN_COUNTIES) {
      await prisma.county.upsert({
        where: { name: county.name },
        update: {},
        create: {
          name: county.name,
          code: county.code,
          region: county.region,
        },
      });
    }

    // Seed estates
    for (const estate of NAIROBI_ESTATES) {
      await prisma.estate.upsert({
        where: { name_county: { name: estate.name, county: estate.county } },
        update: {},
        create: estate,
      });
    }

    res.json({ success: true, message: 'Locations seeded successfully' });
  } catch (error) {
    console.error('Seed locations error:', error);
    res.status(500).json({
      error: 'Failed to seed locations',
    });
  }
}

export async function searchLocations(req: Request, res: Response) {
  try {
    const { query } = req.query;

    if (!query || String(query).length < 2) {
      return res.json({ results: [] });
    }

    const searchStr = String(query).toLowerCase();

    // Search counties
    const counties = KENYAN_COUNTIES.filter(
      (c) =>
        c.name.toLowerCase().includes(searchStr) ||
        c.region?.toLowerCase().includes(searchStr)
    ).map((c) => ({
      type: 'county',
      id: c.code,
      name: c.name,
      region: c.region,
    }));

    // Search estates
    const estates = NAIROBI_ESTATES.filter((e) =>
      e.name.toLowerCase().includes(searchStr)
    ).map((e) => ({
      type: 'estate',
      id: e.name,
      name: e.name,
      county: e.county,
      city: e.city,
    }));

    res.json({
      results: [...counties, ...estates].slice(0, 20),
    });
  } catch (error) {
    console.error('Search locations error:', error);
    res.status(500).json({
      error: 'Failed to search locations',
    });
  }
}
