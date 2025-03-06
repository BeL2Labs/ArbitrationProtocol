/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `ArbitrationRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[arbiterId]` on the table `ArbitrationRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[arbitrationRequestId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Arbiter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerEvmAddress` to the `Arbiter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestArbitrationTime` to the `ArbitrationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `ArbitrationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Arbiter" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "ownerEvmAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ArbitrationRequest" ADD COLUMN     "arbiterId" TEXT,
ADD COLUMN     "requestArbitrationTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "transactionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "arbitrationRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ArbitrationRequest_transactionId_key" ON "ArbitrationRequest"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ArbitrationRequest_arbiterId_key" ON "ArbitrationRequest"("arbiterId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_arbitrationRequestId_key" ON "Email"("arbitrationRequestId");

-- AddForeignKey
ALTER TABLE "ArbitrationRequest" ADD CONSTRAINT "ArbitrationRequest_arbiterId_fkey" FOREIGN KEY ("arbiterId") REFERENCES "Arbiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_arbitrationRequestId_fkey" FOREIGN KEY ("arbitrationRequestId") REFERENCES "ArbitrationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
