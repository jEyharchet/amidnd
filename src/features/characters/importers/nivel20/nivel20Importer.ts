import type {
  CharacterAbilityScores,
  CharacterAttack,
  CharacterClassEntry,
  CharacterFeat,
  CharacterImportIssue,
  CharacterNote,
  CharacterProficiency,
  CharacterSkill,
  CharacterSpellSlotLevel,
  CharacterTrait,
  ImportedCharacterDraft,
} from "@/features/characters/types";
import type {
  Nivel20ImportResult,
  Nivel20ParsedSection,
  Nivel20RawCharacterSnapshot,
} from "@/features/characters/importers/nivel20/nivel20MappingTypes";

const nivel20Hosts = new Set(["nivel20.com", "www.nivel20.com"]);

export function analyzeNivel20Url(input: string): Nivel20ImportResult {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return createFailedResult("", [
      {
        code: "empty-url",
        message: "Pega una URL para poder analizarla.",
        severity: "error",
      },
    ]);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedInput);
  } catch {
    return createFailedResult(trimmedInput, [
      {
        code: "invalid-url",
        message: "La URL no tiene un formato valido.",
        severity: "error",
      },
    ]);
  }

  const detectedDomain = parsedUrl.hostname.toLowerCase();

  if (!nivel20Hosts.has(detectedDomain)) {
    return createFailedResult(parsedUrl.toString(), [
      {
        code: "wrong-domain",
        message: "La URL no pertenece a nivel20.com.",
        severity: "error",
        sourceSection: detectedDomain,
      },
    ]);
  }

  const pathname = parsedUrl.pathname.toLowerCase();
  const looksLikeCharacterUrl =
    pathname.includes("personaje") ||
    pathname.includes("character") ||
    pathname.includes("pj") ||
    pathname.includes("sheet");

  if (!looksLikeCharacterUrl) {
    const mockDraft = createMockImportedCharacterDraft(parsedUrl.toString());
    const parsedSections = createParsedSections(mockDraft);

    return {
      status: "partial",
      sourceUrl: parsedUrl.toString(),
      detectedCharacterName: mockDraft.identity.name,
      parsedCharacter: {
        detectedCharacterName: mockDraft.identity.name,
        sections: parsedSections,
        draft: mockDraft,
      },
      importedDraft: mockDraft,
      issues: [
        {
          code: "unsupported-url",
          message: "La URL es de Nivel20, pero no parece una ficha compartida de personaje.",
          severity: "warning",
        },
        {
          code: "fetch-pending",
          message: "Pendiente: analizar HTML/PDF/export si Nivel20 lo permite.",
          severity: "info",
        },
      ],
      rawSnapshot: createRawSnapshot(parsedUrl.toString()),
    };
  }

  const importedDraft = createMockImportedCharacterDraft(parsedUrl.toString());
  const sections = createParsedSections(importedDraft);

  return {
    status: "success",
    sourceUrl: parsedUrl.toString(),
    detectedCharacterName: importedDraft.identity.name,
    parsedCharacter: {
      detectedCharacterName: importedDraft.identity.name,
      sections,
      draft: importedDraft,
    },
    importedDraft,
    issues: [
      {
        code: "mock-preview",
        message: "Preview mock generada sin fetch real ni credenciales.",
        severity: "info",
      },
      {
        code: "fetch-pending",
        message: "Pendiente: analizar HTML/PDF/export si Nivel20 lo permite.",
        severity: "info",
      },
    ],
    rawSnapshot: createRawSnapshot(parsedUrl.toString()),
  };
}

function createFailedResult(
  sourceUrl: string,
  issues: CharacterImportIssue[],
): Nivel20ImportResult {
  return {
    status: "failed",
    sourceUrl,
    issues,
  };
}

