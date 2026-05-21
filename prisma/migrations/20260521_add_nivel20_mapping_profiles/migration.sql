-- CreateEnum
CREATE TYPE "MappingProfileSource" AS ENUM ('NIVEL20');

-- CreateTable
CREATE TABLE "MappingProfile" (
    "id" TEXT NOT NULL,
    "source" "MappingProfileSource" NOT NULL,
    "version" INTEGER NOT NULL,
    "rules" JSONB NOT NULL,
    "customAttributeDefinitions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomAttributeDefinition" (
    "id" TEXT NOT NULL,
    "mappingProfileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "visibleInSheet" BOOLEAN NOT NULL DEFAULT true,
    "visualOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomAttributeDefinition_mappingProfileId_idx" ON "CustomAttributeDefinition"("mappingProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomAttributeDefinition_mappingProfileId_key_key" ON "CustomAttributeDefinition"("mappingProfileId", "key");

-- AddForeignKey
ALTER TABLE "CustomAttributeDefinition" ADD CONSTRAINT "CustomAttributeDefinition_mappingProfileId_fkey" FOREIGN KEY ("mappingProfileId") REFERENCES "MappingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
