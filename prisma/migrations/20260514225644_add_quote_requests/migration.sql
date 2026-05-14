-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('PENDING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CLOSED');

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "targetPriceKes" INTEGER,
    "contactPhone" TEXT NOT NULL,
    "preferredCounty" TEXT,
    "imageUrls" TEXT[],
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminReplyKes" INTEGER,
    "adminReplyLeadTime" TEXT,
    "adminReplyNotes" TEXT,
    "adminReplyAt" TIMESTAMP(3),
    "adminReplyBy" TEXT,
    "adminReplyExpires" TIMESTAMP(3),
    "customerDecisionAt" TIMESTAMP(3),
    "customerDeclineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteRequest_userId_createdAt_idx" ON "QuoteRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
