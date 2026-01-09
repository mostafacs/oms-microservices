import { RabbitMQClient, BaseEvent, logger } from '@oms/toolkit';

export class ProductEventPublisher {
  private client: RabbitMQClient;
  private readonly EXCHANGE = 'products';

  constructor(rabbitMQUrl: string) {
    this.client = RabbitMQClient.getInstance(rabbitMQUrl);
  }

  async init(): Promise<void> {
    await this.client.connect();
  }

  async publishEvent(event: BaseEvent, routingKey: string): Promise<void> {
    try {
      const channel = this.client.getChannel();
      await channel.assertExchange(this.EXCHANGE, 'topic', { durable: true });

      channel.publish(
        this.EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        }
      );

      logger.info({ eventType: event.eventType, eventId: event.eventId }, 'Event published');
    } catch (error) {
      logger.error({ error, eventType: event.eventType }, 'Failed to publish event');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
