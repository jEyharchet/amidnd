import {
  CharacterSource as DbCharacterSource,
  CharacterSyncStatus,
  type Character as DbCharacter,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeNivel20Url } from "@/features/characters/importers/nivel20/nivel20Importer";
import type {
  Character,
  CharacterAbilityScores,
  CharacterImportIssue,
  CharacterSource,
  ImportedCharacterDraft,
} from "@/features/characters/types";

type CreateCharacterInput = {
  name: string;
  playerName?: string;
  source: "LOCAL" | "NIVEL20";
  sourceUrl?: string;
};

export async function listCharactersFromDb() {
  try {
    const records = await prisma.character.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map(mapDbCharacterToDomainCharacter);
  } catch {
    return [];
  }
}

export async function getCharacterRecordById(characterId: string) {
  try {
    return await prisma.character.findUnique({
      where: {
        id: characterId,
      },
    });
  } catch {
    return null;
  }
}

export async function getCharacterByIdFromDb(characterId: string) {
  const record = await getCharacterRecordById(characterId);

  if (!record) {
    return null;
  }

  return mapDbCharacterToDomainCharacter(record);
}

export async function createCharacterInDb(input: CreateCharacterInput) {
  return prisma.character.create({
    data: {
      name: input.name,
      playerName: emptyToNull(input.playerName),
      source: input.source,
      sourceUrl: emptyToNull(input.sourceUrl),
      sourceLabel: input.source === "NIVEL20" ? "Nivel20" : "Local",
      syncStatus: CharacterSyncStatus.NEVER_SYNCED,
    },
  });
}

export async function syncCharacterFromSource(characterId: string) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    if (character.source !== DbCharacterSource.NIVEL20 || !character.sourceUrl) {
      throw new Error("Character source is not syncable");
    }

    await prisma.character.update({
      where: { id: characterId },
      data: {
        syncStatus: CharacterSyncStatus.SYNCING,
        syncError: null,
      },
    });

    const importResult = analyzeNivel20Url(character.sourceUrl);

    if (!importResult.importedDraft) {
      const message =
        importResult.issues[0]?.message ?? "No se pudo obtener un draft importable.";

      await prisma.character.update({
        where: { id: characterId },
        data: {
          syncStatus: CharacterSyncStatus.ERROR,
          syncError: message,
        },
      });

      return {
        ok: false,
        message,
      };
    }

    const mergedDraft = mergeImportedDraftWithLocalName(importResult.importedDraft, character);

    await prisma.character.update({
      where: { id: characterId },
      data: {
        name: mergedDraft.identity.name || character.name,
        playerName: emptyToNull(mergedDraft.identity.playerName ?? character.playerName ?? undefined),
        sourceExternalId: emptyToNull(extractSourceExternalId(character.sourceUrl)),
        importedData: mergedDraft as unknown as object,
        rawImportData: importResult.rawSnapshot
          ? (importResult.rawSnapshot as unknown as object)
          : undefined,
        lastSyncedAt: new Date(),
        syncStatus:
          importResult.status === "failed"
            ? CharacterSyncStatus.ERROR
            : CharacterSyncStatus.SYNCED,
        syncError:
          importResult.status === "failed"
            ? importResult.issues[0]?.message ?? "Error de sincronizacion."
            : null,
      },
    });

    return {
      ok: true,
      message:
        importResult.issues[0]?.message ??
        "Sincronizacion mock completada con datos de preview.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ocurrio un error durante la sincronizacion.";

    try {
      await prisma.character.update({
        where: { id: characterId },
        data: {
          syncStatus: CharacterSyncStatus.ERROR,
          syncError: message,
        },
      });
    } catch {
      return {
        ok: false,
        message,
      };
    }

    return {
      ok: false,
      message,
    };
  }
}

