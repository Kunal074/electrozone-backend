/*
  Warnings:

  - A unique constraint covering the columns `[tallyVoucherId]` on the table `offline_sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tallyApiKey]` on the table `stores` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "offline_sales" ADD COLUMN     "tallyVoucherId" TEXT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "tallyApiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "offline_sales_tallyVoucherId_key" ON "offline_sales"("tallyVoucherId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_tallyApiKey_key" ON "stores"("tallyApiKey");
