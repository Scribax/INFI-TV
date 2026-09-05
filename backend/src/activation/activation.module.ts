import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ActivationCodesModule } from "../codes/codes.module";
import { ActivationAbuseService } from "../common/security/activation-abuse.service";
import { ActivationController } from "./activation.controller";
import { ActivationService } from "./activation.service";
import { SessionGuard } from "./session.guard";

@Module({
  imports: [AuditModule, ActivationCodesModule],
  controllers: [ActivationController],
  providers: [ActivationService, ActivationAbuseService, SessionGuard],
  exports: [ActivationService, SessionGuard],
})
export class ActivationModule {}
