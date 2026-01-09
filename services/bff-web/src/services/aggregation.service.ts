/**
 * BFF-Web - Aggregation Service
 * Orchestrates calls to multiple microservices
 * No shared types - communicates via HTTP APIs
 */
import { logger } from '@oms/toolkit';

export class AggregationService {
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
   * Get complete order details with user, products, and payment info
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      logger.info({ orderId }, 'Fetching aggregated order details');

      // Fetch order
      const orderRes = await fetch(`${this.ordersServiceUrl}/api/v1/orders/${orderId}`);
      if (!orderRes.ok) {
        throw new Error(`Failed to fetch order: ${orderRes.statusText}`);
      }
      const order = await orderRes.json();

      // Fetch user info (in parallel with other requests)
      const [userRes, paymentsRes] = await Promise.all([
        fetch(`${this.usersServiceUrl}/api/v1/users/${order.userId}`),
        fetch(`${this.paymentsServiceUrl}/api/v1/payments/order/${orderId}`),
      ]);

      const user = userRes.ok ? await userRes.json() : null;
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];

      // Fetch product details for each order item
      const productPromises = (order.items || []).map(async (item: any) => {
        try {
          const res = await fetch(`${this.productsServiceUrl}/api/v1/products/${item.productId}`);
          if (res.ok) {
            return await res.json();
          }
          return null;
        } catch (error) {
          logger.warn({ productId: item.productId }, 'Failed to fetch product details');
          return null;
        }
      });

      const products = await Promise.all(productPromises);

      // Merge product details with order items
      const enrichedItems = (order.items || []).map((item: any, index: number) => ({
        ...item,
        product: products[index],
      }));

      return {
        order: {
          ...order,
          items: enrichedItems,
        },
        user,
        payments,
      };
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to aggregate order details');
      throw error;
    }
  }

  /**
   * Get user dashboard with recent orders and profile
   */
  async getUserDashboard(userId: string, options: { includeOrders?: boolean } = {}): Promise<any> {
    try {
      logger.info({ userId }, 'Fetching user dashboard');

      // Fetch user profile
      const userRes = await fetch(`${this.usersServiceUrl}/api/v1/users/${userId}`);
      if (!userRes.ok) {
        throw new Error(`Failed to fetch user: ${userRes.statusText}`);
      }
      const user = await userRes.json();

      let recentOrders = [];
      if (options.includeOrders) {
        // Fetch recent orders
        const ordersRes = await fetch(
          `${this.ordersServiceUrl}/api/v1/orders?userId=${userId}&limit=5`
        );
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          recentOrders = ordersData.orders || [];
        }
      }

      return {
        user,
        recentOrders,
        stats: {
          totalOrders: recentOrders.length,
        },
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to aggregate user dashboard');
      throw error;
    }
  }

  /**
   * Orchestrate checkout process
   */
  async checkout(checkoutData: any): Promise<any> {
    try {
      logger.info({ userId: checkoutData.userId }, 'Processing checkout');

      // 1. Fetch product prices (to calculate total)
      const productPromises = checkoutData.items.map(async (item: any) => {
        const res = await fetch(`${this.productsServiceUrl}/api/v1/products/${item.productId}`);
        if (!res.ok) {
          throw new Error(`Product ${item.productId} not found`);
        }
        return await res.json();
      });

      const products = await Promise.all(productPromises);

      // 2. Calculate total amount
      const items = checkoutData.items.map((item: any, index: number) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: products[index].price,
        productSnapshot: {
          name: products[index].name,
          sku: products[index].sku,
        },
      }));

      const totalAmount = items.reduce((sum: number, item: any) =>
        sum + (item.unitPrice * item.quantity), 0
      );

      // 3. Create order
      const orderRes = await fetch(`${this.ordersServiceUrl}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: checkoutData.userId,
          items,
          shippingAddress: checkoutData.shippingAddress,
          billingAddress: checkoutData.billingAddress || checkoutData.shippingAddress,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderRes.json();

      // 4. Initiate payment
      const paymentRes = await fetch(`${this.paymentsServiceUrl}/api/v1/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: totalAmount,
          currency: 'USD',
          paymentMethod: checkoutData.paymentMethod,
          paymentDetails: checkoutData.paymentDetails,
          billingAddress: checkoutData.billingAddress || checkoutData.shippingAddress,
        }),
      });

      const payment = paymentRes.ok ? await paymentRes.json() : null;

      logger.info({ orderId: order.id }, 'Checkout completed successfully');

      return {
        order,
        payment,
        totalAmount,
      };
    } catch (error) {
      logger.error({ error }, 'Checkout failed');
      throw error;
    }
  }
}
