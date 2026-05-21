import type {
  CharacterCustomAttributeDefinition,
  CharacterCustomAttributeValue,
  CharacterSource,
  CharacterSpell,
  ImportedCharacterDraft,
  Nivel20MappingProfile,
  Nivel20MappingRule,
} from "@/features/characters/types";
import type {
  Nivel20CandidateField,
  Nivel20TrainerCandidate,
} from "@/features/characters/importers/nivel20/nivel20MappingTypes";

export const nivel20ExistingFieldOptions: Array<{
  value: Nivel20CandidateField;
  label: string;
}> = [
  { value: "name", label: "name" },
  { value: "species", label: "species" },
  { value: "class", label: "class" },
  { value: "level", label: "level" },
  { value: "abilityScores.strength.score", label: "abilityScores.strength.score" },
  { value: "abilityScores.dexterity.score", label: "abilityScores.dexterity.score" },
  { value: "abilityScores.constitution.score", label: "abilityScores.constitution.score" },
  { value: "abilityScores.intelligence.score", label: "abilityScores.intelligence.score" },
  { value: "abilityScores.wisdom.score", label: "abilityScores.wisdom.score" },
  { value: "abilityScores.charisma.score", label: "abilityScores.charisma.score" },
  { value: "hitPoints.max", label: "hitPoints.max" },
  { value: "armorClass.value", label: "armorClass.value" },
  { value: "initiative.value", label: "initiative.value" },
  { value: "speed.walk", label: "speed.walk" },
  { value: "proficiencyBonus", label: "proficiencyBonus" },
  { value: "skills[]", label: "skills[]" },
  { value: "savingThrows[]", label: "savingThrows[]" },
  { value: "attacks[]", label: "attacks[]" },
  { value: "spells[]", label: "spells[]" },
  { value: "equipment[]", label: "equipment[]" },
  { value: "background.*", label: "background.*" },
  { value: "background.feature", label: "background.feature" },
  { value: "background.history", label: "background.history" },
  { value: "background.alignment", label: "background.alignment" },
  { value: "traits[]", label: "traits[]" },
  { value: "feats[]", label: "feats[]" },
  { value: "resources[]", label: "resources[]" },
  { value: "actions[]", label: "actions[]" },
  { value: "companions[]", label: "companions[]" },
  { value: "notes[]", label: "notes[]" },
];

export function createDefaultNivel20MappingProfile(
  existing?: Partial<Nivel20MappingProfile>,
): Nivel20MappingProfile {
  return {
    id: existing?.id,
    source: "NIVEL20",
    version: existing?.version ?? 1,
    rules: existing?.rules ?? [],
    customAttributeDefinitions: existing?.customAttributeDefinitions ?? [],
    createdAt: existing?.createdAt,
    updatedAt: existing?.updatedAt,
  };
}

export function createEmptyCustomAttributeDefinition(
  fallbackIndex = 0,
): CharacterCustomAttributeDefinition {
  return {
    key: `custom.nivel20.attribute${fallbackIndex + 1}`,
    label: "Nuevo atributo",
    type: "text",
    category: "custom",
    visibleInSheet: true,
    visualOrder: fallbackIndex + 1,
    createdFromSource: "nivel20",
  };
}

export function createMappingRuleFromCandidate(
  candidate: Nivel20TrainerCandidate,
): Nivel20MappingRule {
  return {
    id: `rule-${candidate.id}`,
    candidateId: candidate.id,
    sourcePath: candidate.sectionKey,
    originalText: candidate.originalText,
    detectedValue: candidate.detectedValue,
    selectorHint: candidate.selectorHint,
    confidence: candidate.confidence,
    action: candidate.suggestedField ? "map-existing" : "ignore",
    targetField: candidate.suggestedField,
  };
}

