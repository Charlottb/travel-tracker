-- CreateTable
CREATE TABLE "PublicPlaceShare" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "placeId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" DATETIME,
    CONSTRAINT "PublicPlaceShare_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicPlaceShare_placeId_key" ON "PublicPlaceShare"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicPlaceShare_tokenHash_key" ON "PublicPlaceShare"("tokenHash");

-- CreateIndex
CREATE INDEX "PublicPlaceShare_placeId_idx" ON "PublicPlaceShare"("placeId");

-- CreateIndex
CREATE INDEX "PublicPlaceShare_disabledAt_idx" ON "PublicPlaceShare"("disabledAt");
