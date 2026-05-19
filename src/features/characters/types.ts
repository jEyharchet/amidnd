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

export type ProficiencyLevel = "none" | "proficient" | "expertise";

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
  kind?: "backstory" | "combat" | "roleplay" | "inventory" | "other";
};

export type CharacterSourceMetadata = {
  source: CharacterSource;
  sourceLabel?: string;
  externalId?: string;
  importedAt?: string;
  syncStatus?: "manual" | "imported" | "stale" | "conflict";
};

export type Character = {
  id: string;
  name: string;
  playerName: string;
  species: string;
  classLabel: string;
  level: number;
  background?: string;
  alignment?: string;
  rulesetId?: string;
  proficiencyBonus?: number;
  initiative?: number;
  experiencePoints?: number;
  abilityScores: CharacterAbilityScores;
  skills: CharacterSkill[];
  savingThrows: CharacterSavingThrow[];
  hitPoints: CharacterHitPoints;
  armor: CharacterArmor;
  spellcasting?: CharacterSpellcastingSummary;
  resources: CharacterResource[];
  notes: CharacterNote[];
  sourceMetadata: CharacterSourceMetadata;
  createdAt: string;
  updatedAt: string;
};
