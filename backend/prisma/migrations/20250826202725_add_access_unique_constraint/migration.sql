/*
  Warnings:

  - A unique constraint covering the columns `[inventoryId,userId]` on the table `Access` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "sequence" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Access_inventoryId_userId_key" ON "public"."Access"("inventoryId", "userId");

-- Add initial admin user
INSERT INTO "User" (id, email, name, "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'adityasingha084@gmail.com',  -- Replace with your actual email
  'Aditya Singha',              -- Replace with your name
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);