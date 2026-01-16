import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // Allow frontend to call
    await app.listen(3001); // Port 3001 as required by frontend proxy
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
