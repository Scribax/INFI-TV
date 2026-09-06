import { Module } from "@nestjs/common";
import { ActivationModule } from "../activation/activation.module";
import { AnimeController } from "./anime.controller";
import { AnimeService } from "./anime.service";

@Module({
  imports: [ActivationModule],
  controllers: [AnimeController],
  providers: [AnimeService],
  exports: [AnimeService],
})
export class AnimeModule {}
