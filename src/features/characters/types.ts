export type CharacterSource =
  | "manual"
  | "foundry"
  | "roll20"
  | "dndbeyond"
  | "nivel20"
  | "other";

export type AbilityScoreKey =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type CharacterSkillKey =
  | "acrobatics"
  | "animalHandling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleightOfHand"
  | "stealth"
  | "survival";

export type ProficiencyLevel = "none" | "half" | "proficient" | "expertise";

export type CharacterAbilityScore = {
  key: AbilityScoreKey;
  label: string;
  score: number;
  modifier?: number;
};

export type CharacterAbilityScores = Record<AbilityScoreKey, CharacterAbilityScore>;

export type CharacterSkill = {
  key: CharacterSkillKey;
  label: string;
  ability: AbilityScoreKey;
  modifier?: number;
  proficiency: ProficiencyLevel;
  notes?: string;
};

export type CharacterSavingThrow = {
  ability: AbilityScoreKey;
  modifier?: number;
  proficient: boolean;
  notes?: string;
};

export type CharacterHitPoints = {
  current: number;
  maximum: number;
  temporary?: number;
  hitDice?: string;
};

export type CharacterArmor = {
  armorClass: number;
  initiative?: number;
  speed?: string;
  notes?: string;
};

export type CharacterSpellcastingSummary = {
  ability?: AbilityScoreKey;
  attackBonus?: number;
  saveDc?: number;
  concentration?: boolean;
  notes?: string;
};

export type CharacterResource = {
  id: string;
  label: string;
  current: number;
  maximum?: number;
  resetsOn?: "short-rest" | "long-rest" | "daily" | "custom";
  notes?: string;
};

export type CharacterNote = {
  id: string;
  title: string;
  content: string;
  kind?: "backstory" | "combat" | "roleplay" | "inventory" | "gm" | "other";
};

export type CharacterSourceMetadata = {
  source: CharacterSource;
  sourceLabel?: string;
  sourceUrl?: string;
  externalId?: string;
  importedAt?: string;
  visibility?: "private" | "shared" | "public" | "unknown";
  syncStatus?: "manual" | "imported" | "stale" | "conflict";
};

export type CharacterIdentity = {
  name: string;
  playerName?: string;
  species?: string;
  ancestry?: string;
  lineage?: string;
  portraitUrl?: string;
  pronouns?: string;
};

export type CharacterSystemDetails = {
  systemId?: string;
  rulesetId?: string;
  edition?: string;
  variant?: string;
};

export type CharacterClassEntry = {
  id: string;
  name: string;
  subclass?: string;
  level: number;
  hitDie?: string;
  spellcastingAbility?: AbilityScoreKey;
  notes?: string;
};

export type CharacterTrait = {
  id: string;
  name: string;
  kind: "racial" | "class" | "background" | "feat" | "item" | "other";
  description?: string;
  source?: string;
};

export type CharacterFeat = {
  id: string;
  name: string;
  description?: string;
  prerequisite?: string;
  source?: string;
};

export type CharacterAttack = {
  id: string;
  name: string;
  attackBonus?: number;
  damage?: string;
  damageType?: string;
  range?: string;
  ability?: AbilityScoreKey;
  equipped?: boolean;
  notes?: string;
};

export type CharacterAction = {
  id: string;
  name: string;
  kind: "action" | "bonus-action" | "reaction" | "free-action" | "special";
  description?: string;
  source?: string;
  relatedAttackId?: string;
};

export type CharacterEquipmentItem = {
  id: string;
  name: string;
  category:
    | "weapon"
    | "armor"
    | "tool"
    | "adventuring-gear"
    | "consumable"
    | "treasure"
    | "other";
  carryingState?: "equipped" | "carried" | "stored";
  quantity: number;
  weight?: string;
  notes?: string;
};

export type CharacterSpell = {
  id: string;
  name: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  components?: string[];
  prepared?: boolean;
  known?: boolean;
  ritual?: boolean;
  concentration?: boolean;
  notes?: string;
};

export type CharacterSpellSlotLevel = {
  level: number;
  current: number;
  maximum: number;
};