function createMockImportedCharacterDraft(sourceUrl: string): ImportedCharacterDraft {
  const abilityScores: CharacterAbilityScores = {
    strength: { key: "strength", label: "FUE", score: 11, modifier: 0 },
    dexterity: { key: "dexterity", label: "DES", score: 18, modifier: 4 },
    constitution: { key: "constitution", label: "CON", score: 14, modifier: 2 },
    intelligence: { key: "intelligence", label: "INT", score: 14, modifier: 2 },
    wisdom: { key: "wisdom", label: "SAB", score: 12, modifier: 1 },
    charisma: { key: "charisma", label: "CAR", score: 14, modifier: 2 },
  };

  const classes: CharacterClassEntry[] = [
    {
      id: "bard-1",
      name: "Bardo",
      level: 1,
      hitDie: "1d8",
      spellcastingAbility: "charisma",
    },
  ];

  const attacks: CharacterAttack[] = [
    {
      id: "hand-crossbow",
      name: "Ballesta de mano",
      attackBonus: 6,
      damage: "1d6+4",
      damageType: "perforante",
      range: "9/36 m",
      ability: "dexterity",
      equipped: true,
    },
    {
      id: "rapier",
      name: "Estoque",
      attackBonus: 2,
      damage: "1d8",
      damageType: "perforante",
      ability: "strength",
      equipped: true,
    },
  ];

  const traits: CharacterTrait[] = [
    {
      id: "variant-human",
      name: "Humano alternativo",
      kind: "racial",
      description: "Versatilidad adicional y dote inicial.",
      source: "Raza",
    },
    {
      id: "bard-level-1",
      name: "Bardo nivel 1",
      kind: "class",
      description: "Base de la clase y competencia con inspiracion.",
      source: "Clase",
    },
    {
      id: "bardic-inspiration",
      name: "Inspiracion bardica",
      kind: "class",
      description: "d6 para potenciar tiradas de aliados.",
      source: "Clase",
    },
    {
      id: "spellcasting",
      name: "Lanzamiento de conjuros",
      kind: "class",
      description: "Acceso a trucos y conjuros de nivel 1.",
      source: "Clase",
    },
  ];

  const feats: CharacterFeat[] = [
    {
      id: "crossbow-expert",
      name: "Experto en ballestas",
      description: "Mejora el uso de ballestas y elimina ciertas trabas.",
      source: "Dote",
    },
  ];

  const skills: CharacterSkill[] = [
    { key: "acrobatics", label: "Acrobacias", ability: "dexterity", modifier: 6, proficiency: "proficient" },
    { key: "performance", label: "Interpretacion", ability: "charisma", modifier: 4, proficiency: "proficient" },
    { key: "persuasion", label: "Persuasion", ability: "charisma", modifier: 4, proficiency: "proficient" },
    { key: "sleightOfHand", label: "Juego de manos", ability: "dexterity", modifier: 6, proficiency: "proficient" },
  ];

  const proficiencies: CharacterProficiency[] = [
    { id: "prof-light-armor", label: "Armadura ligera", category: "armor", level: "proficient", source: "Bardo" },
    { id: "prof-hand-crossbow", label: "Ballesta de mano", category: "weapon", level: "proficient", source: "Experto en ballestas" },
    { id: "prof-rapier", label: "Estoque", category: "weapon", level: "proficient", source: "Bardo" },
    { id: "prof-lute", label: "Laud", category: "instrument", level: "proficient", source: "Bardo" },
    { id: "lang-common", label: "Comun", category: "language", level: "proficient", source: "Base" },
    { id: "lang-elvish", label: "Elfico", category: "language", level: "proficient", source: "Humano alternativo" },
  ];

  const spellSlots: CharacterSpellSlotLevel[] = [{ level: 1, current: 2, maximum: 2 }];

  const notes: CharacterNote[] = [
    {
      id: "gm-note-manuel",
      title: "Observacion del GM",
      content: "Bardo pensado para prueba de importacion, con foco en movilidad y apoyo.",
      kind: "gm",
    },
  ];

  return {
    identity: {
      name: "Manuel Dario",
      species: "Humano alternativo",
    },
    sourceMetadata: {
      source: "nivel20",
      sourceLabel: "Nivel20",
      sourceUrl,
      visibility: "shared",
      syncStatus: "imported",
    },
    system: {
      systemId: "dnd5e",
      rulesetId: "dnd5e-2014",
      edition: "5e",
    },
    classes,
    totalLevel: 1,
    background: "Artista itinerante",
    backgroundDetails: {
      name: "Artista itinerante",
      feature: "Contacto en tabernas y teatros",
      notes: "Trasfondo cargado como muestra del modelado futuro.",
    },
    alignment: "Caotico bueno",
    history: "Interprete callejero que mezcla musica, ingenio y una punteria inesperada.",
    languages: ["Comun", "Elfico"],
    abilityScores,
    hitPoints: {
      current: 10,
      maximum: 10,
      hitDice: "1d8",
    },
    armor: {
      armorClass: 16,
      initiative: 4,
      speed: "30 ft.",
      notes: "Defensa compuesta por destreza y equipo ligero.",
    },
    initiative: 4,
    speed: "30 ft.",
    proficiencyBonus: 2,
    savingThrows: [
      { ability: "dexterity", proficient: true, modifier: 6 },
      { ability: "charisma", proficient: true, modifier: 4 },
    ],
    skills,
    proficiencies,
    resources: [
      {
        id: "bardic-inspiration",
        label: "Inspiracion bardica",
        current: 2,
        maximum: 2,
        resetsOn: "long-rest",
      },
    ],
    attacks,
    quickActions: [
      {
        id: "quick-draw-bolts",
        name: "Recargar y disparar",
        kind: "bonus-action",
        description: "Accion rapida mock para testear modelado de acciones cortas.",
        source: "Preview tecnica",
      },
    ],
    racialTraits: traits.filter((trait) => trait.kind === "racial"),
    classTraits: traits.filter((trait) => trait.kind === "class"),
    feats,
    equippedItems: [
      {
        id: "eq-studded-leather",
        name: "Armadura ligera reforzada",
        category: "armor",
        carryingState: "equipped",
        quantity: 1,
      },
      {
        id: "eq-hand-crossbow",
        name: "Ballesta de mano",
        category: "weapon",
        carryingState: "equipped",
        quantity: 1,
      },
      {
        id: "eq-rapier",
        name: "Estoque",
        category: "weapon",
        carryingState: "equipped",
        quantity: 1,
      },
    ],
    carriedItems: [
      {
        id: "carry-lute",
        name: "Laud",
        category: "tool",
        carryingState: "carried",
        quantity: 1,
      },
      {
        id: "carry-bolts",
        name: "Virotes",
        category: "adventuring-gear",
        carryingState: "carried",
        quantity: 20,
      },
    ],
    otherPossessions: [
      {
        id: "other-letter",
        name: "Carta de recomendacion",
        category: "other",
        carryingState: "stored",
        quantity: 1,
      },
    ],
    spellcasting: [
      {
        id: "bard-spellcasting",
        source: "Bardo nivel 1",
        ability: "charisma",
        spellSaveDc: 12,
        spellAttackBonus: 4,
        cantripsKnown: 2,
        spellsKnown: 4,
        slots: spellSlots,
        spells: [
          { id: "mock-vicious-mockery", name: "Burla cruel", level: 0, known: true },
          { id: "mock-mage-hand", name: "Mano de mago", level: 0, known: true },
          { id: "mock-healing-word", name: "Palabra curativa", level: 1, known: true },
          { id: "mock-dissonant-whispers", name: "Susurros disonantes", level: 1, known: true },
          { id: "mock-charm-person", name: "Hechizar persona", level: 1, known: true },
          { id: "mock-faerie-fire", name: "Fuego feerico", level: 1, known: true },
        ],
        notes: "Preview mock de lanzamiento de conjuros para futuras importaciones reales.",
      },
    ],
    companions: [],
    notes,
    importIssues: [
      {
        code: "mock-data",
        message: "Los datos mostrados son una simulacion previa al fetch real.",
        severity: "info",
      },
    ],
    rawImportData: {
      source: "nivel20",
      format: "html",
      capturedAt: "2026-05-20T00:00:00.000Z",
      sourceUrl,
      title: "Manuel Dario | Nivel20",
      sections: {
        resumen: "Bardo nivel 1, humano alternativo, ficha compartida.",
      },
      metadata: {
        mocked: "true",
      },
      payload: {
        sample: "nivel20-character-preview",
      },
    },
  };
}

