import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { CustomerExpirationService } from "./customer-expiration.service";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerExpirationService],
  exports: [CustomersService],
})
export class CustomersModule {}
