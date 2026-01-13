import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow your Next.js frontend to call this API during development
  app.enableCors({
    origin: ['http://localhost:3000'],
  });

  // Optional but recommended: prefix all routes with /api
  app.setGlobalPrefix('api');

  await app.listen(process.env.API_PORT ? Number(process.env.API_PORT) : 3001);
}
bootstrap();
