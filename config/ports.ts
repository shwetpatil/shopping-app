/**
 * Application Ports Configuration
 * Centralized port management for all services and applications
 */

// Frontend Microfrontends
export const MFE_PORTS = {
  SHELL: 3000,
  SEARCH: 3001,
  WISHLIST: 3002,
  REVIEWS: 3003,
  PRODUCTS: 3004,
  CART: 3005,
} as const;

// Backend Microservices
export const SERVICE_PORTS = {
  API_GATEWAY: 4000,
  AUTH: 4001,
  PRODUCT: 4002,
  ORDER: 4003,
  PAYMENT: 4005,
  CART: 4006,
  INVENTORY: 4007,
  NOTIFICATION: 4008,
} as const;

// Infrastructure Services
export const INFRA_PORTS = {
  // PostgreSQL Databases
  AUTH_DB: 5435,
  PRODUCT_DB: 5433,
  ORDER_DB: 5434,
  PAYMENT_DB: 5436,
  INVENTORY_DB: 5437,
  NOTIFICATION_DB: 5438,
  
  // Redis
  REDIS: 6379,
  
  // Kafka
  KAFKA_INTERNAL: 9092,
  KAFKA_EXTERNAL: 9093,
  ZOOKEEPER: 2181,
  KAFKA_UI: 8080,
} as const;

// Environment-based URLs
export const getServiceUrl = (port: number, host: string = 'localhost'): string => {
  return `http://${host}:${port}`;
};

export const MFE_URLS = {
  SHELL: getServiceUrl(MFE_PORTS.SHELL),
  SEARCH: getServiceUrl(MFE_PORTS.SEARCH),
  WISHLIST: getServiceUrl(MFE_PORTS.WISHLIST),
  REVIEWS: getServiceUrl(MFE_PORTS.REVIEWS),
  PRODUCTS: getServiceUrl(MFE_PORTS.PRODUCTS),
  CART: getServiceUrl(MFE_PORTS.CART),
} as const;

export const SERVICE_URLS = {
  API_GATEWAY: getServiceUrl(SERVICE_PORTS.API_GATEWAY),
  AUTH: getServiceUrl(SERVICE_PORTS.AUTH),
  PRODUCT: getServiceUrl(SERVICE_PORTS.PRODUCT),
  ORDER: getServiceUrl(SERVICE_PORTS.ORDER),
  PAYMENT: getServiceUrl(SERVICE_PORTS.PAYMENT),
  CART: getServiceUrl(SERVICE_PORTS.CART),
  INVENTORY: getServiceUrl(SERVICE_PORTS.INVENTORY),
  NOTIFICATION: getServiceUrl(SERVICE_PORTS.NOTIFICATION),
  KAFKA_UI: getServiceUrl(INFRA_PORTS.KAFKA_UI),
} as const;

// Database connection strings
export const getDatabaseUrl = (
  port: number,
  database: string,
  user: string = 'postgres',
  password: string = 'postgres',
  host: string = 'localhost'
): string => {
  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
};

export const DATABASE_URLS = {
  AUTH: getDatabaseUrl(INFRA_PORTS.AUTH_DB, 'auth_db'),
  PRODUCT: getDatabaseUrl(INFRA_PORTS.PRODUCT_DB, 'product_db'),
  ORDER: getDatabaseUrl(INFRA_PORTS.ORDER_DB, 'order_db'),
  PAYMENT: getDatabaseUrl(INFRA_PORTS.PAYMENT_DB, 'payment_db'),
  INVENTORY: getDatabaseUrl(INFRA_PORTS.INVENTORY_DB, 'inventory_db'),
  NOTIFICATION: getDatabaseUrl(INFRA_PORTS.NOTIFICATION_DB, 'notification_db'),
} as const;

// Export all ports in one place for easy reference
export const ALL_PORTS = {
  ...MFE_PORTS,
  ...SERVICE_PORTS,
  ...INFRA_PORTS,
} as const;

// Type helpers
export type MFEPort = typeof MFE_PORTS[keyof typeof MFE_PORTS];
export type ServicePort = typeof SERVICE_PORTS[keyof typeof SERVICE_PORTS];
export type InfraPort = typeof INFRA_PORTS[keyof typeof INFRA_PORTS];
