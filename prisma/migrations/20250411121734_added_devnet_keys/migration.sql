/*
  Warnings:

  - A unique constraint covering the columns `[devnetPublicKey]` on the table `SolWallet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[devnetPrivateKey]` on the table `SolWallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `devnetPrivateKey` to the `SolWallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `devnetPublicKey` to the `SolWallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SolWallet" ADD COLUMN     "devnetPrivateKey" TEXT NOT NULL,
ADD COLUMN     "devnetPublicKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SolWallet_devnetPublicKey_key" ON "SolWallet"("devnetPublicKey");

-- CreateIndex
CREATE UNIQUE INDEX "SolWallet_devnetPrivateKey_key" ON "SolWallet"("devnetPrivateKey");
