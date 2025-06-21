import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CoinService } from '../coin/coin.service';
import { NotificationService } from '../notification/notification.service';
import { ActivityService } from '../activity/activity.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { IUser } from 'src/core/types/iuser.type';
import { EntityType, ActionType } from '@prisma/client';
import { NotificationType, NotificationPriority, NotificationChannel } from '../notification/dto/notification.create.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly coinService: CoinService,
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  /**
   * Create a payment intent for purchasing a pack
   */
  async createPaymentIntent(user: IUser, createPaymentIntentDto: CreatePaymentIntentDto) {
    try {
      const { packId } = createPaymentIntentDto;

      // Get pack details
      const pack = await this.prismaService.pack.findUnique({
        where: { id: packId },
      });

      if (!pack) {
        throw new NotFoundException('Pack not found');
      }

      if (pack.isFree) {
        throw new BadRequestException('Cannot create payment for free pack');
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: pack.price, // Amount in cents
        currency: 'usd',
        metadata: {
          userId: user.id,
          packId: pack.id,
          packName: pack.name,
          coinsCount: pack.coinsCount.toString(),
        },
        description: `Purchase of ${pack.name} pack for ${pack.coinsCount} coins`,
      });

      // Log activity
      await this.activityService.logActivity({
        entityType: EntityType.USER,
        actionType: ActionType.CREATE,
        entityId: user.id,
        description: {
          uz: `"${pack.name}" paketini sotib olish uchun to'lov yaratildi`,
          ru: `Создан платеж для покупки пакета "${pack.name}"`,
          en: `Created payment for purchasing "${pack.name}" pack`,
        },
        actorId: user.id,
        metadata: {
          packId: pack.id,
          packName: pack.name,
          amount: pack.price,
          currency: 'usd',
          paymentIntentId: paymentIntent.id,
        },
      });

      this.logger.log(`Created payment intent ${paymentIntent.id} for user ${user.id} and pack ${packId}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        pack: {
          id: pack.id,
          name: pack.name,
          coinsCount: pack.coinsCount,
          price: pack.price,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Confirm payment and add coins to user account
   */
  async confirmPayment(user: IUser, confirmPaymentDto: ConfirmPaymentDto) {
    try {
      const { paymentIntentId } = confirmPaymentDto;

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        throw new NotFoundException('Payment intent not found');
      }

      // Verify payment belongs to user
      if (paymentIntent.metadata.userId !== user.id) {
        throw new BadRequestException('Payment intent does not belong to user');
      }

      // Check if payment is successful
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(`Payment not successful. Status: ${paymentIntent.status}`);
      }

      // Check if payment was already processed
      const existingTransaction = await this.prismaService.paymentTransaction.findFirst({
        where: {
          paymentIntentId: paymentIntentId,
          status: 'COMPLETED',
        },
      });

      if (existingTransaction) {
        throw new BadRequestException('Payment already processed');
      }

      // Get pack details
      const packId = paymentIntent.metadata.packId;
      const pack = await this.prismaService.pack.findUnique({
        where: { id: packId },
      });

      if (!pack) {
        throw new NotFoundException('Pack not found');
      }

      // Start transaction
      const result = await this.prismaService.$transaction(async (prisma) => {
        // Create payment transaction record
        const transaction = await prisma.paymentTransaction.create({
          data: {
            userId: user.id,
            packId: pack.id,
            paymentIntentId: paymentIntentId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'COMPLETED',
            stripePaymentIntentId: paymentIntentId,
          },
        });

        // Add coins to user account
        const currentCoins = await this.coinService.getUserCoins(user.id);
        const newCoins = currentCoins.coins + pack.coinsCount;
        await this.coinService.updateUserCoins(user.id, newCoins);

        return { transaction, newCoins };
      });

      // Send notification
      await this.notificationService.createNotification({
        title: `"${pack.name}" paketi muvaffaqiyatli sotib olindi!`,
        message: `Hisobingizga ${pack.coinsCount} ta tanga qo'shildi`,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.HIGH,
        channel: NotificationChannel.WEB,
        userId: user.id,
        data: {
          type: 'pack_purchase',
          packId: pack.id,
          packName: pack.name,
          coinsAdded: pack.coinsCount,
          totalCoins: result.newCoins,
        },
      }, 'user');

      // Log activity
      await this.activityService.logActivity({
        entityType: EntityType.USER,
        actionType: ActionType.UPDATE,
        entityId: user.id,
        description: {
          uz: `"${pack.name}" paketi sotib olindi, ${pack.coinsCount} ta tanga qo'shildi`,
          ru: `Куплен пакет "${pack.name}", добавлено ${pack.coinsCount} монет`,
          en: `Purchased "${pack.name}" pack, added ${pack.coinsCount} coins`,
        },
        actorId: user.id,
        metadata: {
          packId: pack.id,
          packName: pack.name,
          coinsAdded: pack.coinsCount,
          totalCoins: result.newCoins,
          paymentIntentId: paymentIntentId,
          transactionId: result.transaction.id,
        },
      });

      this.logger.log(`Payment confirmed for user ${user.id}, pack ${pack.id}, added ${pack.coinsCount} coins`);

      return {
        success: true,
        message: 'Payment confirmed successfully',
        pack: {
          id: pack.id,
          name: pack.name,
          coinsCount: pack.coinsCount,
        },
        coinsAdded: pack.coinsCount,
        totalCoins: result.newCoins,
        transactionId: result.transaction.id,
      };
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: Buffer) {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      this.logger.log(`Received webhook event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const userId = paymentIntent.metadata.userId;
      const packId = paymentIntent.metadata.packId;

      if (!userId || !packId) {
        this.logger.error('Missing metadata in payment intent');
        return;
      }

      // Check if already processed
      const existingTransaction = await this.prismaService.paymentTransaction.findFirst({
        where: {
          paymentIntentId: paymentIntent.id,
          status: 'COMPLETED',
        },
      });

      if (existingTransaction) {
        this.logger.log(`Payment ${paymentIntent.id} already processed`);
        return;
      }

      // Process payment
      const pack = await this.prismaService.pack.findUnique({
        where: { id: packId },
      });

      if (!pack) {
        this.logger.error(`Pack ${packId} not found`);
        return;
      }

      await this.prismaService.$transaction(async (prisma) => {
        // Create transaction record
        await prisma.paymentTransaction.create({
          data: {
            userId: userId,
            packId: packId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'COMPLETED',
            stripePaymentIntentId: paymentIntent.id,
          },
        });

        // Add coins to user
        const currentCoins = await this.coinService.getUserCoins(userId);
        const newCoins = currentCoins.coins + pack.coinsCount;
        await this.coinService.updateUserCoins(userId, newCoins);
      });

      // Send notification
      await this.notificationService.createNotification({
        title: `"${pack.name}" paketi muvaffaqiyatli sotib olindi!`,
        message: `Hisobingizga ${pack.coinsCount} ta tanga qo'shildi`,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.HIGH,
        channel: NotificationChannel.WEB,
        userId: userId,
        data: {
          type: 'pack_purchase',
          packId: pack.id,
          packName: pack.name,
          coinsAdded: pack.coinsCount,
        },
      }, 'user');

      this.logger.log(`Webhook: Payment ${paymentIntent.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing webhook payment: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const userId = paymentIntent.metadata.userId;
      const packId = paymentIntent.metadata.packId;

      if (!userId || !packId) {
        this.logger.error('Missing metadata in payment intent');
        return;
      }

      const pack = await this.prismaService.pack.findUnique({
        where: { id: packId },
      });

      if (!pack) {
        this.logger.error(`Pack ${packId} not found`);
        return;
      }

      // Send failure notification
      await this.notificationService.createNotification({
        title: 'To\'lov amalga oshirilmadi',
        message: `"${pack.name}" paketini sotib olishda xatolik yuz berdi`,
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        channel: NotificationChannel.WEB,
        userId: userId,
        data: {
          type: 'payment_failed',
          packId: pack.id,
          packName: pack.name,
          paymentIntentId: paymentIntent.id,
        },
      }, 'user');

      this.logger.log(`Webhook: Payment ${paymentIntent.id} failed`);
    } catch (error) {
      this.logger.error(`Error processing failed payment webhook: ${error.message}`, error.stack);
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(user: IUser, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        this.prismaService.paymentTransaction.findMany({
          where: {
            userId: user.id,
          },
          include: {
            pack: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prismaService.paymentTransaction.count({
          where: {
            userId: user.id,
          },
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        transactions,
        pagination: {
          page,
          pages,
          limit,
          total,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting payment history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get Stripe public key for client-side configuration
   */
  getPublicKey(): string {
    const publicKey = this.configService.get<string>('STRIPE_PUBLISHABLE_KEY');
    if (!publicKey) {
      throw new Error('STRIPE_PUBLISHABLE_KEY is not configured');
    }
    return publicKey;
  }
} 