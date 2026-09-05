import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { CustomersModule } from "../customers/customers.module";
import { ActivationCodesController } from "./activation-codes.controller";
import { ActivationCodesService } from "./activation-codes.service";

@Module({
  imports: [AuditModule, AuthModule, CustomersModule],
  controllers: [ActivationCodesController],
  providers: [ActivationCodesService],
  exports: [ActivationCodesService],
})
export class ActivationCodesModule {}
