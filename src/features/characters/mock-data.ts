import type {
  Character,
  CharacterAbilityScores,
  CharacterSkill,
  CharacterSavingThrow,
} from "@/features/characters/types";

function createAbilityScores(
  scores: Record<
    keyof CharacterAbilityScores,
    {
      label: string;
      score: number;
      modifier?: number;
      savingThrowModifier?: number;
      savingThrowProficient?: boolean;
    }
  >,
): CharacterAbilityScores {
  return {
    strength: { key: "strength", ...scores.strength },
    dexterity: { key: "dexterity", ...scores.dexterity },
    constitution: { key: "constitution", ...scores.constitution },
    intelligence: { key: "intelligence", ...scores.intelligence },
    wisdom: { key: "wisdom", ...scores.wisdom },
    charisma: { key: "charisma", ...scores.charisma },
  };
}

function createSkill(
  skill: CharacterSkill["key"],
  label: string,
  linkedAbility: CharacterSkill["linkedAbility"],
  modifier?: number,
  options?: Pick<CharacterSkill, "proficient" | "expertise" | "halfProficient" | "passive">,
): CharacterSkill {
  return {
    key: skill,
    label,
    linkedAbility,
    modifier,
    proficient: options?.proficient ?? false,
    expertise: options?.expertise,
    halfProficient: options?.halfProficient,
    passive: options?.passive,
  };
}

function createSavingThrow(
  ability: CharacterSavingThrow["ability"],
  proficient: boolean,
  modifier?: number,
): CharacterSavingThrow {
  return {
    ability,
    proficient,
    modifier,
  };
}

