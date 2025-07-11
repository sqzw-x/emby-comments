/*
  Warnings:

  - You are about to drop the column `director` on the `EmbyItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmbyItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "localItemId" INTEGER,
    "embyId" TEXT NOT NULL,
    "embyServerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "type" TEXT NOT NULL,
    "externalIds" JSONB,
    "directors" TEXT,
    "actors" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "genres" TEXT,
    "productionYear" INTEGER,
    "dateAdded" DATETIME,
    "communityRating" REAL,
    "premiereDate" DATETIME,
    "studios" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmbyItem_embyServerId_fkey" FOREIGN KEY ("embyServerId") REFERENCES "EmbyServer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmbyItem_localItemId_fkey" FOREIGN KEY ("localItemId") REFERENCES "LocalItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmbyItem" ("actors", "backdropPath", "communityRating", "createdAt", "dateAdded", "embyId", "embyServerId", "externalIds", "genres", "id", "localItemId", "originalTitle", "overview", "posterPath", "premiereDate", "productionYear", "studios", "title", "type", "updatedAt") SELECT "actors", "backdropPath", "communityRating", "createdAt", "dateAdded", "embyId", "embyServerId", "externalIds", "genres", "id", "localItemId", "originalTitle", "overview", "posterPath", "premiereDate", "productionYear", "studios", "title", "type", "updatedAt" FROM "EmbyItem";
DROP TABLE "EmbyItem";
ALTER TABLE "new_EmbyItem" RENAME TO "EmbyItem";
CREATE UNIQUE INDEX "EmbyItem_embyId_embyServerId_key" ON "EmbyItem"("embyId", "embyServerId");
CREATE UNIQUE INDEX "EmbyItem_localItemId_embyServerId_key" ON "EmbyItem"("localItemId", "embyServerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
