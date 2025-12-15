import { PrismaClient, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Pre-defined test users for easy login
const TEST_USERS = [
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as Role,
  },
  {
    email: 'vendor@example.com',
    password: 'Vendor123!',
    firstName: 'Vendor',
    lastName: 'Manager',
    role: 'VENDOR' as Role,
  },
  {
    email: 'customer@example.com',
    password: 'Customer123!',
    firstName: 'Customer',
    lastName: 'User',
    role: 'CUSTOMER' as Role,
  },
];

// Common company names for B2B customers
const COMPANY_NAMES = [
  'Acme Corp', 'TechStart Industries', 'Global Solutions Inc', 'Prime Wholesale',
  'Enterprise Supplies Co', 'Metro Business Group', 'Summit Trading LLC',
  'Valley Distributors', 'Coastal Enterprises', 'Midwest Supply Chain',
  'Pacific Trading Co', 'Atlantic Business Solutions', 'Northern Industries',
  'Southern Wholesale', 'Central Distribution', 'Eastern Supply Co',
];

async function main() {
  console.log('🌱 Starting auth seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create test users with known credentials
  console.log('👥 Creating test users...');
  for (const testUser of TEST_USERS) {
    const password = await bcrypt.hash(testUser.password, 10);
    await prisma.user.create({
      data: {
        email: testUser.email,
        password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
        isVerified: true,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${TEST_USERS.length} test users`);

  // Create random users (100 customers, 20 vendors, 5 admins)
  console.log('👥 Creating random users...');

  // Create admins
  const adminUsers = [];
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'ADMIN',
        isVerified: true,
        isActive: faker.datatype.boolean(0.95),
      },
    });
    adminUsers.push(user);
  }
  console.log(`✅ Created ${adminUsers.length} admin users`);

  // Create vendors
  const vendorUsers = [];
  for (let i = 0; i < 20; i++) {
    const company = faker.helpers.arrayElement(COMPANY_NAMES);
    const user = await prisma.user.create({
      data: {
        email: `vendor.${faker.string.alphanumeric(6)}@${company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
        password: hashedPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'VENDOR',
        isVerified: faker.datatype.boolean(0.9),
        isActive: faker.datatype.boolean(0.95),
      },
    });
    vendorUsers.push(user);
  }
  console.log(`✅ Created ${vendorUsers.length} vendor users`);

  // Create customers
  const customerUsers = [];
  for (let i = 0; i < 100; i++) {
    const company = faker.helpers.arrayElement(COMPANY_NAMES);
    const user = await prisma.user.create({
      data: {
        email: `${faker.person.firstName().toLowerCase()}.${faker.person.lastName().toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
        password: hashedPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'CUSTOMER',
        isVerified: faker.datatype.boolean(0.85),
        isActive: faker.datatype.boolean(0.9),
      },
    });
    customerUsers.push(user);

    // Log progress every 25 users
    if ((i + 1) % 25 === 0) {
      console.log(`   Created ${i + 1} customer users...`);
    }
  }
  console.log(`✅ Created ${customerUsers.length} customer users`);

  // Create some refresh tokens for active users
  console.log('🔑 Creating refresh tokens...');
  const activeUsers = [...adminUsers, ...vendorUsers, ...customerUsers].filter(u => u.isActive);
  const usersWithTokens = faker.helpers.arrayElements(activeUsers, Math.min(50, activeUsers.length));

  for (const user of usersWithTokens) {
    await prisma.refreshToken.create({
      data: {
        token: faker.string.alphanumeric(64),
        userId: user.id,
        expiresAt: faker.date.future({ years: 0.1 }), // Expires in ~1 month
      },
    });
  }
  console.log(`✅ Created ${usersWithTokens.length} refresh tokens`);

  // Display summary
  const totalUsers = await prisma.user.count();
  const totalTokens = await prisma.refreshToken.count();

  console.log('\n📊 Seed Summary:');
  console.log(`   Test Users: ${TEST_USERS.length} (check credentials above)`);
  console.log(`   Admin Users: ${adminUsers.length + 1}`); // +1 for test admin
  console.log(`   Vendor Users: ${vendorUsers.length + 1}`); // +1 for test vendor
  console.log(`   Customer Users: ${customerUsers.length + 1}`); // +1 for test customer
  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   Refresh Tokens: ${totalTokens}`);

  console.log('\n🔐 Test User Credentials:');
  TEST_USERS.forEach(u => {
    console.log(`   ${u.role}: ${u.email} / ${u.password}`);
  });

  console.log('\n✅ Auth seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
