-- AlterTable
ALTER TABLE "measurements" ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailSentById" TEXT,
ADD COLUMN     "emailSentTo" TEXT;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_emailSentById_fkey" FOREIGN KEY ("emailSentById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
