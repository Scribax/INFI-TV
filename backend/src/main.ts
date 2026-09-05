import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AppConfig } from "./config/configuration";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger("Bootstrap");
  const config = app.get(ConfigService);
  const appCfg = config.get<AppConfig>("app");

  app.use(helmet());
  app.enableCors({
    origin: appCfg?.corsOrigins ?? ["http://localhost:3001"],
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("INFI TV API")
    .setDescription("API de la plataforma INFI TV")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = appCfg?.port ?? Number(process.env["PORT"] ?? 3000);
  await app.listen(port);
  logger.log(`INFI TV API escuchando en puerto ${port}`);
  logger.log(`Swagger en /docs`);
}

void bootstrap().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  // Nunca loguear secretos: solo el mensaje del error de arranque.
  Logger.error(`Error fatal en bootstrap: ${msg}`, undefined, "Bootstrap");
  process.exit(1);
});