export function applyNivel20MappingProfileToDraft(
  draft: ImportedCharacterDraft,
  profile: Nivel20MappingProfile | undefined,
  candidates: Nivel20TrainerCandidate[],
): ImportedCharacterDraft {
  const nextDraft = structuredClone(draft);
  nextDraft.customAttributes = nextDraft.customAttributes ?? [];

  if (!profile) {
    return nextDraft;
  }

  for (const rule of profile.rules) {
    const candidate = candidates.find((entry) => entry.id === rule.candidateId);

    if (!candidate || rule.action === "ignore") {
      continue;
    }

    if (rule.action === "map-existing" && rule.targetField) {
      applyExistingFieldMapping(
        nextDraft,
        rule.targetField as Nivel20CandidateField,
        candidate.detectedValue,
      );
      continue;
    }

    if (rule.action === "map-custom" && rule.customAttributeKey) {
      const definition = profile.customAttributeDefinitions.find(
        (entry) => entry.key === rule.customAttributeKey,
      );

      if (!definition) {
        continue;
      }

      const nextValue = createCustomAttributeValue(definition, candidate, "nivel20");
      const existingIndex = nextDraft.customAttributes.findIndex(
        (entry) => entry.key === nextValue.key,
      );

      if (existingIndex >= 0) {
        nextDraft.customAttributes[existingIndex] = nextValue;
      } else {
        nextDraft.customAttributes.push(nextValue);
      }
    }
  }

  return nextDraft;
}

function applyExistingFieldMapping(
  draft: ImportedCharacterDraft,
  targetField: Nivel20CandidateField,
  rawValue: string,
) {
  switch (targetField) {
    case "name":
      draft.identity.name = rawValue;
      return;
    case "species":
      draft.identity.species = rawValue;
      return;
    case "class":
      if (draft.classes[0]) {
        draft.classes[0].name = rawValue;
      } else {
        draft.classes = [{ id: "mapped-class", name: rawValue, level: draft.totalLevel || 1 }];
      }
      return;
    case "level": {
      const level = toNumber(rawValue) ?? draft.totalLevel;
      draft.totalLevel = level;
      if (draft.classes[0]) {
        draft.classes[0].level = level;
      }
      return;
    }
    case "abilityScores.strength.score":
      applyAbilityScore(draft, "strength", rawValue);
      return;
    case "abilityScores.dexterity.score":
      applyAbilityScore(draft, "dexterity", rawValue);
      return;
    case "abilityScores.constitution.score":
      applyAbilityScore(draft, "constitution", rawValue);
      return;
    case "abilityScores.intelligence.score":
      applyAbilityScore(draft, "intelligence", rawValue);
      return;
    case "abilityScores.wisdom.score":
      applyAbilityScore(draft, "wisdom", rawValue);
      return;
    case "abilityScores.charisma.score":
      applyAbilityScore(draft, "charisma", rawValue);
      return;
    case "hitPoints.max": {
      const maximum = toNumber(rawValue);
      if (maximum !== undefined) {
        draft.hitPoints.maximum = maximum;
        if (!draft.hitPoints.current) {
          draft.hitPoints.current = maximum;
        }
      }
      return;
    }
    case "armorClass.value": {
      const armorClass = toNumber(rawValue);
      if (armorClass !== undefined) {
        draft.armor.armorClass = armorClass;
      }
      return;
    }
    case "initiative.value": {
      const initiative = toSignedNumber(rawValue);
      if (initiative !== undefined) {
        draft.initiative = initiative;
        draft.armor.initiative = initiative;
      }
      return;
    }
    case "speed.walk":
      draft.speed = rawValue;
      draft.armor.speed = rawValue;
      return;
    case "proficiencyBonus": {
      const proficiencyBonus = toSignedNumber(rawValue);
      if (proficiencyBonus !== undefined) {
        draft.proficiencyBonus = proficiencyBonus;
      }
      return;
    }
    case "background.*":
    case "background.history":
      draft.history = rawValue;
      if (draft.backgroundDetails) {
        draft.backgroundDetails.history = rawValue;
      } else {
        draft.backgroundDetails = { history: rawValue };
      }
      return;
    case "background.feature":
      draft.backgroundDetails = {
        ...draft.backgroundDetails,
        feature: rawValue,
      };
      return;
    case "background.alignment":
      draft.alignment = rawValue;
      draft.backgroundDetails = {
        ...draft.backgroundDetails,
        alignment: rawValue,
      };
      return;
    case "notes[]":
      draft.notes.push({
        id: `mapped-note-${slugify(rawValue)}`,
        title: "Dato mapeado",
        content: rawValue,
        kind: "other",
      });
      return;
    case "actions[]":
      draft.quickActions.push({
        id: `mapped-action-${slugify(rawValue)}`,
        name: rawValue,
        kind: "special",
        source: "Nivel20 mapping profile",
      });
      return;
    case "resources[]":
      draft.resources.push({
        id: `mapped-resource-${slugify(rawValue)}`,
        label: rawValue,
        current: 0,
        notes: "Creado desde mapeo asistido",
      });
      return;
    case "companions[]":
      draft.companions.push({
        id: `mapped-companion-${slugify(rawValue)}`,
        name: rawValue,
        kind: "other",
        notes: "Creado desde mapeo asistido",
      });
      return;
    case "traits[]":
      draft.classTraits.push({
        id: `mapped-trait-${slugify(rawValue)}`,
        name: rawValue,
        kind: "other",
        source: "Nivel20 mapping profile",
      });
      return;
    case "feats[]":
      draft.feats.push({
        id: `mapped-feat-${slugify(rawValue)}`,
        name: rawValue,
        source: "Nivel20 mapping profile",
      });
      return;
    case "savingThrows[]":
    case "skills[]":
    case "attacks[]":
    case "spells[]":
    case "equipment[]":
      applyStructuredListFallback(draft, targetField, rawValue);
      return;
  }
}

