-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "activationCodeId" TEXT;

-- CreateIndex
CREATE INDEX "devices_activationCodeId_idx" ON "devices"("activationCodeId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_activationCodeId_fkey" FOREIGN KEY ("activationCodeId") REFERENCES "activation_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