function createParsedSections(
  importedDraft: ImportedCharacterDraft,
): Nivel20ParsedSection[] {
  return [
    {
      key: "ability-scores",
      label: "Caracteristicas",
      status: "detected",
      itemCount: Object.keys(importedDraft.abilityScores).length,
    },
    {
      key: "skills",
      label: "Habilidades",
      status: importedDraft.skills.length ? "detected" : "missing",
      itemCount: importedDraft.skills.length,
    },
    {
      key: "saving-throws",
      label: "Salvaciones",
      status: importedDraft.savingThrows.length ? "detected" : "missing",
      itemCount: importedDraft.savingThrows.length,
    },
    {
      key: "attacks",
      label: "Ataques",
      status: importedDraft.attacks.length ? "detected" : "missing",
      itemCount: importedDraft.attacks.length,
    },
    {
      key: "traits",
      label: "Rasgos",
      status:
        importedDraft.racialTraits.length + importedDraft.classTraits.length + importedDraft.feats.length
          ? "detected"
          : "missing",
      itemCount:
        importedDraft.racialTraits.length + importedDraft.classTraits.length + importedDraft.feats.length,
    },
    {
      key: "equipment",
      label: "Equipo",
      status:
        importedDraft.equippedItems.length +
          importedDraft.carriedItems.length +
          importedDraft.otherPossessions.length
          ? "detected"
          : "missing",
      itemCount:
        importedDraft.equippedItems.length +
        importedDraft.carriedItems.length +
        importedDraft.otherPossessions.length,
    },
    {
      key: "spells",
      label: "Conjuros",
      status: importedDraft.spellcasting.length ? "detected" : "missing",
      itemCount: importedDraft.spellcasting.reduce(
        (total, spellcasting) => total + spellcasting.spells.length,
        0,
      ),
    },
    {
      key: "quick-actions",
      label: "Acciones rapidas",
      status: importedDraft.quickActions.length ? "partial" : "missing",
      itemCount: importedDraft.quickActions.length,
      notes: "Seccion preparada para mapear acciones cortas o especiales.",
    },
    {
      key: "background",
      label: "Trasfondo",
      status: importedDraft.backgroundDetails || importedDraft.background ? "detected" : "missing",
      itemCount: importedDraft.backgroundDetails || importedDraft.background ? 1 : 0,
    },
  ];
}

function createRawSnapshot(sourceUrl: string): Nivel20RawCharacterSnapshot {
  return {
    sourceUrl,
    capturedAt: "2026-05-20T00:00:00.000Z",
    title: "Mock de ficha Nivel20",
    metadata: {
      importerMode: "preview-only",
      credentialsUsed: "false",
    },
    sections: {
      header: "Manuel Dario, Humano alternativo, Bardo 1",
      combat: "PG 10, CA 16, Iniciativa +4",
      spellcasting: "Carisma, CD 12, ataque +4",
    },
    rawImportData: {
      source: "nivel20",
      format: "html",
      capturedAt: "2026-05-20T00:00:00.000Z",
      sourceUrl,
      title: "Mock de ficha Nivel20",
      sections: {
        preview: "Pendiente de fetch real. Estructura generada como simulacion.",
      },
      metadata: {
        mocked: "true",
      },
    },
  };
}
