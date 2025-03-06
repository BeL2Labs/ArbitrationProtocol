/*
  Warnings:

  - A unique constraint covering the columns `[ownerEvmAddress]` on the table `Arbiter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Arbiter_ownerEvmAddress_key" ON "Arbiter"("ownerEvmAddress");
