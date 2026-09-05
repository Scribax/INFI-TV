import { Module } from "@nestjs/common";
import { ActivationModule } from "../activation/activation.module";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";

@Module({
  imports: [ActivationModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
