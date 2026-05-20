-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CharacterSource" AS ENUM ('LOCAL', 'NIVEL20');

-- CreateEnum
CREATE TYPE "CharacterSyncStatus" AS ENUM ('NEVER_SYNCED', 'SYNCING', 'SYNCED', 'ERROR');

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "playerName" TEXT,
    "source" "CharacterSource" NOT NULL,
    "sourceUrl" TEXT,
    "sourceExternalId" TEXT,
    "sourceLabel" TEXT,
    "syncStatus" "CharacterSyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "lastSyncedAt" TIMESTAMP(3),
    "syncError" TEXT,
    "importedData" JSONB,
    "rawImportData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

