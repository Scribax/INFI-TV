import { Module } from "@nestjs/common";
import { ActivationModule } from "../activation/activation.module";
import { EpgController } from "./epg.controller";
import { EpgService } from "./epg.service";

@Module({
  imports: [ActivationModule],
  controllers: [EpgController],
  providers: [EpgService],
})
export class EpgModule {}
