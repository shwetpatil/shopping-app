# Database Seeding Guide

This guide explains how to populate your databases with realistic test data.

## 📊 What Gets Seeded

### Total Records: **1,500+**

1. **Auth Service (~128 records)**
   - 3 test users with known credentials
   - 5 admin users
   - 20 vendor users
   - 100 customer users
   - 50 refresh tokens

2. **Product Service (~1,300+ records)**
   - 600 products across 10 categories
   - 50 subcategories
   - 40 brands
   - 1,800+ product images (2-5 per product)
   - 180+ product variants (30% of products)

3. **Inventory Service (~950 records)**
   - 600 inventory records (one per product)
   - 200 stock transactions
   - 150 stock reservations

4. **Order Service** (if implemented)
5. **Payment Service** (if implemented)
6. **Notification Service** (if implemented)

## 🚀 Quick Start

### Option 1: Seed All Services at Once (Recommended)

```bash
# From project root
npm run db:seed:all
```

This will seed all microservices in the correct order (handling dependencies).

### Option 2: Seed Individual Services

```bash
# Auth service
cd services/auth-service
npm run db:seed

# Product service
cd services/product-service
npm run db:seed

# Inventory service
cd services/inventory-service
npm run db:seed
```

## 📋 Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Databases**
   Ensure all database URLs are configured in `.env` files:
   ```bash
   # Each service needs its DATABASE_URL
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```

3. **Run Migrations**
   ```bash
   # For each service
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

## 🔐 Test User Credentials

After seeding, you can use these credentials to test your application:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | Admin123! |
| **Vendor** | vendor@example.com | Vendor123! |
| **Customer** | customer@example.com | Customer123! |

All other randomly generated users have the password: `Password123!`

## 📦 Generated Data Details

### Products
- **Categories**: Electronics, Office Supplies, Industrial Equipment, Medical Supplies, Food & Beverage, Hospitality, Construction, Automotive, Packaging, Janitorial
- **Price Range**: $50 - $5,000
- **Realistic SKUs**: Category-based format (e.g., `ELE-A8X3-00001`)
- **Images**: High-quality placeholder images from picsum.photos
- **Variants**: ~30% of products have 1-3 variants (size, type, etc.)
- **Activity**: 95% active, 15% featured

### Users
- **Emails**: Realistic company-based emails (e.g., john.doe@acmecorp.com)
- **Names**: Generated using Faker.js
- **Verification**: 85-90% verified
- **Activity**: 90-95% active

### Inventory
- **Stock Levels**: 100 - 10,000 units per product
- **Reserved Stock**: 0-20% of total
- **Reorder Points**: Automatically calculated (10% of total)
- **Transaction Types**: Purchase, Sale, Return, Adjustment, Damage, Transfer, Restock

## 🛠️ Customizing Seed Data

### Adjust Quantities

Edit the seed files to change how many records are created:

```typescript
// services/product-service/prisma/seed.ts
const productsPerSubcategory = 10; // Change this number

// services/auth-service/prisma/seed.ts
for (let i = 0; i < 100; i++) { // Change loop count
  // Create customer users
}
```

### Change Data Types

Modify the Faker.js generators:

```typescript
// Different price range
price: faker.number.float({ min: 10, max: 1000 })

// Different product names
name: faker.commerce.productName()

// Custom categories
const CATEGORIES = [
  // Add your own categories here
];
```

## 🔄 Re-seeding

To clear and re-seed databases:

```bash
# Clear and re-seed all
npm run db:reset:all

# Or per service
cd services/product-service
npx prisma migrate reset  # Clears DB and runs migrations + seeds
```

**Warning**: This will delete all existing data!

## 🐛 Troubleshooting

### "Module not found: @faker-js/faker"
```bash
npm install -D @faker-js/faker tsx
```

### "Connection refused" or Database Errors
1. Check that databases are running
2. Verify `.env` DATABASE_URL is correct
3. Ensure migrations are up to date: `npx prisma migrate deploy`

### "Unique constraint violation"
The database may already have data. Run `npx prisma migrate reset` to clear it.

### Seed Takes Too Long
Reduce the number of records in seed files or seed services one at a time.

## 📊 Verification

After seeding, verify data was created:

```bash
# Check record counts
cd services/product-service
npx prisma studio  # Opens GUI to browse data

# Or use SQL
psql -d product_db -c "SELECT COUNT(*) FROM products;"
```

## 🎯 Next Steps

After seeding:

1. **Start Services**: `npm run dev` from each service directory
2. **Test APIs**: Use Postman/Insomnia with test user credentials
3. **Browse Data**: Use Prisma Studio (`npx prisma studio`)
4. **Monitor**: Check logs for any seeding errors

## 📚 Additional Resources

- [Prisma Seeding Guide](https://www.prisma.io/docs/guides/database/seed-database)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Project Documentation](../docs/README.md)

## 💡 Tips

1. **Seed in Order**: Auth → Products → Inventory → Orders to handle dependencies
2. **Use Transactions**: Wrap large seeds in Prisma transactions for better performance
3. **Add Indexes**: Ensure your schema has proper indexes for better query performance
4. **Realistic Data**: Use Faker's locale-specific generators for more authentic data
5. **Test Data**: Keep test users separate from random users for consistent testing

---

**Need help?** Check the [Development Guide](../docs/guides/DEVELOPMENT.md) or open an issue.
