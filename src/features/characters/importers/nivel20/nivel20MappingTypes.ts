import type {
  CharacterCustomAttributeDefinition,
  CharacterImportIssue,
  CharacterImportRawSnapshot,
  ImportedCharacterDraft,
  Nivel20MappingProfile,
} from "@/features/characters/types";

export type Nivel20ParsedSection = {
  key:
    | "identity"
    | "ability-scores"
    | "combat"
    | "skills"
    | "saving-throws"
    | "attacks"
    | "proficiencies"
    | "traits"
    | "equipment"
    | "spells"
    | "quick-actions"
    | "background"
    | "companions"
    | "notes";
  label: string;
  status: "real" | "partial" | "mock" | "missing";
  itemCount: number;
  notes?: string;
};

export type Nivel20RawCharacterSnapshot = {
  sourceUrl: string;
  capturedAt: string;
  title?: string;
  metadata?: Record<string, string>;
  sections?: Record<string, string>;
  rawImportData?: CharacterImportRawSnapshot;
};

export type Nivel20ParsedCharacter = {
  detectedCharacterName?: string;
  sections: Nivel20ParsedSection[];
  draft: ImportedCharacterDraft;
};

export type Nivel20ImportResult = {
  status: "success" | "partial" | "failed";
  sourceUrl: string;
  detectedCharacterName?: string;
  parsedCharacter?: Nivel20ParsedCharacter;
  importedDraft?: ImportedCharacterDraft;
  issues: CharacterImportIssue[];
  rawSnapshot?: Nivel20RawCharacterSnapshot;
};

export type Nivel20CandidateField =
  | "name"
  | "species"
  | "class"
  | "level"
  | "abilityScores.strength.score"
  | "abilityScores.dexterity.score"
  | "abilityScores.constitution.score"
  | "abilityScores.intelligence.score"
  | "abilityScores.wisdom.score"
  | "abilityScores.charisma.score"
  | "hitPoints.max"
  | "armorClass.value"
  | "initiative.value"
  | "speed.walk"
  | "proficiencyBonus"
  | "skills[]"
  | "savingThrows[]"
  | "attacks[]"
  | "spells[]"
  | "equipment[]"
  | "background.*"
  | "background.feature"
  | "background.history"
  | "background.alignment"
  | "traits[]"
  | "feats[]"
  | "resources[]"
  | "actions[]"
  | "companions[]"
  | "notes[]";

export type Nivel20TrainerCandidate = {
  id: string;
  sectionKey: string;
  originalText: string;
  selectorHint?: string;
  detectedValue: string;
  suggestedField?: Nivel20CandidateField;
  confidence: "low" | "medium" | "high";
};

export type Nivel20TrainerInspection = {
  sourceUrl: string;
  normalizedText: string;
  htmlSnapshot: string;
  detectedSections: Array<{
    key: string;
    label: string;
    snippet?: string;
  }>;
  parsedFields: string[];
  missingFields: string[];
  candidates: Nivel20TrainerCandidate[];
  issues: CharacterImportIssue[];
  baseDraft: ImportedCharacterDraft;
  mappedDraft: ImportedCharacterDraft;
  mappingProfile: Nivel20MappingProfile;
  customAttributeDefinitions: CharacterCustomAttributeDefinition[];
};