export function mapDbCharacterToDomainCharacter(record: DbCharacter): Character {
  const importedDraft = record.importedData as ImportedCharacterDraft | null;
  const baseDraft = importedDraft ?? createLocalDraftFromRecord(record);
  const classLabel =
    baseDraft.classes.map((classEntry) => classEntry.name).join(" / ") || "Sin clase";

  return {
    id: record.id,
    name: record.name,
    playerName: record.playerName ?? baseDraft.identity.playerName,
    species: baseDraft.identity.species ?? "Sin especie",
    classLabel,
    level: baseDraft.totalLevel,
    background: baseDraft.background,
    backgroundDetails: baseDraft.backgroundDetails,
    alignment: baseDraft.alignment,
    history: baseDraft.history,
    rulesetId: baseDraft.system.rulesetId,
    system: baseDraft.system,
    classes: baseDraft.classes,
    proficiencyBonus: baseDraft.proficiencyBonus,
    initiative: baseDraft.initiative,
    languages: baseDraft.languages,
    abilityScores: baseDraft.abilityScores,
    skills: baseDraft.skills,
    savingThrows: baseDraft.savingThrows,
    proficiencies: baseDraft.proficiencies,
    hitPoints: baseDraft.hitPoints,
    armor: {
      ...baseDraft.armor,
      speed: baseDraft.speed ?? baseDraft.armor.speed,
      initiative: baseDraft.initiative ?? baseDraft.armor.initiative,
    },
    attacks: baseDraft.attacks,
    quickActions: baseDraft.quickActions,
    spellcasting:
      baseDraft.spellcasting[0]
        ? {
            ability: baseDraft.spellcasting[0].ability,
            attackBonus: baseDraft.spellcasting[0].spellAttackBonus,
            saveDc: baseDraft.spellcasting[0].spellSaveDc,
            notes: baseDraft.spellcasting[0].notes,
          }
        : undefined,
    spellcastingDetails: baseDraft.spellcasting,
    resources: baseDraft.resources,
    racialTraits: baseDraft.racialTraits,
    classTraits: baseDraft.classTraits,
    feats: baseDraft.feats,
    equippedItems: baseDraft.equippedItems,
    carriedItems: baseDraft.carriedItems,
    otherPossessions: baseDraft.otherPossessions,
    companions: baseDraft.companions,
    notes: baseDraft.notes,
    sourceMetadata: {
      source: mapPrismaSourceToDomain(record.source),
      sourceLabel: record.sourceLabel ?? baseDraft.sourceMetadata.sourceLabel,
      sourceUrl: record.sourceUrl ?? baseDraft.sourceMetadata.sourceUrl,
      externalId: record.sourceExternalId ?? baseDraft.sourceMetadata.externalId,
      importedAt: record.lastSyncedAt?.toISOString(),
      syncStatus: mapPrismaSyncStatusToDomain(record.syncStatus),
      visibility: baseDraft.sourceMetadata.visibility,
    },
    rawImportData: (record.rawImportData as ImportedCharacterDraft["rawImportData"]) ?? undefined,
    importIssues: mergeImportIssues(
      baseDraft.importIssues,
      record.syncError
        ? [
            {
              code: "sync-error",
              message: record.syncError,
              severity: "warning",
            },
          ]
        : [],
    ),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapPrismaSourceToDomain(source: DbCharacterSource): CharacterSource {
  return source === DbCharacterSource.NIVEL20 ? "nivel20" : "manual";
}

export function mapPrismaSyncStatusToDomain(
  status: CharacterSyncStatus,
): Character["sourceMetadata"]["syncStatus"] {
  switch (status) {
    case CharacterSyncStatus.SYNCED:
      return "imported";
    case CharacterSyncStatus.ERROR:
      return "conflict";
    case CharacterSyncStatus.SYNCING:
      return "stale";
    case CharacterSyncStatus.NEVER_SYNCED:
    default:
      return "manual";
  }
}

function createLocalDraftFromRecord(record: DbCharacter): ImportedCharacterDraft {
  const abilityScores: CharacterAbilityScores = {
    strength: { key: "strength", label: "FUE", score: 10, modifier: 0 },
    dexterity: { key: "dexterity", label: "DES", score: 10, modifier: 0 },
    constitution: { key: "constitution", label: "CON", score: 10, modifier: 0 },
    intelligence: { key: "intelligence", label: "INT", score: 10, modifier: 0 },
    wisdom: { key: "wisdom", label: "SAB", score: 10, modifier: 0 },
    charisma: { key: "charisma", label: "CAR", score: 10, modifier: 0 },
  };

  return {
    identity: {
      name: record.name,
      playerName: record.playerName ?? undefined,
    },
    sourceMetadata: {
      source: mapPrismaSourceToDomain(record.source),
      sourceLabel: record.sourceLabel ?? (record.source === DbCharacterSource.NIVEL20 ? "Nivel20" : "Local"),
      sourceUrl: record.sourceUrl ?? undefined,
      externalId: record.sourceExternalId ?? undefined,
      syncStatus: mapPrismaSyncStatusToDomain(record.syncStatus),
    },
    system: {
      systemId: "dnd5e",
      rulesetId: "pending",
    },
    classes: [],
    totalLevel: 0,
    languages: [],
    abilityScores,
    hitPoints: {
      current: 0,
      maximum: 0,
    },
    armor: {
      armorClass: 0,
      initiative: 0,
      speed: "Pendiente",
    },
    initiative: 0,
    speed: "Pendiente",
    savingThrows: [],
    skills: [],
    proficiencies: [],
    resources: [],
    attacks: [],
    quickActions: [],
    racialTraits: [],
    classTraits: [],
    feats: [],
    equippedItems: [],
    carriedItems: [],
    otherPossessions: [],
    spellcasting: [],
    companions: [],
    notes: [
      {
        id: "local-character-note",
        title: "Ficha local",
        content: "Personaje creado localmente. Aun no tiene datos detallados cargados.",
        kind: "gm",
      },
    ],
    importIssues: [],
  };
}

function mergeImportedDraftWithLocalName(
  draft: ImportedCharacterDraft,
  record: DbCharacter,
): ImportedCharacterDraft {
  return {
    ...draft,
    identity: {
      ...draft.identity,
      name: draft.identity.name || record.name,
      playerName: draft.identity.playerName ?? record.playerName ?? undefined,
    },
  };
}

function mergeImportIssues(
  issues: CharacterImportIssue[],
  extraIssues: CharacterImportIssue[],
) {
  return [...issues, ...extraIssues];
}

function extractSourceExternalId(sourceUrl: string | null) {
  if (!sourceUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(sourceUrl);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

function emptyToNull(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : null;
}
