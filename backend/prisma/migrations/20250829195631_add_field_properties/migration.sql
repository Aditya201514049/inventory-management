/*
  Warnings:

  - Added the required column `order` to the `Field` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Field" ADD COLUMN     "description" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "validation" JSONB;
