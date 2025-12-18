import axios from 'axios';
import { SERVICE_URLS } from '@shopping-app/config';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT;
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4003';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:4004';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4005';

export const resolvers = {
  Query: {
    // Product queries
    product: async (_: any, { id }: { id: string }) => {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`);
      return response.data.data;
    },

    products: async (_: any, { filters }: { filters?: any }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page);
      if (filters?.limit) params.append('limit', filters.limit);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);
      if (filters?.brandId) params.append('brandId', filters.brandId);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice);
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive);
      if (filters?.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured);

      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products?${params}`);
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    },

    // Category queries
    categories: async () => {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/categories`);
      return response.data.data;
    },

    category: async (_: any, { id }: { id: string }) => {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/categories/${id}`);
      return response.data.data;
    },

    // Brand queries
    brands: async () => {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/brands`);
      return response.data.data;
    },

    brand: async (_: any, { id }: { id: string }) => {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/brands/${id}`);
      return response.data.data;
    },

    // Cart queries (requires auth)
    myCart: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.get(`${CART_SERVICE_URL}/api/cart`, {
        headers: { 'x-user-id': context.user.id },
      });
      return response.data.data;
    },

    // Order queries (requires auth)
    myOrders: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders`, {
        headers: { 'x-user-id': context.user.id },
      });
      return response.data.data;
    },

    order: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/${id}`, {
        headers: { 'x-user-id': context.user.id },
      });
      return response.data.data;
    },

    // Aggregated query - fetches data from multiple services
    productDetail: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Fetch product
        const productRes = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`);
        const product = productRes.data.data;

        // Fetch inventory
        let inventory = null;
        try {
          const inventoryRes = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory/${id}`);
          inventory = inventoryRes.data.data;
        } catch (error) {
          console.log('Inventory not found for product:', id);
        }

        // Check if in cart (if user is authenticated)
        let inCart = false;
        let cartQuantity = 0;
        if (context.user) {
          try {
            const cartRes = await axios.get(`${CART_SERVICE_URL}/api/cart`, {
              headers: { 'x-user-id': context.user.id },
            });
            const cartItem = cartRes.data.data.items.find(
              (item: any) => item.productId === parseInt(id)
            );
            if (cartItem) {
              inCart = true;
              cartQuantity = cartItem.quantity;
            }
          } catch (error) {
            console.log('Error fetching cart:', error);
          }
        }

        // Fetch related products (same category)
        let relatedProducts = [];
        if (product.categoryId) {
          try {
            const relatedRes = await axios.get(
              `${PRODUCT_SERVICE_URL}/api/products?categoryId=${product.categoryId}&limit=4`
            );
            relatedProducts = relatedRes.data.data.filter((p: any) => p.id !== parseInt(id));
          } catch (error) {
            console.log('Error fetching related products:', error);
          }
        }

        return {
          product,
          inventory,
          inCart,
          cartQuantity,
          relatedProducts,
        };
      } catch (error) {
        console.error('Error in productDetail resolver:', error);
        throw error;
      }
    },
  },

  Mutation: {
    // Cart mutations
    addToCart: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.post(
        `${CART_SERVICE_URL}/api/cart/items`,
        input,
        { headers: { 'x-user-id': context.user.id } }
      );
      return response.data.data;
    },

    removeFromCart: async (_: any, { itemId }: { itemId: string }, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.delete(
        `${CART_SERVICE_URL}/api/cart/items/${itemId}`,
        { headers: { 'x-user-id': context.user.id } }
      );
      return response.data.data;
    },

    updateCartItem: async (_: any, { itemId, quantity }: any, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.patch(
        `${CART_SERVICE_URL}/api/cart/items/${itemId}`,
        { quantity },
        { headers: { 'x-user-id': context.user.id } }
      );
      return response.data.data;
    },

    clearCart: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Authentication required');
      
      const response = await axios.delete(
        `${CART_SERVICE_URL}/api/cart`,
        { headers: { 'x-user-id': context.user.id } }
      );
      return response.data.data;
    },
  },

  // Field resolvers for nested data
  Product: {
    category: async (parent: any) => {
      if (!parent.categoryId) return null;
      try {
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/api/categories/${parent.categoryId}`
        );
        return response.data.data;
      } catch (error) {
        return null;
      }
    },

    brand: async (parent: any) => {
      if (!parent.brandId) return null;
      try {
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/api/brands/${parent.brandId}`
        );
        return response.data.data;
      } catch (error) {
        return null;
      }
    },

    inventory: async (parent: any) => {
      try {
        const response = await axios.get(
          `${INVENTORY_SERVICE_URL}/api/inventory/${parent.id}`
        );
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
  },

  CartItem: {
    product: async (parent: any) => {
      try {
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/api/products/${parent.productId}`
        );
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
  },

  OrderItem: {
    product: async (parent: any) => {
      try {
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/api/products/${parent.productId}`
        );
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
  },
};
