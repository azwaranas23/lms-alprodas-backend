/*
  Warnings:

  - You are about to drop the column `enrollmentToken` on the `courses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseToken]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."courses_enrollmentToken_key";

-- AlterTable
ALTER TABLE "public"."courses" DROP COLUMN "enrollmentToken",
ADD COLUMN     "courseToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "courses_courseToken_key" ON "public"."courses"("courseToken");
