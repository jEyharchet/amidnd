import {
  CharacterSource as DbCharacterSource,
  CharacterSyncStatus,
  type Character as DbCharacter,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { importNivel20CharacterFromUrl } from "@/features/characters/importers/nivel20/nivel20Importer";
import { getLatestNivel20MappingProfile } from "@/features/characters/server/mapping-profile-store";
import type {
  Character,
  CharacterAbilityScores,
  CharacterImportDiagnostics,
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
  } catch (error) {
    logServerError("characters.list", error);
    return null;
  }
}

export async function getCharacterRecordById(characterId: string) {
  try {
    return await prisma.character.findUnique({
      where: {
        id: characterId,
      },
    });
  } catch (error) {
    logServerError("characters.getRecord", error, { characterId });
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

    const previousDraft = (character.importedData as ImportedCharacterDraft | null) ?? null;
    const mappingProfile = await getLatestNivel20MappingProfile();
    const importResult = await importNivel20CharacterFromUrl({
      sourceUrl: character.sourceUrl,
      fallbackName: character.name,
      fallbackPlayerName: character.playerName,
      previousDraft,
      mappingProfile: mappingProfile ?? undefined,
    });

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
            : importResult.importedDraft?.importDiagnostics?.state === "real"
              ? CharacterSyncStatus.SYNCED
              : CharacterSyncStatus.ERROR,
        syncError:
          importResult.status === "failed"
            ? importResult.issues[0]?.message ?? "Error de sincronizacion."
            : importResult.importedDraft?.importDiagnostics?.state === "real"
              ? null
              : importResult.issues[0]?.message ?? "Importacion parcial o mock/fallback.",
      },
    });

    return {
      ok: importResult.importedDraft?.importDiagnostics?.state === "real",
      message:
        importResult.issues[0]?.message ??
        "Sincronizacion auditada. Revisa el diagnostico para ver que fue real y que quedo pendiente.",
    };
  } catch (error) {
    logServerError("characters.sync", error, { characterId });
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
  const baseDraft = normalizeImportedDraft(importedDraft ?? createLocalDraftFromRecord(record), record);
  const classLabel =
    baseDraft.classes.map((classEntry) => classEntry.name).join(" / ") || "Sin clase";
  const displaySyncStatus =
    baseDraft.importDiagnostics?.state === "mock"
      ? "mock"
      : baseDraft.importDiagnostics?.state === "partial"
        ? "partial"
        : mapPrismaSyncStatusToDomain(record.syncStatus);

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
    customAttributes: baseDraft.customAttributes,
    notes: baseDraft.notes,
    sourceMetadata: {
      source: mapPrismaSourceToDomain(record.source),
      sourceLabel: record.sourceLabel ?? baseDraft.sourceMetadata.sourceLabel,
      sourceUrl: record.sourceUrl ?? baseDraft.sourceMetadata.sourceUrl,
      externalId: record.sourceExternalId ?? baseDraft.sourceMetadata.externalId,
      importedAt: record.lastSyncedAt?.toISOString(),
      syncStatus: displaySyncStatus,
      visibility: baseDraft.sourceMetadata.visibility,
    },
    importDiagnostics: baseDraft.importDiagnostics,
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
    strength: { key: "strength", label: "FUE", score: 10 },
    dexterity: { key: "dexterity", label: "DES", score: 10 },
    constitution: { key: "constitution", label: "CON", score: 10 },
    intelligence: { key: "intelligence", label: "INT", score: 10 },
    wisdom: { key: "wisdom", label: "SAB", score: 10 },
    charisma: { key: "charisma", label: "CAR", score: 10 },
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
    customAttributes: [],
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

function normalizeImportedDraft(
  draft: ImportedCharacterDraft,
  record: DbCharacter,
): ImportedCharacterDraft {
  const normalizedDraft = applyLegacyCompatibility(draft, record);

  if (normalizedDraft.importDiagnostics) {
    return normalizedDraft;
  }

  const rawSnapshot =
    (record.rawImportData as ImportedCharacterDraft["rawImportData"]) ??
    normalizedDraft.rawImportData;
  const isMockSnapshot = rawSnapshot?.metadata?.mocked === "true" || rawSnapshot?.metadata?.importState === "mock";
  const source = mapPrismaSourceToDomain(record.source);

  const inferredDiagnostics: CharacterImportDiagnostics = {
    state: isMockSnapshot ? "mock" : record.source === DbCharacterSource.NIVEL20 ? "partial" : "real",
    source,
    sectionsDetected: countDetectedSections(normalizedDraft),
    importedFieldCount: countImportedFields(normalizedDraft),
    detectedSections: inferDetectedSections(normalizedDraft),
    importedFields: inferImportedFieldNames(normalizedDraft),
    missingFields: rawSnapshot?.missingFields ?? [],
    sectionDiagnostics: buildSectionDiagnosticsFromDraft(normalizedDraft, isMockSnapshot),
    notes: isMockSnapshot
      ? ["Esta ficha proviene de una importacion mock o fallback previa."]
      : undefined,
  };

  return {
    ...normalizedDraft,
    customAttributes: normalizedDraft.customAttributes ?? [],
    sourceMetadata: {
      ...normalizedDraft.sourceMetadata,
      syncStatus:
        inferredDiagnostics.state === "mock"
          ? "mock"
          : inferredDiagnostics.state === "partial"
            ? "partial"
            : normalizedDraft.sourceMetadata.syncStatus,
    },
    importDiagnostics: inferredDiagnostics,
  };
}

function mergeImportIssues(
  issues: CharacterImportIssue[],
  extraIssues: CharacterImportIssue[],
) {
  return [...issues, ...extraIssues];
}

function countImportedFields(draft: ImportedCharacterDraft) {
  return inferImportedFieldNames(draft).length;
}

function countDetectedSections(draft: ImportedCharacterDraft) {
  return inferDetectedSections(draft).length;
}

function inferDetectedSections(draft: ImportedCharacterDraft) {
  const sections: string[] = [];

  if (draft.identity.name || draft.identity.species || draft.classes.length) {
    sections.push("identity");
  }
  if (Object.values(draft.abilityScores).some((ability) => ability.score > 0)) {
    sections.push("ability-scores");
  }
  if (draft.hitPoints.maximum || draft.armor.armorClass || draft.speed) {
    sections.push("combat");
  }
  if (draft.savingThrows.length) {
    sections.push("saving-throws");
  }
  if (draft.skills.length) {
    sections.push("skills");
  }
  if (draft.proficiencies.length || draft.languages.length) {
    sections.push("proficiencies");
  }
  if (draft.attacks.length) {
    sections.push("attacks");
  }
  if (draft.background || draft.backgroundDetails || draft.alignment || draft.history) {
    sections.push("background");
  }
  if (draft.racialTraits.length || draft.classTraits.length || draft.feats.length) {
    sections.push("traits");
  }
  if (draft.equippedItems.length || draft.carriedItems.length || draft.otherPossessions.length) {
    sections.push("equipment");
  }
  if (draft.spellcasting.length) {
    sections.push("spells");
  }
  if (draft.quickActions.length || draft.resources.length) {
    sections.push("quick-actions");
  }
  if (draft.companions.length) {
    sections.push("companions");
  }
  if (draft.notes.length) {
    sections.push("notes");
  }

  return sections;
}

function inferImportedFieldNames(draft: ImportedCharacterDraft) {
  const fields: string[] = [];

  if (draft.identity.name) fields.push("identity.name");
  if (draft.identity.species) fields.push("identity.species");
  if (draft.classes.length) fields.push("classes");
  if (draft.totalLevel) fields.push("totalLevel");
  if (draft.background) fields.push("background");
  if (draft.alignment) fields.push("alignment");
  if (draft.history) fields.push("history");
  if (draft.languages.length) fields.push("languages");
  if (draft.hitPoints.maximum) fields.push("hitPoints");
  if (draft.armor.armorClass) fields.push("armor.armorClass");
  if (draft.initiative) fields.push("initiative");
  if (draft.speed && draft.speed !== "Pendiente") fields.push("speed");
  if (draft.proficiencyBonus) fields.push("proficiencyBonus");

  for (const [abilityKey, ability] of Object.entries(draft.abilityScores)) {
    if (ability.score > 0) {
      fields.push(`abilityScores.${abilityKey}.score`);
    }
    if (ability.modifier !== undefined) {
      fields.push(`abilityScores.${abilityKey}.modifier`);
    }
    if (ability.savingThrowModifier !== undefined) {
      fields.push(`abilityScores.${abilityKey}.savingThrowModifier`);
    }
    if (ability.savingThrowProficient !== undefined) {
      fields.push(`abilityScores.${abilityKey}.savingThrowProficient`);
    }
  }

  if (draft.savingThrows.length) fields.push("savingThrows");
  if (draft.skills.length) fields.push("skills");
  if (draft.proficiencies.length) fields.push("proficiencies");
  if (draft.attacks.length) fields.push("attacks");
  if (draft.spellcasting.length) fields.push("spellcasting");
  if (draft.racialTraits.length) fields.push("racialTraits");
  if (draft.classTraits.length) fields.push("classTraits");
  if (draft.feats.length) fields.push("feats");
  if (draft.equippedItems.length || draft.carriedItems.length || draft.otherPossessions.length) {
    fields.push("equipment");
  }
  if (draft.quickActions.length || draft.resources.length) fields.push("quickActions");
  if (draft.companions.length) fields.push("companions");
  if (draft.notes.length) fields.push("notes");

  return fields;
}

function buildSectionDiagnosticsFromDraft(
  draft: ImportedCharacterDraft,
  isMockSnapshot: boolean,
): CharacterImportDiagnostics["sectionDiagnostics"] {
  const status = isMockSnapshot ? "mock" : "partial";

  return inferDetectedSections(draft).map((sectionKey) => ({
    key: sectionKey,
    label: sectionKey,
    status,
    importedCount: 1,
    importedFields: [],
    missingFields: [],
    notes:
      status === "mock"
        ? "Datos heredados de una importacion mock/fallback previa."
        : "Datos presentes, pero sin diagnostico fino guardado en esta version anterior.",
  }));
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

function logServerError(
  scope: string,
  error: unknown,
  metadata?: Record<string, string>,
) {
  const err = error instanceof Error ? error : new Error("Unknown error");

  console.error(`[${scope}]`, {
    name: err.name,
    message: err.message,
    stack: err.stack,
    databaseUrlExists: Boolean(process.env.DATABASE_URL),
    ...metadata,
  });
}

function applyLegacyCompatibility(
  draft: ImportedCharacterDraft,
  record: DbCharacter,
): ImportedCharacterDraft {
  const normalizedAbilityScores = normalizeAbilityScores(draft.abilityScores, draft.savingThrows);
  const normalizedSavingThrows = normalizeSavingThrows(draft.savingThrows, normalizedAbilityScores);
  const normalizedSkills = draft.skills.map((skill) => {
    const legacySkill = skill as typeof skill & {
      ability?: keyof ImportedCharacterDraft["abilityScores"];
      proficiency?: "none" | "half" | "proficient" | "expertise";
    };

    return {
      ...skill,
      linkedAbility: skill.linkedAbility ?? legacySkill.ability ?? "strength",
      proficient:
        skill.proficient ??
        (legacySkill.proficiency === "proficient" ||
          legacySkill.proficiency === "expertise"),
      expertise: skill.expertise ?? (legacySkill.proficiency === "expertise"),
      halfProficient: skill.halfProficient ?? (legacySkill.proficiency === "half"),
    };
  });

  return {
    ...draft,
    sourceMetadata: {
      source: mapPrismaSourceToDomain(record.source),
      sourceLabel:
        draft.sourceMetadata?.sourceLabel ??
        (record.source === DbCharacterSource.NIVEL20 ? "Nivel20" : "Local"),
      sourceUrl: record.sourceUrl ?? draft.sourceMetadata?.sourceUrl,
      externalId: record.sourceExternalId ?? draft.sourceMetadata?.externalId,
      syncStatus: draft.sourceMetadata?.syncStatus ?? mapPrismaSyncStatusToDomain(record.syncStatus),
      visibility: draft.sourceMetadata?.visibility,
      importedAt: draft.sourceMetadata?.importedAt,
    },
    abilityScores: normalizedAbilityScores,
    savingThrows: normalizedSavingThrows,
    skills: normalizedSkills,
    customAttributes: draft.customAttributes ?? [],
  };
}

function normalizeAbilityScores(
  abilityScores: ImportedCharacterDraft["abilityScores"],
  savingThrows: ImportedCharacterDraft["savingThrows"],
): ImportedCharacterDraft["abilityScores"] {
  const nextScores = structuredClone(abilityScores);

  for (const [abilityKey, ability] of Object.entries(nextScores) as Array<
    [keyof ImportedCharacterDraft["abilityScores"], ImportedCharacterDraft["abilityScores"][keyof ImportedCharacterDraft["abilityScores"]]]
  >) {
    const savingThrow = savingThrows.find((entry) => entry.ability === abilityKey);

    ability.modifier = ability.overrideModifier ?? ability.modifier;

    if (savingThrow?.modifier !== undefined && ability.savingThrowModifier === undefined) {
      ability.savingThrowModifier = savingThrow.modifier;
    }
    if (savingThrow?.proficient !== undefined && ability.savingThrowProficient === undefined) {
      ability.savingThrowProficient = savingThrow.proficient;
    }
  }

  return nextScores;
}

function normalizeSavingThrows(
  savingThrows: ImportedCharacterDraft["savingThrows"],
  abilityScores: ImportedCharacterDraft["abilityScores"],
): ImportedCharacterDraft["savingThrows"] {
  const byAbility = new Map<
    ImportedCharacterDraft["savingThrows"][number]["ability"],
    ImportedCharacterDraft["savingThrows"][number]
  >();

  for (const savingThrow of savingThrows) {
    byAbility.set(savingThrow.ability, {
      ...savingThrow,
      proficient: savingThrow.proficient ?? false,
    });
  }

  for (const [abilityKey, ability] of Object.entries(abilityScores) as Array<
    [keyof ImportedCharacterDraft["abilityScores"], ImportedCharacterDraft["abilityScores"][keyof ImportedCharacterDraft["abilityScores"]]]
  >) {
    if (ability.savingThrowModifier === undefined && ability.savingThrowProficient === undefined) {
      continue;
    }

    const existing = byAbility.get(abilityKey);
    byAbility.set(abilityKey, {
      ability: abilityKey,
      modifier: ability.savingThrowModifier ?? existing?.modifier,
      proficient: ability.savingThrowProficient ?? existing?.proficient ?? false,
      source: existing?.source ?? ability.source,
      notes: existing?.notes,
    });
  }

  return Array.from(byAbility.values());
}
