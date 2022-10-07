import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('e-Samwad User Service')
    .setDescription('User Service APIs')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
  // app.enableCors({
  //   origin: '*',
  //   methods: 'GET, PUT, POST, DELETE, PATCH, OPTIONS',
  //   allowedHeaders: 'Content-Type, Authorization',
  // });
  await app.listen(3000);
}
bootstrap();
