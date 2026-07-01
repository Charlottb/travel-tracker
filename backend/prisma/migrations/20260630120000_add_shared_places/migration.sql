-- CreateTable
CREATE TABLE "SharedPlace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "placeId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "sharedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedPlace_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedPlace_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedPlace_placeId_recipientId_key" ON "SharedPlace"("placeId", "recipientId");

-- CreateIndex
CREATE INDEX "SharedPlace_recipientId_idx" ON "SharedPlace"("recipientId");

-- CreateIndex
CREATE INDEX "SharedPlace_sharedById_idx" ON "SharedPlace"("sharedById");
