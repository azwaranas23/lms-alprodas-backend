/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentToken]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "enrollmentToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "courses_enrollmentToken_key" ON "public"."courses"("enrollmentToken");
