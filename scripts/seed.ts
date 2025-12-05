import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'Demo Auto Trading',
      country: 'AU',
      timezone: 'Australia/Sydney',
      plan: 'FREE',
    },
  });

  console.log('Created organization:', org.name);

  // Create demo user
  const passwordHash = await hash('demo123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@tradepilot.ai' },
    update: {},
    create: {
      email: 'demo@tradepilot.ai',
      passwordHash,
      name: 'Demo Trader',
      role: 'OWNER',
      organizationId: org.id,
    },
  });

  console.log('Created user:', user.email);

  // Create AI preferences for user
  await prisma.aiPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      targetMarginPercent: 15,
      maxDaysInStock: 45,
      riskTolerance: 'MEDIUM',
      negotiationTone: 'POLITE',
    },
  });

  // Create subscription
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      plan: 'FREE',
      status: 'ACTIVE',
    },
  });

  // Create sample vehicles and deals
  const sampleDeals = [
    {
      vehicle: {
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        variant: 'SL Hybrid',
        odometer: 45000,
        transmission: 'AUTOMATIC',
        fuelType: 'HYBRID',
        bodyType: 'SEDAN',
        colour: 'White',
      },
      askPrice: 32000,
      status: 'SOURCED',
      sourceSite: 'Carsales',
      aiRecommendation: 'STRONG_BUY',
      estimatedMargin: 18.5,
      riskScore: 25,
    },
    {
      vehicle: {
        year: 2019,
        make: 'Mazda',
        model: 'CX-5',
        variant: 'Touring',
        odometer: 62000,
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        bodyType: 'SUV',
        colour: 'Grey',
      },
      askPrice: 28500,
      status: 'CONTACTED',
      sourceSite: 'Facebook Marketplace',
      aiRecommendation: 'MAYBE',
      estimatedMargin: 12.0,
      riskScore: 45,
    },
    {
      vehicle: {
        year: 2021,
        make: 'Hyundai',
        model: 'Tucson',
        variant: 'Elite',
        odometer: 28000,
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        bodyType: 'SUV',
        colour: 'Blue',
      },
      askPrice: 38000,
      status: 'OFFERED',
      sourceSite: 'Carsales',
      negotiatedPrice: 35500,
      aiRecommendation: 'STRONG_BUY',
      estimatedMargin: 16.0,
      riskScore: 20,
    },
    {
      vehicle: {
        year: 2018,
        make: 'Ford',
        model: 'Ranger',
        variant: 'XLT',
        odometer: 85000,
        transmission: 'AUTOMATIC',
        fuelType: 'DIESEL',
        bodyType: 'UTE',
        colour: 'Black',
      },
      askPrice: 42000,
      status: 'ACQUIRED',
      sourceSite: 'Gumtree',
      actualPurchasePrice: 39000,
      aiRecommendation: 'MAYBE',
      estimatedMargin: 10.5,
      riskScore: 55,
      acquiredAt: new Date('2024-11-15'),
    },
    {
      vehicle: {
        year: 2017,
        make: 'Volkswagen',
        model: 'Golf',
        variant: 'R',
        odometer: 72000,
        transmission: 'DCT',
        fuelType: 'PETROL',
        bodyType: 'HATCHBACK',
        colour: 'White',
      },
      askPrice: 35000,
      status: 'LISTED',
      sourceSite: 'Carsales',
      actualPurchasePrice: 31000,
      reconditioningCost: 1200,
      aiRecommendation: 'STRONG_BUY',
      estimatedMargin: 15.0,
      riskScore: 35,
      acquiredAt: new Date('2024-10-20'),
      listedAt: new Date('2024-11-01'),
    },
    {
      vehicle: {
        year: 2019,
        make: 'Kia',
        model: 'Sportage',
        variant: 'SLi',
        odometer: 55000,
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        bodyType: 'SUV',
        colour: 'Silver',
      },
      askPrice: 26000,
      status: 'SOLD',
      sourceSite: 'Private Sale',
      actualPurchasePrice: 23000,
      actualSellPrice: 28500,
      reconditioningCost: 800,
      aiRecommendation: 'STRONG_BUY',
      estimatedMargin: 18.0,
      riskScore: 22,
      acquiredAt: new Date('2024-09-15'),
      listedAt: new Date('2024-09-25'),
      soldAt: new Date('2024-10-10'),
    },
  ];

  for (const dealData of sampleDeals) {
    const vehicle = await prisma.vehicle.create({
      data: {
        organizationId: org.id,
        ...dealData.vehicle,
        transmission: dealData.vehicle.transmission as any,
        fuelType: dealData.vehicle.fuelType as any,
        bodyType: dealData.vehicle.bodyType as any,
      },
    });

    await prisma.deal.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        status: dealData.status as any,
        askPrice: dealData.askPrice,
        sourceSite: dealData.sourceSite,
        negotiatedPrice: dealData.negotiatedPrice,
        actualPurchasePrice: dealData.actualPurchasePrice,
        actualSellPrice: dealData.actualSellPrice,
        reconditioningCost: dealData.reconditioningCost,
        aiRecommendation: dealData.aiRecommendation as any,
        estimatedMargin: dealData.estimatedMargin,
        riskScore: dealData.riskScore,
        estimatedFairValueLow: dealData.askPrice * 0.9,
        estimatedFairValueHigh: dealData.askPrice * 1.1,
        estimatedTargetSellPrice: dealData.askPrice * 1.15,
        estimatedDaysToSell: 30,
        acquiredAt: dealData.acquiredAt,
        listedAt: dealData.listedAt,
        soldAt: dealData.soldAt,
      },
    });

    console.log(`Created deal: ${dealData.vehicle.year} ${dealData.vehicle.make} ${dealData.vehicle.model}`);
  }

  console.log('Seeding complete!');
  console.log('\nDemo credentials:');
  console.log('Email: demo@tradepilot.ai');
  console.log('Password: demo123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
