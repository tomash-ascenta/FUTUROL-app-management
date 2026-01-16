-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_locationId_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "locationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
