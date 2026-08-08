-- CreateTable
CREATE TABLE "ClickAnalytics" (
    "id" TEXT NOT NULL,
    "shortUrlId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickAnalytics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClickAnalytics" ADD CONSTRAINT "ClickAnalytics_shortUrlId_fkey" FOREIGN KEY ("shortUrlId") REFERENCES "Url"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
