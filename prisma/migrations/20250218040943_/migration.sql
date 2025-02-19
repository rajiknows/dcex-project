/*
  Warnings:

  - A unique constraint covering the columns `[publicKey]` on the table `SolWallet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[privateKey]` on the table `SolWallet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SolWallet_publicKey_key" ON "SolWallet"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "SolWallet_privateKey_key" ON "SolWallet"("privateKey");
