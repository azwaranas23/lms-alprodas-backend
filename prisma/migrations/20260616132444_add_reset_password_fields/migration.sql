/*
  Warnings:

  - You are about to drop the column `price` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `experience_years` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `expertise` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `github_url` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin_url` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `payment_notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `withdrawals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payment_notifications" DROP CONSTRAINT "payment_notifications_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_course_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_processed_by_fkey";

-- DropForeignKey
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_user_id_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "experience_years",
DROP COLUMN "expertise",
DROP COLUMN "github_url",
DROP COLUMN "linkedin_url";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone",
ADD COLUMN     "reset_password_expires" TIMESTAMPTZ,
ADD COLUMN     "reset_password_token" VARCHAR(255);

-- DropTable
DROP TABLE "payment_notifications";

-- DropTable
DROP TABLE "transactions";

-- DropTable
DROP TABLE "withdrawals";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "WithdrawalStatus";
