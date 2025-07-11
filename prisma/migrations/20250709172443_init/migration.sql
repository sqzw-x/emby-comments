-- CreateTable
CREATE TABLE "EmbyServer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "remoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LocalItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "type" TEXT NOT NULL,
    "year" INTEGER,
    "externalIds" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmbyItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "localItemId" INTEGER,
    "embyId" TEXT NOT NULL,
    "embyServerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "type" TEXT NOT NULL,
    "year" INTEGER,
    "externalIds" JSONB,
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

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "localItemId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_localItemId_fkey" FOREIGN KEY ("localItemId") REFERENCES "LocalItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT '未分类',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "localItemId" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rating_localItemId_fkey" FOREIGN KEY ("localItemId") REFERENCES "LocalItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalLinkProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_LocalItemToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_LocalItemToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "LocalItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LocalItemToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbyItem_embyId_embyServerId_key" ON "EmbyItem"("embyId", "embyServerId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbyItem_localItemId_embyServerId_key" ON "EmbyItem"("localItemId", "embyServerId");

-- CreateIndex
CREATE INDEX "Comment_localItemId_idx" ON "Comment"("localItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_localItemId_key" ON "Comment"("localItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Rating_localItemId_idx" ON "Rating"("localItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_localItemId_key" ON "Rating"("localItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLinkProvider_key_key" ON "ExternalLinkProvider"("key");

-- CreateIndex
CREATE INDEX "ExternalLinkProvider_key_idx" ON "ExternalLinkProvider"("key");

-- CreateIndex
CREATE INDEX "ExternalLinkProvider_order_idx" ON "ExternalLinkProvider"("order");

-- CreateIndex
CREATE UNIQUE INDEX "_LocalItemToTag_AB_unique" ON "_LocalItemToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_LocalItemToTag_B_index" ON "_LocalItemToTag"("B");
