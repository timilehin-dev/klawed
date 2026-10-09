-- CreateEnum
CREATE TYPE "Category" AS ENUM ('jobs', 'remote', 'hackathons', 'grants', 'accelerators', 'visas', 'scholarships', 'internships', 'ai_credits', 'student_deals');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('nigeria', 'africa', 'global');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('draft', 'live', 'expired');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "org" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "deadline" TIMESTAMP(3),
    "evergreen" BOOLEAN NOT NULL DEFAULT false,
    "eligibility" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'live',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_category_region_idx" ON "Listing"("category", "region");

-- CreateIndex
CREATE INDEX "Listing_status_deadline_idx" ON "Listing"("status", "deadline");

-- CreateIndex
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
