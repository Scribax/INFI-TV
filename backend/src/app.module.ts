import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { envValidationSchema } from "./config/env.validation";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { AuditModule } from "./audit/audit.module";
import { PlansModule } from "./plans/plans.module";
import { CustomersModule } from "./customers/customers.module";
import { ActivationCodesModule } from "./codes/codes.module";
import { ActivationModule } from "./activation/activation.module";
import { DevicesModule } from "./devices/devices.module";
import { SessionsModule } from "./sessions/sessions.module";
import { StatsModule } from "./stats/stats.module";
import { IptvSyncModule } from "./iptv/iptv-sync.module";
import { ChannelsModule } from "./channels/channels.module";
import { MeModule } from "./me/me.module";
import { EpgModule } from "./epg/epg.module";
import { VodModule } from "./vod/vod.module";
import { AnimeModule } from "./anime/anime.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../.env", ".env"],
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl:
            config.get<number>("app.throttleTtlMs") ??
            Number(process.env["THROTTLE_TTL_MS"] ?? 60000),
          limit:
            config.get<number>("app.throttleLimit") ??
            Number(process.env["THROTTLE_LIMIT"] ?? 100),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuditModule,
    AuthModule,
    AdminUsersModule,
    PlansModule,
    CustomersModule,
    ActivationCodesModule,
    ActivationModule,
    DevicesModule,
    SessionsModule,
    StatsModule,
    IptvSyncModule,
    ChannelsModule,
    MeModule,
    EpgModule,
    VodModule,
    AnimeModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
