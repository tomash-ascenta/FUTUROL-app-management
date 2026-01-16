/*
  Warnings:

  - The values [meeting_scheduled,quote_sent,won] on the enum `InquiryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [director,surveyor] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InquiryStatus_new" AS ENUM ('new', 'contacted', 'converted', 'lost');
ALTER TABLE "inquiries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "inquiries" ALTER COLUMN "status" TYPE "InquiryStatus_new" USING ("status"::text::"InquiryStatus_new");
ALTER TYPE "InquiryStatus" RENAME TO "InquiryStatus_old";
ALTER TYPE "InquiryStatus_new" RENAME TO "InquiryStatus";
DROP TYPE "InquiryStatus_old";
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin', 'sales', 'manager', 'production_manager', 'technician');
ALTER TABLE "employees" ALTER COLUMN "roles" TYPE "Role_new"[] USING ("roles"::text::"Role_new"[]);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "convertedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
