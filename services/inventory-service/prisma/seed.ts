import { PrismaClient, ReservationStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// This seed script assumes products already exist in product-service
// In a real scenario, you'd sync product IDs or use a shared database

// Generate realistic inventory quantities based on product type
function generateInventoryQuantities() {
  const totalQuantity = faker.number.int({ min: 100, max: 10000 });
  const reservedQuantity = faker.number.int({ min: 0, max: Math.floor(totalQuantity * 0.2) });
  const availableQuantity = totalQuantity - reservedQuantity;

  return {
    totalQuantity,
    reservedQuantity,
    availableQuantity,
    reorderLevel: Math.floor(totalQuantity * 0.1),
    reorderQuantity: Math.floor(totalQuantity * 0.3),
  };
}

async function main() {
  console.log('🌱 Starting inventory seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.stockTransaction.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.inventory.deleteMany();

  // Create inventory records
  console.log('📊 Creating inventory records...');
  const inventories = [];

  for (let i = 0; i < 600; i++) {
    const quantities = generateInventoryQuantities();
    
    const inventory = await prisma.inventory.create({
      data: {
        productId: faker.string.uuid(),
        sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}-${String(i).padStart(5, '0')}`,
        ...quantities,
      },
    });

    inventories.push(inventory);

    // Create initial stock transaction
    await prisma.stockTransaction.create({
      data: {
        inventoryId: inventory.id,
        type: 'INITIAL_STOCK',
        quantity: inventory.totalQuantity,
        reference: 'SEED_INIT',
        notes: 'Initial inventory from seed',
      },
    });

    // Log progress every 100 records
    if ((i + 1) % 100 === 0) {
      console.log(`   Created ${i + 1} inventory records...`);
    }
  }

  console.log(`✅ Created ${inventories.length} inventory records`);

  // Create stock transactions (various types)
  console.log('📝 Creating stock transactions...');
  const transactionTypes = [
    'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE',
    'TRANSFER_IN', 'TRANSFER_OUT', 'RESTOCK', 'SHRINKAGE'
  ];

  for (let i = 0; i < 200; i++) {
    const inventory = faker.helpers.arrayElement(inventories);
    const type = faker.helpers.arrayElement(transactionTypes);
    const quantity = faker.number.int({ min: 1, max: 100 });

    await prisma.stockTransaction.create({
      data: {
        inventoryId: inventory.id,
        type,
        quantity: type.includes('OUT') || type === 'SALE' ? -quantity : quantity,
        reference: `REF-${faker.string.alphanumeric(10).toUpperCase()}`,
        notes: faker.lorem.sentence(),
      },
    });
  }

  console.log('✅ Created 200 stock transactions');

  // Create stock reservations
  console.log('🔒 Creating stock reservations...');
  const reservationStatuses: ReservationStatus[] = ['ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED'];

  for (let i = 0; i < 150; i++) {
    const inventory = faker.helpers.arrayElement(inventories);
    const status = faker.helpers.arrayElement(reservationStatuses);
    const quantity = faker.number.int({ min: 1, max: 50 });
    const createdAt = faker.date.past({ years: 0.5 });
    const expiresAt = faker.date.future({ years: 0.1, refDate: createdAt });

    await prisma.stockReservation.create({
      data: {
        inventoryId: inventory.id,
        orderId: faker.string.uuid(),
        userId: faker.string.uuid(),
        quantity,
        status,
        expiresAt,
        completedAt: status === 'COMPLETED' ? faker.date.between({ from: createdAt, to: expiresAt }) : null,
        createdAt,
      },
    });
  }

  console.log('✅ Created 150 stock reservations');

  // Display summary
  const totalInventories = await prisma.inventory.count();
  const totalTransactions = await prisma.stockTransaction.count();
  const totalReservations = await prisma.stockReservation.count();
  const totalAvailableStock = await prisma.inventory.aggregate({
    _sum: { availableQuantity: true },
  });
  const totalReservedStock = await prisma.inventory.aggregate({
    _sum: { reservedQuantity: true },
  });

  console.log('\n📊 Seed Summary:');
  console.log(`   Inventory Records: ${totalInventories}`);
  console.log(`   Stock Transactions: ${totalTransactions}`);
  console.log(`   Stock Reservations: ${totalReservations}`);
  console.log(`   Total Available Stock: ${totalAvailableStock._sum.availableQuantity?.toLocaleString()}`);
  console.log(`   Total Reserved Stock: ${totalReservedStock._sum.reservedQuantity?.toLocaleString()}`);
  console.log(`   Total Records: ${totalInventories + totalTransactions + totalReservations}`);

  console.log('\n✅ Inventory seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
