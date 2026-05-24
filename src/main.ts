import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@src/app.module';
import {
  AllExceptionsFilter,
  ValidationExceptionFilter,
} from '@src/common/filters';
import { validationExceptionFactory } from '@src/common/factories';
import { TransformInterceptor } from '@src/common/interceptors';
import { assertOAuthStateSecret } from '@src/common/helpers/assert-oauth-state-secret';
import cookieParser from 'cookie-parser';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Re-export for backward compatibility with existing tests
export { assertOAuthStateSecret } from '@src/common/helpers/assert-oauth-state-secret';

async function bootstrap(): Promise<void> {
  assertOAuthStateSecret();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsDir = join(process.cwd(), 'uploads');

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.use(cookieParser());
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ValidationExceptionFilter(),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription('Learning Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documents', app, document);

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 4000);

  console.log(`Application is running on port: ${process.env.PORT ?? '4000'}`);
  console.log(
    `Swagger documentation: http://localhost:${process.env.PORT ?? '4000'}/documents`,
  );
  console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
}
bootstrap().catch((error) => {
  console.error(error);
});