function applyStructuredListFallback(
  draft: ImportedCharacterDraft,
  targetField:
    | "savingThrows[]"
    | "skills[]"
    | "attacks[]"
    | "spells[]"
    | "equipment[]",
  rawValue: string,
) {
  switch (targetField) {
    case "attacks[]":
      draft.attacks.push({
        id: `mapped-attack-${slugify(rawValue)}`,
        name: rawValue,
        notes: "Creado desde mapeo asistido",
      });
      return;
    case "spells[]": {
      const spell: CharacterSpell = {
        id: `mapped-spell-${slugify(rawValue)}`,
        name: rawValue,
        level: 0,
        notes: "Creado desde mapeo asistido",
      };
      if (draft.spellcasting[0]) {
        draft.spellcasting[0].spells.push(spell);
      } else {
        draft.spellcasting.push({
          id: "mapped-spellcasting",
          source: "Nivel20 mapping profile",
          slots: [],
          spells: [spell],
        });
      }
      return;
    }
    case "equipment[]":
      draft.carriedItems.push({
        id: `mapped-equipment-${slugify(rawValue)}`,
        name: rawValue,
        category: "other",
        quantity: 1,
        carryingState: "carried",
        notes: "Creado desde mapeo asistido",
      });
      return;
    case "skills[]":
    case "savingThrows[]":
    default:
      draft.notes.push({
        id: `mapped-fallback-${slugify(rawValue)}`,
        title: targetField,
        content: rawValue,
        kind: "other",
      });
  }
}

function applyAbilityScore(
  draft: ImportedCharacterDraft,
  key: keyof ImportedCharacterDraft["abilityScores"],
  rawValue: string,
) {
  const score = toNumber(rawValue);

  if (score === undefined) {
    return;
  }

  draft.abilityScores[key].score = score;
  draft.abilityScores[key].modifier = Math.floor((score - 10) / 2);
}

function createCustomAttributeValue(
  definition: CharacterCustomAttributeDefinition,
  candidate: Nivel20TrainerCandidate,
  source: CharacterSource,
): CharacterCustomAttributeValue {
  return {
    key: definition.key,
    label: definition.label,
    type: definition.type,
    category: definition.category,
    value: coerceCustomValue(definition.type, candidate.detectedValue),
    visibleInSheet: definition.visibleInSheet,
    visualOrder: definition.visualOrder,
    source,
    sourceCandidateId: candidate.id,
    notes: candidate.selectorHint,
  };
}

function coerceCustomValue(
  type: CharacterCustomAttributeDefinition["type"],
  rawValue: string,
) {
  switch (type) {
    case "number":
      return toNumber(rawValue) ?? 0;
    case "boolean":
      return /^(true|si|yes|1)$/i.test(rawValue);
    case "list":
      return rawValue
        .split(/[;,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    case "object":
      return { value: rawValue };
    case "richText":
    case "text":
    default:
      return rawValue;
  }
}

function toNumber(value: string) {
  const match = value.match(/-?\d+/);
  return match ? Number(match[0]) : undefined;
}

function toSignedNumber(value: string) {
  const match = value.match(/[+-]?\d+/);
  return match ? Number(match[0]) : undefined;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
