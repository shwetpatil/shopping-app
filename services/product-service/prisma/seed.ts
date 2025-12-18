import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Product categories with realistic B2B structure
const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', subcategories: ['Laptops', 'Desktops', 'Monitors', 'Accessories', 'Networking'] },
  { name: 'Office Supplies', slug: 'office-supplies', subcategories: ['Furniture', 'Stationery', 'Storage', 'Printing', 'Cleaning'] },
  { name: 'Industrial Equipment', slug: 'industrial-equipment', subcategories: ['Power Tools', 'Hand Tools', 'Safety Equipment', 'Machinery', 'Welding'] },
  { name: 'Medical Supplies', slug: 'medical-supplies', subcategories: ['Diagnostic', 'Protective', 'Surgical', 'Laboratory', 'Patient Care'] },
  { name: 'Food & Beverage', slug: 'food-beverage', subcategories: ['Bulk Foods', 'Beverages', 'Snacks', 'Ingredients', 'Catering'] },
  { name: 'Hospitality', slug: 'hospitality', subcategories: ['Kitchen Equipment', 'Tableware', 'Linens', 'Furniture', 'Decor'] },
  { name: 'Construction Materials', slug: 'construction-materials', subcategories: ['Lumber', 'Hardware', 'Electrical', 'Plumbing', 'Paint'] },
  { name: 'Automotive Parts', slug: 'automotive-parts', subcategories: ['Engine Parts', 'Body Parts', 'Tires', 'Accessories', 'Fluids'] },
  { name: 'Packaging Supplies', slug: 'packaging-supplies', subcategories: ['Boxes', 'Tape', 'Bubble Wrap', 'Labels', 'Stretch Film'] },
  { name: 'Janitorial', slug: 'janitorial', subcategories: ['Cleaning Chemicals', 'Equipment', 'Paper Products', 'Trash Bags', 'Mops'] },
];

const BRANDS = [
  'Dell', 'HP', 'Lenovo', 'Samsung', 'LG', 'Sony', 'Panasonic', 'Microsoft',
  'Cisco', 'Steelcase', '3M', 'Staples', 'Fellowes', 'Avery', 'Scotch',
  'DeWalt', 'Milwaukee', 'Makita', 'Bosch', 'Stanley', 'Black+Decker',
  'Honeywell', 'Kimberly-Clark', 'Georgia-Pacific', 'Rubbermaid',
  'Sysco', 'US Foods', 'Gordon Food Service', 'PepsiCo', 'Coca-Cola',
  'Caterpillar', 'John Deere', 'Case', 'Bobcat', 'Kubota',
  'Medline', 'Cardinal Health', '3M Healthcare', 'BD', 'McKesson',
];

// Generate realistic product names by category
function generateProductName(category: string, subcategory: string): string {
  const templates = {
    'Electronics': [
      `Professional ${subcategory} System`,
      `Enterprise ${subcategory} Solution`,
      `Commercial Grade ${subcategory}`,
      `Business ${subcategory} Pro`,
    ],
    'Office Supplies': [
      `Premium ${subcategory} Set`,
      `Executive ${subcategory} Collection`,
      `Professional ${subcategory}`,
      `Bulk ${subcategory} Pack`,
    ],
    'Industrial Equipment': [
      `Heavy Duty ${subcategory}`,
      `Professional ${subcategory} Kit`,
      `Industrial ${subcategory} System`,
      `Commercial ${subcategory}`,
    ],
    'Medical Supplies': [
      `Medical Grade ${subcategory}`,
      `Clinical ${subcategory} Kit`,
      `Healthcare ${subcategory} Set`,
      `Professional ${subcategory}`,
    ],
    'Food & Beverage': [
      `Wholesale ${subcategory}`,
      `Bulk ${subcategory} Case`,
      `Commercial ${subcategory} Pack`,
      `Restaurant Supply ${subcategory}`,
    ],
  };

  const defaultTemplate = [
    `${subcategory} - Professional Grade`,
    `Commercial ${subcategory}`,
    `Bulk ${subcategory}`,
    `Professional ${subcategory}`,
  ];

  const categoryTemplates = templates[category as keyof typeof templates] || defaultTemplate;
  return faker.helpers.arrayElement(categoryTemplates);
}

// Generate realistic B2B product descriptions
function generateDescription(productName: string, category: string): string {
  const features = [
    'High-quality construction for demanding environments',
    'Bulk pricing available for large orders',
    'Meets industry standards and certifications',
    'Perfect for commercial and industrial use',
    'Durable design built to last',
    'Easy installation and maintenance',
    'Compatible with standard equipment',
    'Energy efficient and cost-effective',
    'Backed by manufacturer warranty',
    'Ideal for wholesale distributors',
  ];

  const specs = faker.helpers.arrayElements(features, 3).join('. ');
  return `${productName} - ${specs}. Available in bulk quantities with volume discounts.`;
}

