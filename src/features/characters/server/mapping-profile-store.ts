import {
  MappingProfileSource,
  type CustomAttributeDefinition as DbCustomAttributeDefinition,
  type MappingProfile as DbMappingProfile,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CharacterCustomAttributeDefinition,
  Nivel20MappingProfile,
} from "@/features/characters/types";

export async function getLatestNivel20MappingProfile() {
  try {
    const profile = await prisma.mappingProfile.findFirst({
      where: {
        source: MappingProfileSource.NIVEL20,
      },
      include: {
        customDefinitions: {
          orderBy: [{ visualOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    });

    return profile ? mapDbProfileToDomain(profile, profile.customDefinitions) : null;
  } catch {
    return null;
  }
}

export async function saveNivel20MappingProfile(profile: Nivel20MappingProfile) {
  const latest = await prisma.mappingProfile.findFirst({
    where: {
      source: MappingProfileSource.NIVEL20,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
  });

  const nextVersion = latest ? latest.version + 1 : profile.version || 1;

  const created = await prisma.mappingProfile.create({
    data: {
      source: MappingProfileSource.NIVEL20,
      version: nextVersion,
      rules: profile.rules as unknown as object,
      customAttributeDefinitions: profile.customAttributeDefinitions as unknown as object,
      customDefinitions: {
        create: profile.customAttributeDefinitions.map((definition) => ({
          key: definition.key,
          label: definition.label,
          type: definition.type,
          category: definition.category,
          description: definition.description,
          visibleInSheet: definition.visibleInSheet,
          visualOrder: definition.visualOrder,
        })),
      },
    },
    include: {
      customDefinitions: {
        orderBy: [{ visualOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return mapDbProfileToDomain(created, created.customDefinitions);
}

function mapDbProfileToDomain(
  profile: DbMappingProfile,
  customDefinitions: DbCustomAttributeDefinition[],
): Nivel20MappingProfile {
  return {
    id: profile.id,
    source: "NIVEL20",
    version: profile.version,
    rules: (profile.rules as Nivel20MappingProfile["rules"]) ?? [],
    customAttributeDefinitions:
      customDefinitions.length > 0
        ? customDefinitions.map(mapCustomDefinition)
        : ((profile.customAttributeDefinitions as CharacterCustomAttributeDefinition[]) ?? []),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function mapCustomDefinition(
  definition: DbCustomAttributeDefinition,
): CharacterCustomAttributeDefinition {
  return {
    key: definition.key,
    label: definition.label,
    type: definition.type as CharacterCustomAttributeDefinition["type"],
    category: definition.category as CharacterCustomAttributeDefinition["category"],
    description: definition.description ?? undefined,
    visibleInSheet: definition.visibleInSheet,
    visualOrder: definition.visualOrder ?? undefined,
    createdFromSource: "nivel20",
  };
}
