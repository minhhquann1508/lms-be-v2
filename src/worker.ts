import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(AppModule);
  console.log('Worker is running...');
}

bootstrap().catch((err) => {
  console.error('Error in bootstrap:', err);
});