// Generate realistic SKU
function generateSKU(categorySlug: string, index: number): string {
  const prefix = categorySlug.substring(0, 3).toUpperCase();
  const randomPart = faker.string.alphanumeric(4).toUpperCase();
  const numPart = String(index).padStart(5, '0');
  return `${prefix}-${randomPart}-${numPart}`;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  // Create brands
  console.log('🏷️  Creating brands...');
  const brands = await Promise.all(
    BRANDS.map((brandName) =>
      prisma.brand.create({
        data: {
          name: brandName,
          slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          logoUrl: `https://logo.clearbit.com/${brandName.toLowerCase()}.com`,
          isActive: true,
        },
      })
    )
  );
  console.log(`✅ Created ${brands.length} brands`);

  // Create categories and subcategories
  console.log('📁 Creating categories...');
  const categoryMap = new Map<string, any>();

  for (const cat of CATEGORIES) {
    const parentCategory = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: `Professional ${cat.name} for B2B customers`,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, parentCategory);

    // Create subcategories
    for (const subcat of cat.subcategories) {
      const subcategory = await prisma.category.create({
        data: {
          name: subcat,
          slug: `${cat.slug}-${subcat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          description: `${subcat} in ${cat.name}`,
          parentId: parentCategory.id,
          isActive: true,
        },
      });
      categoryMap.set(`${cat.slug}-${subcat}`, subcategory);
    }
  }
  console.log(`✅ Created ${categoryMap.size} categories`);

  // Create products (500+)
  console.log('📦 Creating products...');
  const products = [];
  let productCounter = 0;

  for (const cat of CATEGORIES) {
    const parentCat = categoryMap.get(cat.slug);
    const productsPerSubcategory = Math.ceil(600 / (CATEGORIES.length * cat.subcategories.length));

    for (const subcat of cat.subcategories) {
      const subcatKey = `${cat.slug}-${subcat}`;
      const subcategory = categoryMap.get(subcatKey);

      for (let i = 0; i < productsPerSubcategory; i++) {
        productCounter++;
        const productName = generateProductName(cat.name, subcat);
        const brand = faker.helpers.arrayElement(brands);
        const basePrice = faker.number.float({ min: 50, max: 5000, precision: 0.01 });

        const product = await prisma.product.create({
          data: {
            name: `${productName} ${faker.number.int({ min: 1000, max: 9999 })}`,
            slug: `${subcategory.slug}-${faker.string.alphanumeric(8).toLowerCase()}-${productCounter}`,
            description: generateDescription(productName, cat.name),
            price: basePrice,
            sku: generateSKU(cat.slug, productCounter),
            categoryId: subcategory.id,
            brandId: brand.id,
            isActive: faker.datatype.boolean(0.95), // 95% active
            isFeatured: faker.datatype.boolean(0.15), // 15% featured
          },
        });

        products.push(product);

        // Create 2-5 images per product with category-specific images
        const numImages = faker.number.int({ min: 2, max: 5 });
        const imageKeywords = {
          'electronics': ['laptop', 'computer', 'monitor', 'technology', 'device'],
          'office-supplies': ['office', 'desk', 'stationery', 'workspace', 'supplies'],
          'industrial-equipment': ['tools', 'equipment', 'machinery', 'industrial', 'construction'],
          'medical-supplies': ['medical', 'healthcare', 'hospital', 'clinic', 'health'],
          'food-beverage': ['food', 'restaurant', 'kitchen', 'catering', 'beverage'],
          'hospitality': ['hotel', 'restaurant', 'hospitality', 'dining', 'table'],
          'construction-materials': ['construction', 'building', 'materials', 'hardware', 'lumber'],
          'automotive-parts': ['car', 'automotive', 'vehicle', 'auto', 'parts'],
          'packaging-supplies': ['packaging', 'boxes', 'shipping', 'warehouse', 'logistics'],
          'janitorial': ['cleaning', 'janitorial', 'maintenance', 'supplies', 'sanitation'],
        };
        
        await Promise.all(
          Array.from({ length: numImages }).map((_, idx) => {
            const keyword = imageKeywords[cat.slug as keyof typeof imageKeywords]?.[idx % 5] || 'product';
            return prisma.productImage.create({
              data: {
                productId: product.id,
                url: `https://images.unsplash.com/photo-${1500000000000 + product.id + idx}?w=800&h=600&fit=crop&q=80`,
                altText: `${product.name} - ${keyword} view ${idx + 1}`,
                position: idx,
              },
            });
          })
        );

        // Create 0-3 variants per product (30% of products have variants)
        if (faker.datatype.boolean(0.3)) {
          const numVariants = faker.number.int({ min: 1, max: 3 });
          const variantOptions = ['Small', 'Medium', 'Large', 'XL', 'Standard', 'Premium', 'Deluxe'];

          await Promise.all(
            Array.from({ length: numVariants }).map((_, idx) =>
              prisma.productVariant.create({
                data: {
                  productId: product.id,
                  name: faker.helpers.arrayElement(variantOptions),
                  sku: `${product.sku}-V${idx + 1}`,
                  price: basePrice * faker.number.float({ min: 0.9, max: 1.3, precision: 0.01 }),
                  stock: faker.number.int({ min: 0, max: 1000 }),
                  isActive: true,
                },
              })
            )
          );
        }

        // Log progress every 50 products
        if (productCounter % 50 === 0) {
          console.log(`   Created ${productCounter} products...`);
        }
      }
    }
  }

  console.log(`✅ Created ${products.length} products with images and variants`);

  // Display summary
  console.log('\n📊 Seed Summary:');
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Categories: ${categoryMap.size}`);
  console.log(`   Products: ${products.length}`);
  const totalImages = await prisma.productImage.count();
  const totalVariants = await prisma.productVariant.count();
  console.log(`   Product Images: ${totalImages}`);
  console.log(`   Product Variants: ${totalVariants}`);
  console.log(`   Total Records: ${brands.length + categoryMap.size + products.length + totalImages + totalVariants}`);

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
