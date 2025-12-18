import gql from 'graphql-tag';

export const typeDefs = gql`
  # Product Types
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    price: Float!
    compareAtPrice: Float
    sku: String!
    categoryId: Int!
    brandId: Int
    isActive: Boolean!
    isFeatured: Boolean!
    createdAt: String!
    updatedAt: String!
    category: Category
    brand: Brand
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    inventory: Inventory
  }

  type ProductImage {
    id: ID!
    url: String!
    altText: String
    position: Int!
  }

  type ProductVariant {
    id: ID!
    name: String!
    sku: String!
    price: Float!
    stockQuantity: Int!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    parentId: Int
    isActive: Boolean!
  }

  type Brand {
    id: ID!
    name: String!
    slug: String!
    description: String
    logoUrl: String
    websiteUrl: String
    isActive: Boolean!
  }

  # Inventory Types
  type Inventory {
    id: ID!
    productId: Int!
    stockLevel: Int!
    reservedStock: Int!
    availableStock: Int!
    reorderPoint: Int!
    reorderQuantity: Int!
    status: String!
  }

  # Cart Types
  type Cart {
    id: ID!
    userId: Int!
    items: [CartItem!]!
    subtotal: Float!
    total: Float!
  }

  type CartItem {
    id: ID!
    productId: Int!
    quantity: Int!
    price: Float!
    product: Product
  }

  # Order Types
  type Order {
    id: ID!
    userId: Int!
    status: String!
    subtotal: Float!
    tax: Float!
    shippingCost: Float!
    total: Float!
    items: [OrderItem!]!
    shippingAddress: Address
    createdAt: String!
  }

  type OrderItem {
    id: ID!
    productId: Int!
    quantity: Int!
    price: Float!
    product: Product
  }

  type Address {
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String!
  }

  # Pagination
  type ProductList {
    data: [Product!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  # Input Types
  input ProductFilters {
    categoryId: Int
    brandId: Int
    minPrice: Float
    maxPrice: Float
    search: String
    isActive: Boolean
    isFeatured: Boolean
    page: Int
    limit: Int
  }

  input AddToCartInput {
    productId: Int!
    quantity: Int!
  }

  # Queries
  type Query {
    # Products
    product(id: ID!): Product
    products(filters: ProductFilters): ProductList!
    
    # Categories
    categories: [Category!]!
    category(id: ID!): Category
    
    # Brands
    brands: [Brand!]!
    brand(id: ID!): Brand
    
    # Cart (requires auth)
    myCart: Cart
    
    # Orders (requires auth)
    myOrders: [Order!]!
    order(id: ID!): Order
    
    # Aggregated queries
    productDetail(id: ID!): ProductDetail!
  }

  # Special aggregated type
  type ProductDetail {
    product: Product!
    inventory: Inventory
    inCart: Boolean!
    cartQuantity: Int!
    relatedProducts: [Product!]!
  }

  # Mutations
  type Mutation {
    # Cart
    addToCart(input: AddToCartInput!): Cart!
    removeFromCart(itemId: ID!): Cart!
    updateCartItem(itemId: ID!, quantity: Int!): Cart!
    clearCart: Cart!
  }
`;
