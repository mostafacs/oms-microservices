/**
 * BFF-Mobile - Aggregation Service
 * Optimized for mobile clients with smaller payloads
 * No shared types - communicates via HTTP APIs
 */
import { logger } from '@oms/toolkit';

export class MobileAggregationService {
  private ordersServiceUrl: string;
  private productsServiceUrl: string;
  private usersServiceUrl: string;
  private paymentsServiceUrl: string;

  constructor(config: {
    ordersServiceUrl: string;
    productsServiceUrl: string;
    usersServiceUrl: string;
    paymentsServiceUrl: string;
  }) {
    this.ordersServiceUrl = config.ordersServiceUrl;
    this.productsServiceUrl = config.productsServiceUrl;
    this.usersServiceUrl = config.usersServiceUrl;
    this.paymentsServiceUrl = config.paymentsServiceUrl;
  }

  /**
   * Get lightweight order summary for mobile
   * Returns only essential fields to minimize bandwidth
   */
  async getOrderSummary(orderId: string): Promise<any> {
    try {
      logger.info({ orderId }, 'Fetching mobile order summary');

      const orderRes = await fetch(`${this.ordersServiceUrl}/api/v1/orders/${orderId}`);
      if (!orderRes.ok) {
        throw new Error(`Failed to fetch order: ${orderRes.statusText}`);
      }
      const order = await orderRes.json();

      // Return lightweight version - only essential fields
      return {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items?.length || 0,
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        // Don't include full user or product details to save bandwidth
      };
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to get order summary');
      throw error;
    }
  }

  /**
   * Get user profile (minimal data for mobile)
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      logger.info({ userId }, 'Fetching mobile user profile');

      const userRes = await fetch(`${this.usersServiceUrl}/api/v1/users/${userId}`);
      if (!userRes.ok) {
        throw new Error(`Failed to fetch user: ${userRes.statusText}`);
      }
      const user = await userRes.json();

      // Return only necessary fields for mobile
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        // Exclude sensitive data
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user profile');
      throw error;
    }
  }

  /**
   * List user orders (paginated, lightweight)
   */
  async listUserOrders(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<any> {
    try {
      logger.info({ userId, page, limit }, 'Fetching user orders for mobile');

      let url = `${this.ordersServiceUrl}/api/v1/orders?userId=${userId}&page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const ordersRes = await fetch(url);
      if (!ordersRes.ok) {
        throw new Error('Failed to fetch orders');
      }

      const ordersData = await ordersRes.json();

      // Return lightweight order list
      return {
        orders: (ordersData.orders || []).map((order: any) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items?.length || 0,
          createdAt: order.createdAt,
        })),
        pagination: ordersData.pagination,
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to list user orders');
      throw error;
    }
  }

  /**
   * Search products (lightweight results for mobile)
   */
  async searchProducts(query: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      logger.info({ query, page, limit }, 'Searching products for mobile');

      const productsRes = await fetch(
        `${this.productsServiceUrl}/api/v1/products?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );

      if (!productsRes.ok) {
        throw new Error('Failed to search products');
      }

      const productsData = await productsRes.json();

      // Return minimal product data for list view
      return {
        products: (productsData.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          // Exclude description and other heavy fields
        })),
        pagination: productsData.pagination,
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to search products');
      throw error;
    }
  }

  /**
   * Get product details with availability
   */
  async getProductDetails(productId: string, warehouseId?: string): Promise<any> {
    try {
      logger.info({ productId, warehouseId }, 'Fetching product details for mobile');

      const [productRes, inventoryRes] = await Promise.all([
        fetch(`${this.productsServiceUrl}/api/v1/products/${productId}`),
        warehouseId
          ? fetch(`${this.productsServiceUrl}/api/v1/inventory/${productId}?warehouseId=${warehouseId}`)
          : Promise.resolve(null),
      ]);

      if (!productRes.ok) {
        throw new Error('Product not found');
      }

      const product = await productRes.json();
      const inventory = inventoryRes && inventoryRes.ok ? await inventoryRes.json() : null;

      return {
        ...product,
        availability: inventory
          ? {
              inStock: inventory.quantity > 0,
              quantity: inventory.quantity,
            }
          : null,
      };
    } catch (error) {
      logger.error({ error, productId }, 'Failed to get product details');
      throw error;
    }
  }

  /**
   * Mobile checkout with saved address and payment method
   */
  async checkout(checkoutData: {
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    addressId: string;
    paymentMethodId: string;
  }): Promise<any> {
    try {
      logger.info({ userId: checkoutData.userId }, 'Processing mobile checkout');

      // 1. Fetch saved address
      const addressRes = await fetch(
        `${this.usersServiceUrl}/api/v1/users/${checkoutData.userId}/addresses/${checkoutData.addressId}`
      );
      if (!addressRes.ok) {
        throw new Error('Address not found');
      }
      const address = await addressRes.json();

      // 2. Fetch saved payment method
      const paymentMethodRes = await fetch(
        `${this.paymentsServiceUrl}/api/v1/payment-methods/${checkoutData.paymentMethodId}`
      );
      if (!paymentMethodRes.ok) {
        throw new Error('Payment method not found');
      }
      const paymentMethod = await paymentMethodRes.json();

      // 3. Get product prices
      const productPromises = checkoutData.items.map(async (item) => {
        const res = await fetch(`${this.productsServiceUrl}/api/v1/products/${item.productId}`);
        if (!res.ok) throw new Error(`Product ${item.productId} not found`);
        return await res.json();
      });

      const products = await Promise.all(productPromises);

      // 4. Calculate total
      const items = checkoutData.items.map((item, index) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: products[index].price,
        productSnapshot: {
          name: products[index].name,
          sku: products[index].sku,
        },
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      // 5. Create order
      const orderRes = await fetch(`${this.ordersServiceUrl}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: checkoutData.userId,
          items,
          shippingAddress: address,
          billingAddress: address,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderRes.json();

      // 6. Process payment
      const paymentRes = await fetch(`${this.paymentsServiceUrl}/api/v1/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: totalAmount,
          currency: 'USD',
          paymentMethod: paymentMethod.type,
          paymentMethodId: checkoutData.paymentMethodId,
        }),
      });

      const payment = paymentRes.ok ? await paymentRes.json() : null;

      logger.info({ orderId: order.id }, 'Mobile checkout completed');

      // Return lightweight response
      return {
        orderId: order.id,
        status: order.status,
        totalAmount,
        paymentStatus: payment?.status,
      };
    } catch (error) {
      logger.error({ error }, 'Mobile checkout failed');
      throw error;
    }
  }
}