export type CharacterSpellcasting = {
  id: string;
  source: string;
  ability?: AbilityScoreKey;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  cantripsKnown?: number;
  spellsKnown?: number;
  slots: CharacterSpellSlotLevel[];
  spells: CharacterSpell[];
  notes?: string;
};

export type CharacterCompanion = {
  id: string;
  name: string;
  kind: "familiar" | "summon" | "mount" | "pet" | "other";
  armorClass?: number;
  hitPoints?: string;
  notes?: string;
};

export type CharacterProficiency = {
  id: string;
  label: string;
  category: "skill" | "save" | "weapon" | "armor" | "tool" | "language" | "instrument" | "other";
  level: ProficiencyLevel;
  relatedAbility?: AbilityScoreKey;
  source?: string;
};

export type CharacterBackgroundDetails = {
  name?: string;
  feature?: string;
  ideals?: string[];
  bonds?: string[];
  flaws?: string[];
  notes?: string;
};

export type CharacterImportIssue = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  field?: string;
  sourceSection?: string;
};

export type CharacterImportRawSnapshot = {
  source: CharacterSource;
  format: "html" | "pdf" | "json" | "text" | "unknown";
  capturedAt: string;
  sourceUrl?: string;
  title?: string;
  sections?: Record<string, string>;
  metadata?: Record<string, string>;
  payload?: unknown;
};

export type ImportedCharacterDraft = {
  identity: CharacterIdentity;
  sourceMetadata: CharacterSourceMetadata;
  system: CharacterSystemDetails;
  classes: CharacterClassEntry[];
  totalLevel: number;
  background?: string;
  backgroundDetails?: CharacterBackgroundDetails;
  alignment?: string;
  history?: string;
  languages: string[];
  abilityScores: CharacterAbilityScores;
  hitPoints: CharacterHitPoints;
  armor: CharacterArmor;
  initiative?: number;
  speed?: string;
  proficiencyBonus?: number;
  savingThrows: CharacterSavingThrow[];
  skills: CharacterSkill[];
  proficiencies: CharacterProficiency[];
  resources: CharacterResource[];
  attacks: CharacterAttack[];
  quickActions: CharacterAction[];
  racialTraits: CharacterTrait[];
  classTraits: CharacterTrait[];
  feats: CharacterFeat[];
  equippedItems: CharacterEquipmentItem[];
  carriedItems: CharacterEquipmentItem[];
  otherPossessions: CharacterEquipmentItem[];
  spellcasting: CharacterSpellcasting[];
  companions: CharacterCompanion[];
  notes: CharacterNote[];
  importIssues: CharacterImportIssue[];
  rawImportData?: CharacterImportRawSnapshot;
};

export type Character = {
  id: string;
  name: string;
  playerName?: string;
  species: string;
  classLabel: string;
  level: number;
  background?: string;
  backgroundDetails?: CharacterBackgroundDetails;
  alignment?: string;
  history?: string;
  rulesetId?: string;
  system?: CharacterSystemDetails;
  classes?: CharacterClassEntry[];
  proficiencyBonus?: number;
  initiative?: number;
  experiencePoints?: number;
  languages?: string[];
  abilityScores: CharacterAbilityScores;
  skills: CharacterSkill[];
  savingThrows: CharacterSavingThrow[];
  proficiencies?: CharacterProficiency[];
  hitPoints: CharacterHitPoints;
  armor: CharacterArmor;
  attacks?: CharacterAttack[];
  quickActions?: CharacterAction[];
  spellcasting?: CharacterSpellcastingSummary;
  spellcastingDetails?: CharacterSpellcasting[];
  resources: CharacterResource[];
  racialTraits?: CharacterTrait[];
  classTraits?: CharacterTrait[];
  feats?: CharacterFeat[];
  equippedItems?: CharacterEquipmentItem[];
  carriedItems?: CharacterEquipmentItem[];
  otherPossessions?: CharacterEquipmentItem[];
  companions?: CharacterCompanion[];
  notes: CharacterNote[];
  sourceMetadata: CharacterSourceMetadata;
  rawImportData?: CharacterImportRawSnapshot;
  importIssues?: CharacterImportIssue[];
  createdAt: string;
  updatedAt: string;
};
