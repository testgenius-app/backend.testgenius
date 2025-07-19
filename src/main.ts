import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure raw body for Stripe webhooks
  app.use('/v1/stripe/webhook', express.raw({ type: 'application/json' }));

  // Configurating app
  app.enableCors({ origin: '*' });
  app.enableShutdownHooks();
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix(configService.get<string>('GLOBAL_PREFIX'));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Configurating Documentation
  const config = new DocumentBuilder()
    .setTitle(configService.get<string>('APP_NAME'))
    .setDescription(configService.get<string>('APP_DESCRIPTION'))
    .setVersion(configService.get<string>('APP_VERSION'))
    .addTag(configService.get<string>('APP_TAG'))
    .addBearerAuth(
      {
        description: `Enter token in the following format: Bearer <JWT>`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(configService.get<string>('DOCS_PREFIX'), app, document);

  // Starting server
  await app.listen(configService.get<number>('PORT'));
}
bootstrap();
