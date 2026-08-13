import { prisma } from './client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding lbs. Revenue OS database...')

  // ─── Create admin user ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('changeme-in-production', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lbsdist.com' },
    update: {},
    create: {
      name: 'Ross Haley',
      email: 'admin@lbsdist.com',
      passwordHash: adminPassword,
      role: 'FULL',
    },
  })
  console.log(`✓ Admin user: ${admin.email}`)

  // ─── Create sample buyer ────────────────────────────────────────────────
  const buyer = await prisma.buyer.upsert({
    where: { licenseNumber: 'C10-0000123-LIC' },
    update: {},
    create: {
      businessName: 'Green Leaf Dispensary',
      licenseNumber: 'C10-0000123-LIC',
      contactName: 'Maria Santos',
      email: 'orders@greenleaf.com',
      phone: '(916) 555-0100',
      tier: 'A',
      paymentTerms: 30,
    },
  })
  console.log(`✓ Sample buyer: ${buyer.businessName}`)

  // ─── Create sample batches (mirrors mock data) ──────────────────────────
  const batch1 = await prisma.batch.upsert({
    where: { nabisId: 'mock-al-002' },
    update: {},
    create: {
      nabisId: 'mock-al-002',
      nabisAccount: 'CONNECTED_ALIEN_LABS',
      sku: 'AL-ZTTZ-3.5-002',
      batchNumber: 'AL-2024-ZTZ-D01',
      productName: 'Ztartz 3.5g',
      brand: 'Alien Labs',
      category: 'flower',
      harvestDate: new Date('2024-11-01'),
      labResultDate: new Date('2024-11-10'),
      thcPct: 35.2,
      cbdPct: 0.04,
      qtyOnHand: 8,
      caseSize: 12,
      unitPrice: 85.00,
      casePrice: 1020.00,
    },
  })
  console.log(`✓ Sample batch: ${batch1.productName}`)

  console.log('\n✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
