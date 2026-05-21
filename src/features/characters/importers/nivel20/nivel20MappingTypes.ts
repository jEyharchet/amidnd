import type {
  CharacterImportIssue,
  CharacterImportRawSnapshot,
  ImportedCharacterDraft,
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