// This mock list is intentionally shaped close to a future DB record set.
export const mockCharacters: Character[] = [
  {
    id: "char-alaric-stonequill",
    name: "Alaric Stonequill",
    playerName: "Jee",
    species: "Humano",
    classLabel: "Mago",
    level: 5,
    background: "Sabio",
    alignment: "Neutral bueno",
    rulesetId: "dnd5e-2024-core",
    proficiencyBonus: 3,
    initiative: 2,
    abilityScores: createAbilityScores({
      strength: { label: "Fue", score: 8, modifier: -1 },
      dexterity: { label: "Des", score: 14, modifier: 2 },
      constitution: { label: "Con", score: 13, modifier: 1 },
      intelligence: { label: "Int", score: 18, modifier: 4, savingThrowModifier: 7, savingThrowProficient: true },
      wisdom: { label: "Sab", score: 12, modifier: 1, savingThrowModifier: 4, savingThrowProficient: true },
      charisma: { label: "Car", score: 10, modifier: 0 },
    }),
    skills: [
      createSkill("arcana", "Arcanos", "intelligence", 7, { proficient: true, expertise: true }),
      createSkill("history", "Historia", "intelligence", 7, { proficient: true }),
      createSkill("investigation", "Investigacion", "intelligence", 7, { proficient: true }),
    ],
    savingThrows: [
      createSavingThrow("intelligence", true, 7),
      createSavingThrow("wisdom", true, 4),
    ],
    hitPoints: {
      current: 24,
      maximum: 24,
      hitDice: "5d6",
    },
    armor: {
      armorClass: 13,
      initiative: 2,
      speed: "30 ft.",
    },
    spellcasting: {
      ability: "intelligence",
      attackBonus: 7,
      saveDc: 15,
      concentration: true,
      notes: "Grimorio con enfasis en control y defensa.",
    },
    resources: [
      {
        id: "arcane-recovery",
        label: "Recuperacion arcana",
        current: 1,
        maximum: 1,
        resetsOn: "daily",
      },
    ],
    notes: [
      {
        id: "note-alaric-1",
        title: "Objetivo actual",
        content: "Recuperar un tomo robado del Archivo de Bronce.",
        kind: "roleplay",
      },
    ],
    sourceMetadata: {
      source: "manual",
      syncStatus: "manual",
    },
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    id: "char-seraphina-vale",
    name: "Seraphina Vale",
    playerName: "Mica",
    species: "Elfa",
    classLabel: "Picara",
    level: 4,
    background: "Criminal",
    proficiencyBonus: 2,
    initiative: 4,
    abilityScores: createAbilityScores({
      strength: { label: "Fue", score: 10, modifier: 0 },
      dexterity: { label: "Des", score: 18, modifier: 4 },
      constitution: { label: "Con", score: 12, modifier: 1 },
      intelligence: { label: "Int", score: 13, modifier: 1, savingThrowModifier: 3, savingThrowProficient: true },
      wisdom: { label: "Sab", score: 14, modifier: 2 },
      charisma: { label: "Car", score: 11, modifier: 0 },
    }),
    skills: [
      createSkill("stealth", "Sigilo", "dexterity", 8, { proficient: true, expertise: true }),
      createSkill("sleightOfHand", "Juego de manos", "dexterity", 6, { proficient: true }),
      createSkill("perception", "Percepcion", "wisdom", 4, { proficient: true, passive: 14 }),
    ],
    savingThrows: [
      createSavingThrow("dexterity", true, 6),
      createSavingThrow("intelligence", true, 3),
    ],
    hitPoints: {
      current: 31,
      maximum: 31,
    },
    armor: {
      armorClass: 15,
      initiative: 4,
      speed: "35 ft.",
      notes: "Armadura de cuero tachonado.",
    },
    resources: [
      {
        id: "cunning-actions",
        label: "Acciones astutas",
        current: 1,
        notes: "Siempre disponible mientras pueda actuar.",
      },
    ],
    notes: [
      {
        id: "note-seraphina-1",
        title: "Gancho",
        content: "Tiene un mapa incompleto de las catacumbas reales.",
        kind: "backstory",
      },
    ],
    sourceMetadata: {
      source: "manual",
      syncStatus: "manual",
    },
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    id: "char-brom-embershield",
    name: "Brom Embershield",
    playerName: "Tomi",
    species: "Enano",
    classLabel: "Clerigo",
    level: 6,
    background: "Acolito",
    rulesetId: "dnd5e-open",
    proficiencyBonus: 3,
    initiative: 0,
    abilityScores: createAbilityScores({
      strength: { label: "Fue", score: 16, modifier: 3 },
      dexterity: { label: "Des", score: 10, modifier: 0 },
      constitution: { label: "Con", score: 16, modifier: 3 },
      intelligence: { label: "Int", score: 10, modifier: 0 },
      wisdom: { label: "Sab", score: 17, modifier: 3, savingThrowModifier: 6, savingThrowProficient: true },
      charisma: { label: "Car", score: 12, modifier: 1, savingThrowModifier: 4, savingThrowProficient: true },
    }),
    skills: [
      createSkill("medicine", "Medicina", "wisdom", 6, { proficient: true }),
      createSkill("religion", "Religion", "intelligence", 3, { proficient: true }),
      createSkill("insight", "Perspicacia", "wisdom", 6, { proficient: true, passive: 16 }),
    ],
    savingThrows: [
      createSavingThrow("wisdom", true, 6),
      createSavingThrow("charisma", true, 4),
    ],
    hitPoints: {
      current: 47,
      maximum: 52,
      temporary: 4,
      hitDice: "6d8",
    },
    armor: {
      armorClass: 18,
      initiative: 0,
      speed: "25 ft.",
      notes: "Escudo del templo y cota de malla.",
    },
    spellcasting: {
      ability: "wisdom",
      attackBonus: 6,
      saveDc: 14,
      notes: "Magia de soporte y proteccion.",
    },
    resources: [
      {
        id: "channel-divinity",
        label: "Canalizar divinidad",
        current: 1,
        maximum: 1,
        resetsOn: "short-rest",
      },
    ],
    notes: [
      {
        id: "note-brom-1",
        title: "Juramento",
        content: "Nunca abandonar a un aliado en tierra sagrada.",
        kind: "roleplay",
      },
    ],
    sourceMetadata: {
      source: "other",
      sourceLabel: "Carga preliminar",
      syncStatus: "manual",
    },
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  },
];

export function getMockCharacterById(characterId: string) {
  return mockCharacters.find((character) => character.id === characterId);
}
