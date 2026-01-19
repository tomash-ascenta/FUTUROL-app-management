-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "canInstallation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canMeasurement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canService" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "service_tickets" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedById" TEXT,
ADD COLUMN     "customerFeedback" TEXT,
ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailSentById" TEXT,
ADD COLUMN     "emailSentTo" TEXT,
ADD COLUMN     "internalEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "internalEmailSentTo" JSONB,
ADD COLUMN     "materialsUsed" JSONB,
ADD COLUMN     "pdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "photos" JSONB,
ADD COLUMN     "resolvedById" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'internal',
ADD COLUMN     "workPerformed" TEXT;

-- CreateTable
CREATE TABLE "installations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "scheduledAt" TIMESTAMP(3),
    "technicianId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "checklist" JSONB,
    "workNotes" TEXT,
    "photos" JSONB,
    "handoverNotes" TEXT,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "emailSentTo" TEXT,
    "emailSentById" TEXT,
    "internalEmailSentAt" TIMESTAMP(3),
    "internalEmailSentTo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "installations_orderId_key" ON "installations"("orderId");

-- CreateIndex
CREATE INDEX "installations_technicianId_idx" ON "installations"("technicianId");

-- CreateIndex
CREATE INDEX "installations_status_idx" ON "installations"("status");

-- CreateIndex
CREATE INDEX "installations_scheduledAt_idx" ON "installations"("scheduledAt");

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_emailSentById_fkey" FOREIGN KEY ("emailSentById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_emailSentById_fkey" FOREIGN KEY ("emailSentById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
