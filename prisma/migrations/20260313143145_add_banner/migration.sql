-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "btnText" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "image" TEXT,
    "bgFrom" TEXT NOT NULL DEFAULT 'from-blue-900',
    "bgTo" TEXT NOT NULL DEFAULT 'to-blue-700',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
