import { Module } from "@nestjs/common";
import { ActivationModule } from "../activation/activation.module";
import { VodController } from "./vod.controller";
import { VodService } from "./vod.service";

@Module({
  imports: [ActivationModule],
  controllers: [VodController],
  providers: [VodService],
  exports: [VodService],
})
export class VodModule {}
