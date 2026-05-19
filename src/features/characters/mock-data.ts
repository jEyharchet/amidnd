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
      modifier: number;
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
  ability: CharacterSkill["ability"],
  proficiency: CharacterSkill["proficiency"],
  modifier?: number,
): CharacterSkill {
  return {
    key: skill,
    label,
    ability,
    proficiency,
    modifier,
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
      intelligence: { label: "Int", score: 18, modifier: 4 },
      wisdom: { label: "Sab", score: 12, modifier: 1 },
      charisma: { label: "Car", score: 10, modifier: 0 },
    }),
    skills: [
      createSkill("arcana", "Arcanos", "intelligence", "expertise", 7),
      createSkill("history", "Historia", "intelligence", "proficient", 7),
      createSkill("investigation", "Investigacion", "intelligence", "proficient", 7),
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
      intelligence: { label: "Int", score: 13, modifier: 1 },
      wisdom: { label: "Sab", score: 14, modifier: 2 },
      charisma: { label: "Car", score: 11, modifier: 0 },
    }),
    skills: [
      createSkill("stealth", "Sigilo", "dexterity", "expertise", 8),
      createSkill("sleightOfHand", "Juego de manos", "dexterity", "proficient", 6),
      createSkill("perception", "Percepcion", "wisdom", "proficient", 4),
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
      wisdom: { label: "Sab", score: 17, modifier: 3 },
      charisma: { label: "Car", score: 12, modifier: 1 },
    }),
    skills: [
      createSkill("medicine", "Medicina", "wisdom", "proficient", 6),
      createSkill("religion", "Religion", "intelligence", "proficient", 3),
      createSkill("insight", "Perspicacia", "wisdom", "proficient", 6),
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
