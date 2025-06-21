import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentHistoryDto } from './dto/payment-history.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/core/types/iuser.type';
import { Request } from 'express';

@ApiTags('Stripe Payments')
@Controller({ path: 'stripe', version: '1' })
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create payment intent for pack purchase',
    description: 'Creates a Stripe payment intent for purchasing a coin pack',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        clientSecret: { type: 'string' },
        paymentIntentId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        pack: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            coinsCount: { type: 'number' },
            price: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async createPaymentIntent(
    @User() user: IUser,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.stripeService.createPaymentIntent(user, createPaymentIntentDto);
  }

  @Post('confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Confirm payment and add coins',
    description: 'Confirms a successful payment and adds coins to user account',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        pack: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            coinsCount: { type: 'number' },
          },
        },
        coinsAdded: { type: 'number' },
        totalCoins: { type: 'number' },
        transactionId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async confirmPayment(
    @User() user: IUser,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return this.stripeService.confirmPayment(user, confirmPaymentDto);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description: 'Handles Stripe webhook events for payment processing',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Webhook error' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.stripeService.handleWebhook(signature, request.rawBody);
  }

  @Get('payment-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user payment history',
    description: 'Retrieves paginated payment history for the authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
              pack: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  coinsCount: { type: 'number' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            pages: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentHistory(
    @User() user: IUser,
    @Query() query: PaymentHistoryDto,
  ) {
    return this.stripeService.getPaymentHistory(
      user,
      query.page,
      query.limit,
    );
  }

  @Get('public-key')
  @ApiOperation({
    summary: 'Get Stripe public key',
    description: 'Returns the Stripe publishable key for client-side configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Public key retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        publicKey: { type: 'string' },
      },
    },
  })
  async getPublicKey() {
    const publicKey = this.stripeService.getPublicKey();
    return { publicKey };
  }
} 