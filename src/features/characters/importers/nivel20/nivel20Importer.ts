import type {
  AbilityScoreKey,
  CharacterAbilityScores,
  CharacterAttack,
  CharacterBackgroundDetails,
  CharacterClassEntry,
  CharacterCustomAttributeDefinition,
  CharacterImportDiagnostics,
  CharacterImportIssue,
  CharacterImportRawSnapshot,
  CharacterImportSectionDiagnostic,
  CharacterProficiency,
  CharacterSkill,
  CharacterSpell,
  CharacterSpellSlotLevel,
  CharacterTrait,
  ImportedCharacterDraft,
  Nivel20MappingProfile,
} from "@/features/characters/types";
import type {
  Nivel20CandidateField,
  Nivel20ImportResult,
  Nivel20ParsedSection,
  Nivel20RawCharacterSnapshot,
  Nivel20TrainerCandidate,
  Nivel20TrainerInspection,
} from "@/features/characters/importers/nivel20/nivel20MappingTypes";
import {
  applyNivel20MappingProfileToDraft,
  createDefaultNivel20MappingProfile,
} from "@/features/characters/importers/nivel20/nivel20MappingProfile";

const nivel20Hosts = new Set(["nivel20.com", "www.nivel20.com"]);

type ImportSectionKey =
  | "identity"
  | "ability-scores"
  | "combat"
  | "saving-throws"
  | "skills"
  | "proficiencies"
  | "attacks"
  | "background"
  | "traits"
  | "equipment"
  | "spells"
  | "quick-actions"
  | "companions"
  | "notes";

type FetchContext = {
  sourceUrl: string;
  fallbackName?: string;
  fallbackPlayerName?: string | null;
  previousDraft?: ImportedCharacterDraft | null;
  mappingProfile?: Nivel20MappingProfile;
};

type SectionState = "real" | "mock" | "missing";

type ParsedValueMap = Partial<{
  identity: ImportedCharacterDraft["identity"];
  classes: CharacterClassEntry[];
  totalLevel: number;
  background: string;
  backgroundDetails: CharacterBackgroundDetails;
  alignment: string;
  history: string;
  languages: string[];
  abilityScores: CharacterAbilityScores;
  hitPoints: ImportedCharacterDraft["hitPoints"];
  armor: ImportedCharacterDraft["armor"];
  initiative: number;
  speed: string;
  proficiencyBonus: number;
  savingThrows: ImportedCharacterDraft["savingThrows"];
  skills: CharacterSkill[];
  proficiencies: CharacterProficiency[];
  resources: ImportedCharacterDraft["resources"];
  attacks: CharacterAttack[];
  quickActions: ImportedCharacterDraft["quickActions"];
  racialTraits: CharacterTrait[];
  classTraits: CharacterTrait[];
  feats: ImportedCharacterDraft["feats"];
  equippedItems: ImportedCharacterDraft["equippedItems"];
  carriedItems: ImportedCharacterDraft["carriedItems"];
  otherPossessions: ImportedCharacterDraft["otherPossessions"];
  spellcasting: ImportedCharacterDraft["spellcasting"];
  companions: ImportedCharacterDraft["companions"];
  notes: ImportedCharacterDraft["notes"];
}>;

type ParsedHtmlResult = {
  html: string;
  text: string;
  title?: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
  genericLanding: boolean;
  sections: Record<string, string>;
  detectedSections: ImportSectionKey[];
  parsedFields: string[];
  values: ParsedValueMap;
  issues: CharacterImportIssue[];
};

const abilityLabelMap: Record<string, AbilityScoreKey> = {
  FUE: "strength",
  DES: "dexterity",
  CON: "constitution",
  INT: "intelligence",
  SAB: "wisdom",
  CAR: "charisma",
};

const skillDefinitions: Array<{
  key: CharacterSkill["key"];
  label: string;
  linkedAbility: AbilityScoreKey;
}> = [
  { key: "acrobatics", label: "Acrobacias", linkedAbility: "dexterity" },
  { key: "animalHandling", label: "Trato con animales", linkedAbility: "wisdom" },
  { key: "arcana", label: "Arcana", linkedAbility: "intelligence" },
  { key: "athletics", label: "Atletismo", linkedAbility: "strength" },
  { key: "deception", label: "Engano", linkedAbility: "charisma" },
  { key: "history", label: "Historia", linkedAbility: "intelligence" },
  { key: "insight", label: "Perspicacia", linkedAbility: "wisdom" },
  { key: "intimidation", label: "Intimidacion", linkedAbility: "charisma" },
  { key: "investigation", label: "Investigacion", linkedAbility: "intelligence" },
  { key: "medicine", label: "Medicina", linkedAbility: "wisdom" },
  { key: "nature", label: "Naturaleza", linkedAbility: "intelligence" },
  { key: "perception", label: "Percepcion", linkedAbility: "wisdom" },
  { key: "performance", label: "Interpretacion", linkedAbility: "charisma" },
  { key: "persuasion", label: "Persuasion", linkedAbility: "charisma" },
  { key: "religion", label: "Religion", linkedAbility: "intelligence" },
  { key: "sleightOfHand", label: "Juego de manos", linkedAbility: "dexterity" },
  { key: "stealth", label: "Sigilo", linkedAbility: "dexterity" },
  { key: "survival", label: "Supervivencia", linkedAbility: "wisdom" },
];

const sectionDefinitions: Array<{
  key: ImportSectionKey;
  label: string;
  expectedFields: string[];
  htmlKeywords: string[];
}> = [
  {
    key: "identity",
    label: "Identidad",
    expectedFields: ["identity.name", "identity.species", "classes", "totalLevel"],
    htmlKeywords: ["personaje", "raza", "especie", "clase", "nivel"],
  },
  {
    key: "ability-scores",
    label: "Caracteristicas",
    expectedFields: [
      "abilityScores.strength.score",
      "abilityScores.dexterity.score",
      "abilityScores.constitution.score",
      "abilityScores.intelligence.score",
      "abilityScores.wisdom.score",
      "abilityScores.charisma.score",
    ],
    htmlKeywords: ["fue", "des", "con", "int", "sab", "car"],
  },
  {
    key: "combat",
    label: "Combate",
    expectedFields: ["hitPoints", "armor.armorClass", "initiative", "speed", "proficiencyBonus"],
    htmlKeywords: ["pg", "ca", "iniciativa", "velocidad", "competencia"],
  },
  {
    key: "saving-throws",
    label: "Salvaciones",
    expectedFields: ["savingThrows"],
    htmlKeywords: ["salvacion", "salvaciones"],
  },
  {
    key: "skills",
    label: "Habilidades",
    expectedFields: ["skills"],
    htmlKeywords: ["habilidades", "acrobacias", "persuasion", "sigilo"],
  },
  {
    key: "proficiencies",
    label: "Competencias",
    expectedFields: ["proficiencies", "languages"],
    htmlKeywords: ["competencias", "idiomas", "armaduras", "herramientas"],
  },
  {
    key: "attacks",
    label: "Ataques",
    expectedFields: ["attacks"],
    htmlKeywords: ["ataques", "armas", "dano"],
  },
  {
    key: "background",
    label: "Trasfondo",
    expectedFields: ["background", "alignment", "history", "backgroundDetails"],
    htmlKeywords: ["trasfondo", "alineamiento", "historia", "ideales", "vinculos", "defectos"],
  },
  {
    key: "traits",
    label: "Rasgos y dotes",
    expectedFields: ["racialTraits", "classTraits", "feats"],
    htmlKeywords: ["rasgos", "dotes", "clase", "raza"],
  },
  {
    key: "equipment",
    label: "Equipo",
    expectedFields: ["equippedItems", "carriedItems", "otherPossessions"],
    htmlKeywords: ["equipo", "inventario", "posesiones"],
  },
  {
    key: "spells",
    label: "Conjuros",
    expectedFields: ["spellcasting"],
    htmlKeywords: ["conjuros", "hechizos", "espacios de conjuro", "trucos"],
  },
  {
    key: "quick-actions",
    label: "Acciones rapidas",
    expectedFields: ["quickActions"],
    htmlKeywords: ["acciones rapidas", "bonus action", "accion adicional"],
  },
  {
    key: "companions",
    label: "Companeros",
    expectedFields: ["companions"],
    htmlKeywords: ["companero", "companeros", "familiar", "mascota", "montura"],
  },
  {
    key: "notes",
    label: "Notas",
    expectedFields: ["notes"],
    htmlKeywords: ["notas", "observaciones"],
  },
];

export function analyzeNivel20Url(input: string): Nivel20ImportResult {
  const validated = validateNivel20Url(input);

  if (!validated.ok) {
    return createFailedResult(validated.sourceUrl, validated.issues);
  }

  const previewDraft = createMockPreviewDraft(validated.sourceUrl);

  return {
    status: validated.looksLikeCharacterUrl ? "partial" : "failed",
    sourceUrl: validated.sourceUrl,
    detectedCharacterName: previewDraft.identity.name,
    parsedCharacter: {
      detectedCharacterName: previewDraft.identity.name,
      sections: createParsedSectionsFromDiagnostics(previewDraft.importDiagnostics),
      draft: previewDraft,
    },
    importedDraft: previewDraft,
    issues: [
      ...validated.issues,
      {
        code: "mock-preview",
        message:
          "Esta pantalla experimental solo genera una preview mock. La sincronizacion real ocurre en el servidor.",
        severity: "info",
      },
    ],
    rawSnapshot: createRawSnapshotFromDraft(previewDraft),
  };
}

export async function importNivel20CharacterFromUrl({
  sourceUrl,
  fallbackName,
  fallbackPlayerName,
  previousDraft,
  mappingProfile,
}: FetchContext): Promise<Nivel20ImportResult> {
  const validated = validateNivel20Url(sourceUrl);

  if (!validated.ok) {
    return createFailedResult(validated.sourceUrl, validated.issues);
  }

  const fetchResult = await fetchAndParseNivel20Html(validated.sourceUrl);
  const merged = buildImportedDraft({
    sourceUrl: validated.sourceUrl,
    parsed: fetchResult,
    fallbackName,
    fallbackPlayerName,
    previousDraft,
  });
  const candidates = buildTrainerCandidates(fetchResult, merged);
  const mappedDraft = applyNivel20MappingProfileToDraft(
    merged,
    mappingProfile,
    candidates,
  );
  const diagnostics = mappedDraft.importDiagnostics;

  return {
    status: diagnostics?.state === "real" ? "success" : "partial",
    sourceUrl: validated.sourceUrl,
    detectedCharacterName: mappedDraft.identity.name,
    parsedCharacter: {
      detectedCharacterName: mappedDraft.identity.name,
      sections: createParsedSectionsFromDiagnostics(diagnostics),
      draft: mappedDraft,
    },
    importedDraft: mappedDraft,
    issues: mappedDraft.importIssues,
    rawSnapshot: createRawSnapshotFromDraft(mappedDraft),
  };
}

export async function inspectNivel20SourceForTrainer({
  sourceUrl,
  fallbackName,
  fallbackPlayerName,
  previousDraft,
  mappingProfile,
}: FetchContext): Promise<Nivel20TrainerInspection> {
  const validated = validateNivel20Url(sourceUrl);

  if (!validated.ok) {
    const emptyDraft = createEmptyImportedDraft({
      sourceUrl: validated.sourceUrl,
      fallbackName,
      fallbackPlayerName,
    });
    const profile = createDefaultNivel20MappingProfile(mappingProfile);

    return {
      sourceUrl: validated.sourceUrl,
      normalizedText: "",
      htmlSnapshot: "",
      detectedSections: [],
      parsedFields: [],
      missingFields: [],
      candidates: [],
      issues: validated.issues,
      baseDraft: emptyDraft,
      mappedDraft: emptyDraft,
      mappingProfile: profile,
      customAttributeDefinitions: profile.customAttributeDefinitions,
    };
  }

  const parsed = await fetchAndParseNivel20Html(validated.sourceUrl);
  const baseDraft = buildImportedDraft({
    sourceUrl: validated.sourceUrl,
    parsed,
    fallbackName,
    fallbackPlayerName,
    previousDraft,
  });
  const profile = createDefaultNivel20MappingProfile(mappingProfile);
  const candidates = buildTrainerCandidates(parsed, baseDraft);
  const mappedDraft = applyNivel20MappingProfileToDraft(baseDraft, profile, candidates);

  return {
    sourceUrl: validated.sourceUrl,
    normalizedText: parsed.text,
    htmlSnapshot: parsed.html,
    detectedSections: sectionDefinitions
      .filter(
        (section) =>
          parsed.detectedSections.includes(section.key) || Boolean(parsed.sections[section.key]),
      )
      .map((section) => ({
        key: section.key,
        label: section.label,
        snippet: parsed.sections[section.key],
      })),
    parsedFields: parsed.parsedFields,
    missingFields: mappedDraft.importDiagnostics?.missingFields ?? [],
    candidates,
    issues: [...validated.issues, ...mappedDraft.importIssues],
    baseDraft,
    mappedDraft,
    mappingProfile: profile,
    customAttributeDefinitions: profile.customAttributeDefinitions,
  };
}

function validateNivel20Url(input: string):
  | {
      ok: true;
      sourceUrl: string;
      looksLikeCharacterUrl: boolean;
      issues: CharacterImportIssue[];
    }
  | {
      ok: false;
      sourceUrl: string;
      issues: CharacterImportIssue[];
    } {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return {
      ok: false,
      sourceUrl: "",
      issues: [
        {
          code: "empty-url",
          message: "Pega una URL de Nivel20 para poder analizarla.",
          severity: "error",
        },
      ],
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedInput);
  } catch {
    return {
      ok: false,
      sourceUrl: trimmedInput,
      issues: [
        {
          code: "invalid-url",
          message: "La URL no tiene un formato valido.",
          severity: "error",
        },
      ],
    };
  }

  const detectedDomain = parsedUrl.hostname.toLowerCase();

  if (!nivel20Hosts.has(detectedDomain)) {
    return {
      ok: false,
      sourceUrl: parsedUrl.toString(),
      issues: [
        {
          code: "wrong-domain",
          message: "La URL no pertenece a nivel20.com.",
          severity: "error",
          sourceSection: detectedDomain,
        },
      ],
    };
  }

  const normalizedPath = parsedUrl.pathname.toLowerCase();
  const looksLikeCharacterUrl = ["personaje", "character", "pj", "sheet"].some((token) =>
    normalizedPath.includes(token),
  );

  const issues: CharacterImportIssue[] = [];

  if (!looksLikeCharacterUrl) {
    issues.push({
      code: "unsupported-url",
      message: "La URL es de Nivel20, pero no parece una ficha publica de personaje.",
      severity: "warning",
    });
  }

  return {
    ok: true,
    sourceUrl: parsedUrl.toString(),
    looksLikeCharacterUrl,
    issues,
  };
}

async function fetchAndParseNivel20Html(sourceUrl: string): Promise<ParsedHtmlResult> {
  const issues: CharacterImportIssue[] = [];

  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "user-agent": "amidnd-import-audit/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });

    const html = await response.text();
    const finalUrl = response.url || sourceUrl;
    const contentType = response.headers.get("content-type") ?? "unknown";
    const title = matchOne(html, /<title[^>]*>([^<]+)<\/title>/i);
    const text = htmlToText(html);
    const sections = collectSectionSnippets(text);
    const genericLanding = isWelcomePage(text, title);
    const parsedFields: string[] = [];
    const values: ParsedValueMap = {};

    if (genericLanding) {
      issues.push({
        code: "initial-html-not-character-sheet",
        message:
          "El HTML inicial de Nivel20 parece la portada o una vista generica, no una ficha publica lista para parsear.",
        severity: "warning",
        sourceSection: "identity",
      });

      for (const section of sectionDefinitions) {
        issues.push({
          code: `missing-section-${section.key}`,
          message: `La seccion ${section.label} no esta presente en el HTML inicial; puede requerir endpoint interno, exportacion o captura manual.`,
          severity: "info",
          sourceSection: section.key,
        });
      }

      return {
        html,
        text,
        title: title ?? undefined,
        finalUrl,
        statusCode: response.status,
        contentType,
        genericLanding,
        sections,
        detectedSections: [],
        parsedFields,
        values,
        issues,
      };
    }

    const abilityScores = parseAbilityScores(text, parsedFields);
    if (abilityScores) {
      values.abilityScores = abilityScores;
    }

    const hitPoints = parseHitPoints(text, parsedFields);
    if (hitPoints) {
      values.hitPoints = hitPoints;
    }

    const armorClass = parseArmorClass(text, parsedFields);
    const initiative = parseSignedNumberField(text, ["iniciativa"], "initiative", parsedFields);
    const speed = parseTextField(text, ["velocidad"], parsedFields, "speed");
    const proficiencyBonus = parseSignedNumberField(
      text,
      ["competencia", "bono de competencia"],
      "proficiencyBonus",
      parsedFields,
    );

    if (armorClass || initiative !== undefined || speed || proficiencyBonus !== undefined) {
      values.armor = {
        armorClass: armorClass ?? 0,
        initiative,
        speed,
      };
      if (initiative !== undefined) {
        values.initiative = initiative;
      }
      if (speed) {
        values.speed = speed;
      }
      if (proficiencyBonus !== undefined) {
        values.proficiencyBonus = proficiencyBonus;
      }
    }

    const classes = parseClassSummary(text, parsedFields);
    if (classes.length) {
      values.classes = classes;
      values.totalLevel = classes.reduce((total, entry) => total + entry.level, 0);
    }

    const identity = parseIdentity(text, title, parsedFields);
    if (identity) {
      values.identity = identity;
    }

    const background = parseLabeledText(text, ["trasfondo"], parsedFields, "background");
    if (background) {
      values.background = background;
    }

    const alignment = parseLabeledText(text, ["alineamiento"], parsedFields, "alignment");
    if (alignment) {
      values.alignment = alignment;
    }

    const history = parseLabeledText(text, ["historia", "backstory"], parsedFields, "history");
    if (history) {
      values.history = history;
    }

    const languages = parseCommaSeparatedList(text, ["idiomas"], parsedFields, "languages");
    if (languages.length) {
      values.languages = languages;
    }

    const backgroundDetails = parseBackgroundDetails(text, parsedFields);
    if (backgroundDetails) {
      values.backgroundDetails = backgroundDetails;
    }

    const skills = parseSkills(text, parsedFields);
    if (skills.length) {
      values.skills = skills;
    }

    const savingThrows = parseSavingThrows(text, parsedFields);
    if (savingThrows.length) {
      values.savingThrows = savingThrows;
    }

    const attacks = parseAttacks(text, parsedFields);
    if (attacks.length) {
      values.attacks = attacks;
    }

    const proficiencies = parseSimpleTaggedList(
      text,
      ["idiomas", "armaduras", "armas", "herramientas", "instrumentos"],
      "proficiencies",
      parsedFields,
    );
    if (proficiencies.length) {
      values.proficiencies = proficiencies;
    }

    const spellcasting = parseSpellcasting(text, parsedFields);
    if (spellcasting.length) {
      values.spellcasting = spellcasting;
    }

    const detectedSections = sectionDefinitions
      .filter((section) => {
        if (hasActualSectionContent(section.key, values)) {
          return true;
        }

        const lowerText = text.toLowerCase();
        return section.htmlKeywords.some((keyword) => lowerText.includes(keyword));
      })
      .map((section) => section.key);

    for (const section of sectionDefinitions) {
      if (!detectedSections.includes(section.key)) {
        issues.push({
          code: `missing-section-${section.key}`,
          message: `La seccion ${section.label} no esta presente en el HTML inicial; puede requerir endpoint interno, exportacion o captura manual.`,
          severity: "info",
          sourceSection: section.key,
        });
      }
    }

    return {
      html,
      text,
      title: title ?? undefined,
      finalUrl,
      statusCode: response.status,
      contentType,
      genericLanding: false,
      sections,
      detectedSections,
      parsedFields,
      values,
      issues,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");

    return {
      html: "",
      text: "",
      finalUrl: sourceUrl,
      statusCode: 0,
      contentType: "unknown",
      genericLanding: false,
      sections: {},
      detectedSections: [],
      parsedFields: [],
      values: {},
      issues: [
        {
          code: "fetch-failed",
          message: `No se pudo leer el HTML publico de Nivel20: ${err.message}`,
          severity: "error",
        },
      ],
    };
  }
}

function buildImportedDraft({
  sourceUrl,
  parsed,
  fallbackName,
  fallbackPlayerName,
  previousDraft,
}: {
  sourceUrl: string;
  parsed: ParsedHtmlResult;
  fallbackName?: string;
  fallbackPlayerName?: string | null;
  previousDraft?: ImportedCharacterDraft | null;
}): ImportedCharacterDraft {
  const baseDraft = createEmptyImportedDraft({
    sourceUrl,
    fallbackName,
    fallbackPlayerName,
  });
  const allowPreviousFallback = false;

  const sectionStates: Partial<Record<ImportSectionKey, SectionState>> = {};

  const nextDraft: ImportedCharacterDraft = {
    ...baseDraft,
    identity: mergeValue(
      "identity",
      parsed.values.identity,
      allowPreviousFallback ? previousDraft?.identity : undefined,
      baseDraft.identity,
      sectionStates,
      allowPreviousFallback,
    ),
    classes: mergeArray(
      "identity",
      parsed.values.classes,
      allowPreviousFallback ? previousDraft?.classes : undefined,
      baseDraft.classes,
      sectionStates,
      allowPreviousFallback,
    ),
    totalLevel:
      parsed.values.totalLevel ??
      (allowPreviousFallback ? previousDraft?.totalLevel : undefined) ??
      baseDraft.totalLevel,
    background:
      parsed.values.background ??
      (allowPreviousFallback ? previousDraft?.background : undefined) ??
      baseDraft.background,
    backgroundDetails: mergeValue(
      "background",
      parsed.values.backgroundDetails,
      allowPreviousFallback ? previousDraft?.backgroundDetails : undefined,
      baseDraft.backgroundDetails,
      sectionStates,
      allowPreviousFallback,
    ),
    alignment:
      parsed.values.alignment ??
      (allowPreviousFallback ? previousDraft?.alignment : undefined) ??
      baseDraft.alignment,
    history:
      parsed.values.history ??
      (allowPreviousFallback ? previousDraft?.history : undefined) ??
      baseDraft.history,
    languages: mergeArray(
      "proficiencies",
      parsed.values.languages,
      allowPreviousFallback ? previousDraft?.languages : undefined,
      baseDraft.languages,
      sectionStates,
      allowPreviousFallback,
    ),
    abilityScores: mergeValue(
      "ability-scores",
      parsed.values.abilityScores,
      allowPreviousFallback ? previousDraft?.abilityScores : undefined,
      baseDraft.abilityScores,
      sectionStates,
      allowPreviousFallback,
    ),
    hitPoints: mergeValue(
      "combat",
      parsed.values.hitPoints,
      allowPreviousFallback ? previousDraft?.hitPoints : undefined,
      baseDraft.hitPoints,
      sectionStates,
      allowPreviousFallback,
    ),
    armor: mergeValue(
      "combat",
      parsed.values.armor,
      allowPreviousFallback ? previousDraft?.armor : undefined,
      baseDraft.armor,
      sectionStates,
      allowPreviousFallback,
    ),
    initiative:
      parsed.values.initiative ??
      (allowPreviousFallback ? previousDraft?.initiative : undefined) ??
      baseDraft.initiative,
    speed:
      parsed.values.speed ??
      (allowPreviousFallback ? previousDraft?.speed : undefined) ??
      baseDraft.speed,
    proficiencyBonus:
      parsed.values.proficiencyBonus ??
      (allowPreviousFallback ? previousDraft?.proficiencyBonus : undefined) ??
      baseDraft.proficiencyBonus,
    savingThrows: mergeArray(
      "saving-throws",
      parsed.values.savingThrows,
      allowPreviousFallback ? previousDraft?.savingThrows : undefined,
      baseDraft.savingThrows,
      sectionStates,
      allowPreviousFallback,
    ),
    skills: mergeArray(
      "skills",
      parsed.values.skills,
      allowPreviousFallback ? previousDraft?.skills : undefined,
      baseDraft.skills,
      sectionStates,
      allowPreviousFallback,
    ),
    proficiencies: mergeArray(
      "proficiencies",
      parsed.values.proficiencies,
      allowPreviousFallback ? previousDraft?.proficiencies : undefined,
      baseDraft.proficiencies,
      sectionStates,
      allowPreviousFallback,
    ),
    resources: mergeArray(
      "quick-actions",
      parsed.values.resources,
      allowPreviousFallback ? previousDraft?.resources : undefined,
      baseDraft.resources,
      sectionStates,
      allowPreviousFallback,
    ),
    attacks: mergeArray(
      "attacks",
      parsed.values.attacks,
      allowPreviousFallback ? previousDraft?.attacks : undefined,
      baseDraft.attacks,
      sectionStates,
      allowPreviousFallback,
    ),
    quickActions: mergeArray(
      "quick-actions",
      parsed.values.quickActions,
      allowPreviousFallback ? previousDraft?.quickActions : undefined,
      baseDraft.quickActions,
      sectionStates,
      allowPreviousFallback,
    ),
    racialTraits: mergeArray(
      "traits",
      parsed.values.racialTraits,
      allowPreviousFallback ? previousDraft?.racialTraits : undefined,
      baseDraft.racialTraits,
      sectionStates,
      allowPreviousFallback,
    ),
    classTraits: mergeArray(
      "traits",
      parsed.values.classTraits,
      allowPreviousFallback ? previousDraft?.classTraits : undefined,
      baseDraft.classTraits,
      sectionStates,
      allowPreviousFallback,
    ),
    feats: mergeArray(
      "traits",
      parsed.values.feats,
      allowPreviousFallback ? previousDraft?.feats : undefined,
      baseDraft.feats,
      sectionStates,
      allowPreviousFallback,
    ),
    equippedItems: mergeArray(
      "equipment",
      parsed.values.equippedItems,
      allowPreviousFallback ? previousDraft?.equippedItems : undefined,
      baseDraft.equippedItems,
      sectionStates,
      allowPreviousFallback,
    ),
    carriedItems: mergeArray(
      "equipment",
      parsed.values.carriedItems,
      allowPreviousFallback ? previousDraft?.carriedItems : undefined,
      baseDraft.carriedItems,
      sectionStates,
      allowPreviousFallback,
    ),
    otherPossessions: mergeArray(
      "equipment",
      parsed.values.otherPossessions,
      allowPreviousFallback ? previousDraft?.otherPossessions : undefined,
      baseDraft.otherPossessions,
      sectionStates,
      allowPreviousFallback,
    ),
    spellcasting: mergeArray(
      "spells",
      parsed.values.spellcasting,
      allowPreviousFallback ? previousDraft?.spellcasting : undefined,
      baseDraft.spellcasting,
      sectionStates,
      allowPreviousFallback,
    ),
    companions: mergeArray(
      "companions",
      parsed.values.companions,
      allowPreviousFallback ? previousDraft?.companions : undefined,
      baseDraft.companions,
      sectionStates,
      allowPreviousFallback,
    ),
    notes: mergeArray(
      "notes",
      parsed.values.notes,
      allowPreviousFallback ? previousDraft?.notes : undefined,
      baseDraft.notes,
      sectionStates,
      allowPreviousFallback,
    ),
    importIssues: [],
  };

  hydrateAbilitySavingThrowMetadata(nextDraft);
  sanitizeImportedDraft(nextDraft, sourceUrl);

  const diagnostics = buildDiagnostics(nextDraft, parsed, sectionStates);
  const rawImportData = buildRawImportData(sourceUrl, parsed, diagnostics);

  nextDraft.sourceMetadata = {
    ...nextDraft.sourceMetadata,
    importedAt: rawImportData.capturedAt,
    syncStatus:
      diagnostics.state === "real"
        ? "imported"
        : diagnostics.state === "mock"
          ? "mock"
          : "partial",
  };
  nextDraft.importDiagnostics = diagnostics;
  nextDraft.importIssues = mergeIssues(parsed.issues, diagnostics, previousDraft);
  nextDraft.rawImportData = rawImportData;

  return nextDraft;
}

function buildDiagnostics(
  draft: ImportedCharacterDraft,
  parsed: ParsedHtmlResult,
  sectionStates: Partial<Record<ImportSectionKey, SectionState>>,
): CharacterImportDiagnostics {
  const importedFields = Array.from(new Set(parsed.parsedFields)).sort();
  const detectedSections = Array.from(new Set(parsed.detectedSections));
  const sectionDiagnostics: CharacterImportSectionDiagnostic[] = sectionDefinitions.map(
    (section) => {
      const state = sectionStates[section.key] ?? "missing";
      const missingFields = section.expectedFields.filter(
        (field) => !importedFields.includes(field),
      );
      const importedSectionFields = importedFields.filter((field) =>
        section.expectedFields.includes(field),
      );

      return {
        key: section.key,
        label: section.label,
        status:
          state === "real"
            ? importedSectionFields.length === section.expectedFields.length
              ? "real"
              : "partial"
            : state === "mock"
              ? "mock"
              : "missing",
        importedCount: countSectionItems(section.key, draft),
        expectedCount: section.expectedFields.length,
        importedFields: importedSectionFields,
        missingFields,
        notes:
          state === "mock"
            ? "Mostrando fallback o preview previa porque el HTML actual no entrego esta seccion."
            : state === "missing"
              ? "No detectada en el HTML inicial disponible."
              : undefined,
      };
    },
  );

  const notes: string[] = [];

  if (isWelcomePage(parsed.text, parsed.title)) {
    notes.push(
      "Nivel20 devolvio una vista generica o portada. No aparecio una ficha publica completa en el HTML inicial.",
    );
  }

  const hasMockSections = sectionDiagnostics.some((section) => section.status === "mock");
  const hasRealFields = importedFields.length > 0;

  const state: CharacterImportDiagnostics["state"] = hasRealFields
    ? sectionDiagnostics.some((section) => section.status !== "real")
      ? "partial"
      : "real"
    : hasMockSections
      ? "mock"
      : "partial";

  return {
    state,
    source: "nivel20",
    sectionsDetected: detectedSections.length,
    importedFieldCount: importedFields.length,
    detectedSections,
    importedFields,
    missingFields: sectionDiagnostics.flatMap((section) => section.missingFields),
    sectionDiagnostics,
    notes,
  };
}

function buildRawImportData(
  sourceUrl: string,
  parsed: ParsedHtmlResult,
  diagnostics: CharacterImportDiagnostics,
): CharacterImportRawSnapshot {
  return {
    source: "nivel20",
    format: "html",
    capturedAt: new Date().toISOString(),
    sourceUrl,
    title: parsed.title,
    sections: parsed.sections,
    detectedSections: diagnostics.detectedSections,
    parsedFields: diagnostics.importedFields,
    missingFields: diagnostics.missingFields,
    metadata: {
      finalUrl: parsed.finalUrl,
      statusCode: String(parsed.statusCode),
      contentType: parsed.contentType,
      importState: diagnostics.state,
      credentialsUsed: "false",
      fetchMode: "server-side-html",
    },
    textSnapshot: limitText(parsed.text, 4000),
    htmlSnapshot: limitText(parsed.html, 4000),
    payload: {
      parsedFields: diagnostics.importedFields,
      missingFields: diagnostics.missingFields,
      issues: parsed.issues,
    },
  };
}

function mergeIssues(
  parsedIssues: CharacterImportIssue[],
  diagnostics: CharacterImportDiagnostics,
  previousDraft?: ImportedCharacterDraft | null,
) {
  const issues = [...parsedIssues];

  if (diagnostics.state === "mock") {
    issues.push({
      code: "mock-fallback-visible",
      message:
        "La ficha muestra datos mock o fallback previos porque la captura real actual no expuso suficientes campos.",
      severity: "warning",
    });
  }

  if (!diagnostics.importedFieldCount) {
    issues.push({
      code: "no-real-fields-detected",
      message:
        "No se detectaron campos fiables de personaje en el HTML inicial devuelto por Nivel20.",
      severity: "warning",
    });
  }

  if (previousDraft && diagnostics.state !== "real") {
    issues.push({
      code: "previous-import-preserved",
      message:
        "Se conservaron datos previos para no vaciar la ficha mientras la importacion real sigue siendo parcial.",
      severity: "info",
    });
  }

  return issues;
}

function createMockPreviewDraft(sourceUrl: string): ImportedCharacterDraft {
  const spellSlots: CharacterSpellSlotLevel[] = [{ level: 1, current: 2, maximum: 2 }];

  const draft = createEmptyImportedDraft({
    sourceUrl,
    fallbackName: "Manuel Dario",
  });

  draft.identity.species = "Humano alternativo";
  draft.classes = [
    {
      id: "preview-bard-1",
      name: "Bardo",
      level: 1,
      hitDie: "1d8",
      spellcastingAbility: "charisma",
    },
  ];
  draft.totalLevel = 1;
  draft.background = "Artista itinerante";
  draft.backgroundDetails = {
    name: "Artista itinerante",
    feature: "Contacto en tabernas y teatros",
    personalityTraits: ["Locuaz", "Curioso"],
    notes: "Preview tecnica para la pantalla experimental.",
  };
  draft.alignment = "Caotico bueno";
  draft.history = "Preview mock. No proviene de un fetch real a Nivel20.";
  draft.languages = ["Comun", "Elfico"];
  draft.abilityScores = {
    strength: { key: "strength", label: "FUE", score: 11, modifier: 0 },
    dexterity: {
      key: "dexterity",
      label: "DES",
      score: 18,
      modifier: 4,
      savingThrowModifier: 6,
      savingThrowProficient: true,
    },
    constitution: { key: "constitution", label: "CON", score: 14, modifier: 2 },
    intelligence: { key: "intelligence", label: "INT", score: 14, modifier: 2 },
    wisdom: { key: "wisdom", label: "SAB", score: 12, modifier: 1 },
    charisma: {
      key: "charisma",
      label: "CAR",
      score: 14,
      modifier: 2,
      savingThrowModifier: 4,
      savingThrowProficient: true,
    },
  };
  draft.hitPoints = { current: 10, maximum: 10, hitDice: "1d8" };
  draft.armor = {
    armorClass: 16,
    initiative: 4,
    speed: "30 ft.",
    notes: "Valor mock/fallback para la vista experimental.",
  };
  draft.initiative = 4;
  draft.speed = "30 ft.";
  draft.proficiencyBonus = 2;
  draft.savingThrows = [
    { ability: "dexterity", proficient: true, modifier: 6 },
    { ability: "charisma", proficient: true, modifier: 4 },
  ];
  draft.skills = [
    { key: "acrobatics", label: "Acrobacias", linkedAbility: "dexterity", modifier: 6, proficient: true },
    { key: "performance", label: "Interpretacion", linkedAbility: "charisma", modifier: 4, proficient: true },
    { key: "persuasion", label: "Persuasion", linkedAbility: "charisma", modifier: 4, proficient: true },
  ];
  draft.attacks = [
    {
      id: "preview-crossbow",
      name: "Ballesta de mano",
      attackBonus: 6,
      damage: "1d6+4",
      damageType: "perforante",
      ability: "dexterity",
      equipped: true,
      notes: "Mock/fallback",
    },
    {
      id: "preview-rapier",
      name: "Estoque",
      attackBonus: 2,
      damage: "1d8",
      damageType: "perforante",
      ability: "strength",
      equipped: true,
      notes: "Mock/fallback",
    },
  ];
  draft.proficiencies = [
    { id: "lang-common", label: "Comun", category: "language", level: "proficient", source: "Preview" },
    { id: "lang-elvish", label: "Elfico", category: "language", level: "proficient", source: "Preview" },
  ];
  draft.racialTraits = [
    { id: "variant-human", name: "Humano alternativo", kind: "racial", source: "Preview", description: "Mock/fallback" },
  ];
  draft.classTraits = [
    { id: "bardic-inspiration", name: "Inspiracion bardica", kind: "class", source: "Preview", description: "Mock/fallback" },
    { id: "spellcasting", name: "Lanzamiento de conjuros", kind: "class", source: "Preview", description: "Mock/fallback" },
  ];
  draft.feats = [
    { id: "crossbow-expert", name: "Experto en ballestas", source: "Preview", description: "Mock/fallback" },
  ];
  draft.equippedItems = [
    { id: "preview-armor", name: "Armadura ligera", category: "armor", carryingState: "equipped", quantity: 1 },
  ];
  draft.carriedItems = [
    { id: "preview-lute", name: "Laud", category: "tool", carryingState: "carried", quantity: 1 },
  ];
  draft.spellcasting = [
    {
      id: "preview-spellcasting",
      source: "Preview tecnica",
      ability: "charisma",
      spellSaveDc: 12,
      spellAttackBonus: 4,
      cantripsKnown: 2,
      spellsKnown: 4,
      slots: spellSlots,
      spells: [
        { id: "vicious-mockery", name: "Burla cruel", level: 0, known: true, description: "Mock/fallback" },
        { id: "healing-word", name: "Palabra curativa", level: 1, known: true, description: "Mock/fallback" },
      ],
      notes: "Preview mock/fallback para la pantalla experimental.",
    },
  ];
  draft.quickActions = [
    {
      id: "preview-bonus-action",
      name: "Accion de apoyo",
      kind: "bonus-action",
      description: "Mock/fallback",
      source: "Preview",
    },
  ];
  draft.notes = [
    {
      id: "preview-note",
      title: "Preview mock",
      content: "Estos datos no fueron parseados desde Nivel20. Se muestran solo como preview de estructura.",
      kind: "gm",
    },
  ];

  const diagnostics: CharacterImportDiagnostics = {
    state: "mock",
    source: "nivel20",
    sectionsDetected: 9,
    importedFieldCount: 0,
    detectedSections: [
      "identity",
      "ability-scores",
      "combat",
      "saving-throws",
      "skills",
      "attacks",
      "background",
      "traits",
      "spells",
    ],
    importedFields: [],
    missingFields: sectionDefinitions.flatMap((section) => section.expectedFields),
    sectionDiagnostics: sectionDefinitions.map((section) => ({
      key: section.key,
      label: section.label,
      status: section.key === "companions" ? "missing" : "mock",
      importedCount: countSectionItems(section.key, draft),
      expectedCount: section.expectedFields.length,
      importedFields: [],
      missingFields: section.expectedFields,
      notes:
        section.key === "companions"
          ? "La preview no incluye companeros."
          : "Preview mock/fallback. No proviene de HTML real.",
    })),
    notes: ["La pantalla experimental sigue usando una preview mock."],
  };

  draft.sourceMetadata.syncStatus = "mock";
  hydrateAbilitySavingThrowMetadata(draft);
  draft.importDiagnostics = diagnostics;
  draft.importIssues = [
    {
      code: "mock-preview",
      message: "Preview mock para estructura visual. No hay fetch real en este formulario.",
      severity: "info",
    },
  ];
  draft.rawImportData = {
    source: "nivel20",
    format: "html",
    capturedAt: new Date().toISOString(),
    sourceUrl,
    title: "Preview mock de Nivel20",
    detectedSections: diagnostics.detectedSections,
    parsedFields: [],
    missingFields: diagnostics.missingFields,
    metadata: {
      importState: "mock",
      fetchMode: "preview-only",
      credentialsUsed: "false",
    },
    sections: {
      preview: "Vista previa mock/fallback de la estructura de importacion.",
    },
    textSnapshot: "Preview mock/fallback. Sin HTML real.",
    htmlSnapshot: "<!-- preview-only -->",
  };

  return draft;
}

function createEmptyImportedDraft({
  sourceUrl,
  fallbackName,
  fallbackPlayerName,
}: {
  sourceUrl: string;
  fallbackName?: string;
  fallbackPlayerName?: string | null;
}): ImportedCharacterDraft {
  const normalizedFallbackName = fallbackName?.trim();

  return {
    identity: {
      name: normalizedFallbackName?.length
        ? sanitizeCharacterName(normalizedFallbackName, sourceUrl)
        : humanizeSlugFromUrl(sourceUrl) || "Ficha de Nivel20",
      playerName: fallbackPlayerName ?? undefined,
    },
    sourceMetadata: {
      source: "nivel20",
      sourceLabel: "Nivel20",
      sourceUrl,
      visibility: "shared",
      syncStatus: "partial",
    },
    system: {
      systemId: "dnd5e",
    },
    classes: [],
    totalLevel: 0,
    languages: [],
    abilityScores: createEmptyAbilityScores(),
    hitPoints: {
      current: 0,
      maximum: 0,
    },
    armor: {
      armorClass: 0,
      speed: "No detectada",
    },
    initiative: 0,
    speed: "No detectada",
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
    notes: [],
    importIssues: [],
  };
}

export function sanitizeImportedDraft(draft: ImportedCharacterDraft, sourceUrl: string) {
  const fallbackName = humanizeSlugFromUrl(sourceUrl);
  const suspiciousMarkers = [
    "trasfondos",
    "libros de reglas",
    "bestiario",
    "estados de personajes",
    "acciones informacion",
    "resumen de tus ataques",
    "companeros acciones",
    "informacion trasfondo",
    "informacion informacion",
    "categor-a",
    "ballestas",
    "recarga",
  ];

  draft.identity.name = sanitizeCharacterName(draft.identity.name, sourceUrl);

  if (isSuspiciousText(draft.identity.name, suspiciousMarkers, 80)) {
    draft.identity.name = fallbackName;
  }

  if (isSuspiciousText(draft.identity.species, suspiciousMarkers, 60)) {
    draft.identity.species = undefined;
  }

  if (isSuspiciousText(draft.background, suspiciousMarkers, 80)) {
    draft.background = undefined;
  }

  if (isSuspiciousText(draft.alignment, suspiciousMarkers, 40)) {
    draft.alignment = undefined;
  }

  if (isSuspiciousText(draft.history, suspiciousMarkers, 160)) {
    draft.history = undefined;
  }

  if (draft.backgroundDetails) {
    if (isSuspiciousText(draft.backgroundDetails.feature, suspiciousMarkers, 120)) {
      draft.backgroundDetails.feature = undefined;
    }
    if (isSuspiciousText(draft.backgroundDetails.age, suspiciousMarkers, 60)) {
      draft.backgroundDetails.age = undefined;
    }
    if (isSuspiciousText(draft.backgroundDetails.history, suspiciousMarkers, 160)) {
      draft.backgroundDetails.history = undefined;
    }
    draft.backgroundDetails.personalityTraits = draft.backgroundDetails.personalityTraits?.filter(
      (entry) => !isSuspiciousText(entry, suspiciousMarkers, 80),
    );
    draft.backgroundDetails.ideals = draft.backgroundDetails.ideals?.filter(
      (entry) => !isSuspiciousText(entry, suspiciousMarkers, 80),
    );
    draft.backgroundDetails.bonds = draft.backgroundDetails.bonds?.filter(
      (entry) => !isSuspiciousText(entry, suspiciousMarkers, 80),
    );
    draft.backgroundDetails.flaws = draft.backgroundDetails.flaws?.filter(
      (entry) => !isSuspiciousText(entry, suspiciousMarkers, 80),
    );
  }

  if (isSuspiciousText(draft.speed, suspiciousMarkers, 32) || hasRepeatedSpeedNoise(draft.speed)) {
    draft.speed = "No detectada";
  }
  if (
    isSuspiciousText(draft.armor.speed, suspiciousMarkers, 32) ||
    hasRepeatedSpeedNoise(draft.armor.speed)
  ) {
    draft.armor.speed = draft.speed;
  }

  draft.proficiencies = draft.proficiencies.filter(
    (entry) =>
      !isSuspiciousText(entry.label, suspiciousMarkers, 40) &&
      !/categor/i.test(entry.label) &&
      !/ballesta de mano/i.test(entry.label) &&
      !/^[a-z]+\s+[A-Z]/.test(entry.label),
  );
  draft.attacks = draft.attacks.filter(
    (entry) =>
      !isSuspiciousText(entry.name, suspiciousMarkers, 40) &&
      !/^(o|y)\s+/i.test(entry.name) &&
      !/^(perforante|cortante|contundente|veneno|fuego)\b/i.test(entry.name),
  );
  draft.spellcasting = draft.spellcasting.filter((entry) => {
    const notesAreSuspicious = isSuspiciousText(entry.notes, suspiciousMarkers, 160);
    return !notesAreSuspicious;
  });
}

function createEmptyAbilityScores(): CharacterAbilityScores {
  return {
    strength: { key: "strength", label: "FUE", score: 0 },
    dexterity: { key: "dexterity", label: "DES", score: 0 },
    constitution: { key: "constitution", label: "CON", score: 0 },
    intelligence: { key: "intelligence", label: "INT", score: 0 },
    wisdom: { key: "wisdom", label: "SAB", score: 0 },
    charisma: { key: "charisma", label: "CAR", score: 0 },
  };
}

function createRawSnapshotFromDraft(draft: ImportedCharacterDraft): Nivel20RawCharacterSnapshot {
  return {
    sourceUrl: draft.sourceMetadata.sourceUrl ?? "",
    capturedAt: draft.rawImportData?.capturedAt ?? new Date().toISOString(),
    title: draft.rawImportData?.title,
    metadata: draft.rawImportData?.metadata,
    sections: draft.rawImportData?.sections,
    rawImportData: draft.rawImportData,
  };
}

function buildTrainerCandidates(
  parsed: ParsedHtmlResult,
  draft: ImportedCharacterDraft,
): Nivel20TrainerCandidate[] {
  const candidates: Nivel20TrainerCandidate[] = [];

  const pushCandidate = ({
    id,
    sectionKey,
    originalText,
    detectedValue,
    suggestedField,
    confidence,
    selectorHint,
  }: {
    id: string;
    sectionKey: string;
    originalText: string;
    detectedValue: string;
    suggestedField?: Nivel20CandidateField;
    confidence: "low" | "medium" | "high";
    selectorHint?: string;
  }) => {
    if (!detectedValue.trim()) {
      return;
    }

    candidates.push({
      id,
      sectionKey,
      matcherKey: buildCandidateMatcherKey(sectionKey, selectorHint, suggestedField, detectedValue),
      originalText,
      detectedValue,
      suggestedField,
      confidence,
      selectorHint,
    });
  };

  if (draft.identity.name) {
    pushCandidate({
      id: "identity-name",
      sectionKey: "identity",
      originalText: parsed.sections.identity ?? draft.identity.name,
      detectedValue: draft.identity.name,
      suggestedField: "name",
      confidence: "high",
      selectorHint: "text-match:nombre",
    });
  }
  if (draft.identity.species) {
    pushCandidate({
      id: "identity-species",
      sectionKey: "identity",
      originalText: parsed.sections.identity ?? draft.identity.species,
      detectedValue: draft.identity.species,
      suggestedField: "species",
      confidence: "medium",
      selectorHint: "text-match:raza|especie",
    });
  }
  if (draft.classes[0]) {
    pushCandidate({
      id: "identity-class",
      sectionKey: "identity",
      originalText: parsed.sections.identity ?? draft.classes[0].name,
      detectedValue: draft.classes[0].name,
      suggestedField: "class",
      confidence: "high",
      selectorHint: "text-match:clase",
    });
    pushCandidate({
      id: "identity-level",
      sectionKey: "identity",
      originalText: parsed.sections.identity ?? String(draft.totalLevel),
      detectedValue: String(draft.totalLevel),
      suggestedField: "level",
      confidence: "high",
      selectorHint: "text-match:nivel",
    });
  }

  for (const [abilityKey, ability] of Object.entries(draft.abilityScores)) {
    if (ability.score) {
      pushCandidate({
        id: `ability-${abilityKey}-score`,
        sectionKey: "ability-scores",
        originalText: parsed.sections["ability-scores"] ?? `${ability.label} ${ability.score}`,
        detectedValue: String(ability.score),
        suggestedField: `abilityScores.${abilityKey}.score` as Nivel20CandidateField,
        confidence: "high",
        selectorHint: `text-match:${ability.label.toLowerCase()}:score`,
      });
    }

    if (ability.modifier !== undefined) {
      pushCandidate({
        id: `ability-${abilityKey}-modifier`,
        sectionKey: "ability-scores",
        originalText:
          parsed.sections["ability-scores"] ??
          `${ability.label} ${formatSignedValue(ability.modifier)}`,
        detectedValue: formatSignedValue(ability.modifier),
        suggestedField: `abilityScores.${abilityKey}.modifier` as Nivel20CandidateField,
        confidence: "high",
        selectorHint: `text-match:${ability.label.toLowerCase()}:modifier`,
      });
    }

    if (ability.savingThrowModifier !== undefined) {
      pushCandidate({
        id: `ability-${abilityKey}-save-modifier`,
        sectionKey: "saving-throws",
        originalText:
          parsed.sections["saving-throws"] ??
          `${ability.label} ${formatSignedValue(ability.savingThrowModifier)}`,
        detectedValue: formatSignedValue(ability.savingThrowModifier),
        suggestedField: `abilityScores.${abilityKey}.savingThrowModifier` as Nivel20CandidateField,
        confidence: "medium",
        selectorHint: `text-match:${ability.label.toLowerCase()}:save-modifier`,
      });
    }

    if (ability.savingThrowProficient !== undefined) {
      pushCandidate({
        id: `ability-${abilityKey}-save-proficient`,
        sectionKey: "saving-throws",
        originalText: parsed.sections["saving-throws"] ?? `${ability.label} competente`,
        detectedValue: ability.savingThrowProficient ? "competente" : "no",
        suggestedField: `abilityScores.${abilityKey}.savingThrowProficient` as Nivel20CandidateField,
        confidence: "medium",
        selectorHint: `text-match:${ability.label.toLowerCase()}:save-proficient`,
      });
    }
  }

  if (draft.hitPoints.maximum) {
    pushCandidate({
      id: "combat-hitpoints-max",
      sectionKey: "combat",
      originalText: parsed.sections.combat ?? `PG ${draft.hitPoints.maximum}`,
      detectedValue: String(draft.hitPoints.maximum),
      suggestedField: "hitPoints.max",
      confidence: "high",
      selectorHint: "text-match:pg",
    });
  }
  if (draft.armor.armorClass) {
    pushCandidate({
      id: "combat-armor-class",
      sectionKey: "combat",
      originalText: parsed.sections.combat ?? `CA ${draft.armor.armorClass}`,
      detectedValue: String(draft.armor.armorClass),
      suggestedField: "armorClass.value",
      confidence: "high",
      selectorHint: "text-match:ca",
    });
  }
  if (draft.initiative !== undefined && draft.initiative !== 0) {
    pushCandidate({
      id: "combat-initiative",
      sectionKey: "combat",
      originalText: parsed.sections.combat ?? `Iniciativa ${draft.initiative}`,
      detectedValue: String(draft.initiative),
      suggestedField: "initiative.value",
      confidence: "high",
      selectorHint: "text-match:iniciativa",
    });
  }
  if (draft.speed && draft.speed !== "No detectada") {
    pushCandidate({
      id: "combat-speed",
      sectionKey: "combat",
      originalText: parsed.sections.combat ?? draft.speed,
      detectedValue: draft.speed,
      suggestedField: "speed.walk",
      confidence: "medium",
      selectorHint: "text-match:velocidad",
    });
  }
  if (draft.proficiencyBonus !== undefined) {
    pushCandidate({
      id: "combat-proficiency-bonus",
      sectionKey: "combat",
      originalText: parsed.sections.combat ?? String(draft.proficiencyBonus),
      detectedValue: String(draft.proficiencyBonus),
      suggestedField: "proficiencyBonus",
      confidence: "medium",
      selectorHint: "text-match:competencia",
    });
  }

  buildArrayCandidates(parsed, draft.skills.map((skill) => skill.label), "skills", "skills[]", candidates);
  buildArrayCandidates(
    parsed,
    draft.savingThrows.map((savingThrow) => `${savingThrow.ability}:${savingThrow.modifier ?? 0}`),
    "saving-throws",
    "savingThrows[]",
    candidates,
  );
  buildArrayCandidates(parsed, draft.attacks.map((attack) => attack.name), "attacks", "attacks[]", candidates);
  buildArrayCandidates(
    parsed,
    draft.spellcasting.flatMap((entry) => entry.spells.map((spell) => spell.name)),
    "spells",
    "spells[]",
    candidates,
  );
  buildArrayCandidates(
    parsed,
    [
      ...draft.equippedItems.map((item) => item.name),
      ...draft.carriedItems.map((item) => item.name),
      ...draft.otherPossessions.map((item) => item.name),
    ],
    "equipment",
    "equipment[]",
    candidates,
  );
  buildArrayCandidates(
    parsed,
    draft.classTraits.map((trait) => trait.name),
    "traits",
    "traits[]",
    candidates,
  );
  buildArrayCandidates(parsed, draft.feats.map((feat) => feat.name), "traits", "feats[]", candidates);
  buildArrayCandidates(
    parsed,
    draft.quickActions.map((action) => action.name),
    "quick-actions",
    "actions[]",
    candidates,
  );
  buildArrayCandidates(
    parsed,
    draft.resources.map((resource) => resource.label),
    "quick-actions",
    "resources[]",
    candidates,
  );
  buildArrayCandidates(
    parsed,
    draft.companions.map((companion) => companion.name),
    "companions",
    "companions[]",
    candidates,
  );
  buildArrayCandidates(
    parsed,
    draft.notes.map((note) => note.title),
    "notes",
    "notes[]",
    candidates,
  );

  if (draft.background) {
    pushCandidate({
      id: "background-name",
      sectionKey: "background",
      originalText: parsed.sections.background ?? draft.background,
      detectedValue: draft.background,
      suggestedField: "background.*",
      confidence: "medium",
      selectorHint: "text-match:trasfondo",
    });
  }
  if (draft.alignment) {
    pushCandidate({
      id: "background-alignment",
      sectionKey: "background",
      originalText: parsed.sections.background ?? draft.alignment,
      detectedValue: draft.alignment,
      suggestedField: "background.alignment",
      confidence: "medium",
      selectorHint: "text-match:alineamiento",
    });
  }
  if (draft.history) {
    pushCandidate({
      id: "background-history",
      sectionKey: "background",
      originalText: parsed.sections.background ?? draft.history,
      detectedValue: draft.history,
      suggestedField: "background.history",
      confidence: "low",
      selectorHint: "text-match:historia",
    });
  }
  if (draft.backgroundDetails?.feature) {
    pushCandidate({
      id: "background-feature",
      sectionKey: "background",
      originalText: parsed.sections.background ?? draft.backgroundDetails.feature,
      detectedValue: draft.backgroundDetails.feature,
      suggestedField: "background.feature",
      confidence: "low",
      selectorHint: "text-match:rasgo",
    });
  }

  for (const section of sectionDefinitions) {
    if (!parsed.sections[section.key]) {
      continue;
    }

    pushCandidate({
      id: `section-snippet-${section.key}`,
      sectionKey: section.key,
      originalText: parsed.sections[section.key],
      detectedValue: parsed.sections[section.key],
      suggestedField: guessFallbackField(section.key),
      confidence: "low",
      selectorHint: `section:${section.key}`,
    });
  }

  return dedupeById(candidates, (candidate) => candidate.id);
}

function buildArrayCandidates(
  parsed: ParsedHtmlResult,
  values: string[],
  sectionKey: ImportSectionKey,
  suggestedField: Nivel20CandidateField,
  candidates: Nivel20TrainerCandidate[],
) {
  values.forEach((value, index) => {
    if (!value) {
      return;
    }

    candidates.push({
      id: `${sectionKey}-${slugify(value)}-${index}`,
      sectionKey,
      matcherKey: buildCandidateMatcherKey(
        sectionKey,
        `section:${sectionKey}`,
        suggestedField,
        value,
      ),
      originalText: parsed.sections[sectionKey] ?? value,
      detectedValue: value,
      suggestedField,
      confidence: "medium",
      selectorHint: `section:${sectionKey}`,
    });
  });
}

function guessFallbackField(sectionKey: ImportSectionKey): Nivel20CandidateField {
  switch (sectionKey) {
    case "background":
      return "background.*";
    case "quick-actions":
      return "actions[]";
    case "companions":
      return "companions[]";
    case "spells":
      return "spells[]";
    case "equipment":
      return "equipment[]";
    case "traits":
      return "traits[]";
    case "notes":
      return "notes[]";
    case "attacks":
      return "attacks[]";
    case "skills":
      return "skills[]";
    case "saving-throws":
      return "savingThrows[]";
    default:
      return "notes[]";
  }
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

function createParsedSectionsFromDiagnostics(
  diagnostics?: CharacterImportDiagnostics,
): Nivel20ParsedSection[] {
  if (!diagnostics) {
    return [];
  }

  return diagnostics.sectionDiagnostics.map((section) => ({
    key: mapSectionKey(section.key),
    label: section.label,
    status: section.status,
    itemCount: section.importedCount,
    notes: section.notes,
  }));
}

function mapSectionKey(key: string): Nivel20ParsedSection["key"] {
  switch (key) {
    case "ability-scores":
    case "skills":
    case "saving-throws":
    case "attacks":
    case "background":
      return key;
    case "traits":
    case "proficiencies":
      return "traits";
    case "equipment":
      return "equipment";
    case "spells":
      return "spells";
    case "quick-actions":
      return "quick-actions";
    case "identity":
    case "combat":
    case "companions":
    case "notes":
    default:
      return "background";
  }
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&aacute;/gi, "a")
    .replace(/&eacute;/gi, "e")
    .replace(/&iacute;/gi, "i")
    .replace(/&oacute;/gi, "o")
    .replace(/&uacute;/gi, "u")
    .replace(/&ntilde;/gi, "n");
}

function normalizeForInspection(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseIdentity(text: string, title: string | undefined, parsedFields: string[]) {
  const name =
    parseLabeledText(text, ["nombre"], parsedFields, "identity.name") ??
    (title && !title.toLowerCase().includes("nivel20") ? title : undefined);
  const species = parseLabeledText(
    text,
    ["raza", "especie", "linaje"],
    parsedFields,
    "identity.species",
  );

  if (!name && !species) {
    return undefined;
  }

  return {
    name: name ?? "Ficha importada",
    species,
  };
}

function parseClassSummary(text: string, parsedFields: string[]) {
  const classMatch = text.match(
    /\b(artifice|barbaro|bardo|brujo|clerigo|druida|explorador|guerrero|hechicero|mago|monje|paladin|picaro)\b[^\d]{0,20}nivel\s*(\d{1,2})/i,
  );

  if (!classMatch) {
    return [];
  }

  parsedFields.push("classes", "totalLevel");

  return [
    {
      id: `nivel20-class-${slugify(classMatch[1])}`,
      name: capitalize(classMatch[1]),
      level: Number(classMatch[2]),
    },
  ];
}

function parseAbilityScores(text: string, parsedFields: string[]) {
  const abilities = createEmptyAbilityScores();
  let matchCount = 0;

  for (const [label, key] of Object.entries(abilityLabelMap)) {
    const match = text.match(new RegExp(`\\b${label}\\b\\s*[:\\-]?\\s*(\\d{1,2})(?:\\s*\\(?([+-]\\d{1,2})\\)?)?`, "i"));

    if (!match) {
      continue;
    }

    matchCount += 1;
    abilities[key] = {
      key,
      label,
      score: Number(match[1]),
      modifier: match[2] ? Number(match[2]) : undefined,
    };
    parsedFields.push(`abilityScores.${key}.score`);
    if (match[2]) {
      parsedFields.push(`abilityScores.${key}.modifier`);
    }
  }

  return matchCount ? abilities : undefined;
}

function parseHitPoints(text: string, parsedFields: string[]) {
  const match = text.match(/\bPG\b\s*[:\-]?\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?/i);

  if (!match) {
    return undefined;
  }

  parsedFields.push("hitPoints");

  return {
    current: Number(match[1]),
    maximum: Number(match[2] ?? match[1]),
  };
}

function parseArmorClass(text: string, parsedFields: string[]) {
  const match = text.match(/\bCA\b\s*[:\-]?\s*(\d{1,2})/i);

  if (!match) {
    return undefined;
  }

  parsedFields.push("armor.armorClass");
  return Number(match[1]);
}

function parseSignedNumberField(
  text: string,
  labels: string[],
  fieldName: string,
  parsedFields: string[],
) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegex(label)}\\s*[:\\-]?\\s*([+-]?\\d{1,2})`, "i"));

    if (match) {
      parsedFields.push(fieldName);
      return Number(match[1]);
    }
  }

  return undefined;
}

function parseTextField(
  text: string,
  labels: string[],
  parsedFields: string[],
  fieldName: string,
) {
  for (const label of labels) {
    const match = text.match(
      new RegExp(`${escapeRegex(label)}\\s*[:\\-]?\\s*([\\w\\d+\\-.,/ ]{2,40})`, "i"),
    );

    if (match) {
      parsedFields.push(fieldName);
      return match[1].trim();
    }
  }

  return undefined;
}

function parseLabeledText(
  text: string,
  labels: string[],
  parsedFields: string[],
  fieldName: string,
) {
  for (const label of labels) {
    const match = text.match(
      new RegExp(`${escapeRegex(label)}\\s*[:\\-]?\\s*([^|.]{2,120})`, "i"),
    );

    if (match) {
      parsedFields.push(fieldName);
      return match[1].trim();
    }
  }

  return undefined;
}

function parseCommaSeparatedList(
  text: string,
  labels: string[],
  parsedFields: string[],
  fieldName: string,
) {
  const rawValue = parseLabeledText(text, labels, parsedFields, fieldName);

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseBackgroundDetails(text: string, parsedFields: string[]) {
  const details: CharacterBackgroundDetails = {};

  const feature = parseLabeledText(
    text,
    ["rasgo", "feature de trasfondo"],
    parsedFields,
    "backgroundDetails.feature",
  );
  const personalityTraits = parseCommaSeparatedList(
    text,
    ["personalidad", "rasgos de personalidad"],
    parsedFields,
    "backgroundDetails.personalityTraits",
  );
  const ideals = parseCommaSeparatedList(
    text,
    ["ideales"],
    parsedFields,
    "backgroundDetails.ideals",
  );
  const bonds = parseCommaSeparatedList(
    text,
    ["vinculos", "lazos"],
    parsedFields,
    "backgroundDetails.bonds",
  );
  const flaws = parseCommaSeparatedList(
    text,
    ["defectos"],
    parsedFields,
    "backgroundDetails.flaws",
  );
  const age = parseLabeledText(text, ["edad"], parsedFields, "backgroundDetails.age");

  if (feature) {
    details.feature = feature;
  }
  if (personalityTraits.length) {
    details.personalityTraits = personalityTraits;
  }
  if (ideals.length) {
    details.ideals = ideals;
  }
  if (bonds.length) {
    details.bonds = bonds;
  }
  if (flaws.length) {
    details.flaws = flaws;
  }
  if (age) {
    details.age = age;
  }

  return Object.keys(details).length ? details : undefined;
}

function parseSkills(text: string, parsedFields: string[]) {
  const skills: CharacterSkill[] = [];

  for (const definition of skillDefinitions) {
    const match = text.match(
      new RegExp(`${escapeRegex(definition.label)}\\s*[:\\-]?\\s*([+-]?\\d{1,2})`, "i"),
    );

    if (!match) {
      continue;
    }

    skills.push({
      key: definition.key,
      label: definition.label,
      linkedAbility: definition.linkedAbility,
      modifier: Number(match[1]),
      proficient: true,
      source: "Nivel20 HTML",
    });
    parsedFields.push("skills");
  }

  return dedupeById(skills, (skill) => skill.key);
}

function parseSavingThrows(text: string, parsedFields: string[]) {
  const results: ImportedCharacterDraft["savingThrows"] = [];

  for (const [label, key] of Object.entries(abilityLabelMap)) {
    const match = text.match(
      new RegExp(`${label}\\s*(?:salvacion|save)?\\s*[:\\-]?\\s*([+-]?\\d{1,2})`, "i"),
    );

    if (!match) {
      continue;
    }

    results.push({
      ability: key,
      proficient: true,
      modifier: Number(match[1]),
      source: "Nivel20 HTML",
    });
    parsedFields.push("savingThrows");
    parsedFields.push(`abilityScores.${key}.savingThrowModifier`);
    parsedFields.push(`abilityScores.${key}.savingThrowProficient`);
  }

  return results;
}

function hydrateAbilitySavingThrowMetadata(draft: ImportedCharacterDraft) {
  for (const savingThrow of draft.savingThrows) {
    const ability = draft.abilityScores[savingThrow.ability];

    if (!ability) {
      continue;
    }

    if (savingThrow.modifier !== undefined) {
      ability.savingThrowModifier = savingThrow.modifier;
    }
    ability.savingThrowProficient = savingThrow.proficient;
  }
}

function parseAttacks(text: string, parsedFields: string[]) {
  const attacks: CharacterAttack[] = [];
  const attackRegex =
    /([A-ZA-Za-z][A-Za-z' ]{2,40})\s*([+-]\d{1,2})\s*,?\s*(\d+d\d+(?:\+\d+)?)\s*([A-Za-z ]+)?/g;
  let match: RegExpExecArray | null;

  while ((match = attackRegex.exec(text)) !== null) {
    if (!/d\d/.test(match[3])) {
      continue;
    }

    attacks.push({
      id: `atk-${slugify(match[1])}`,
      name: match[1].trim(),
      attackBonus: Number(match[2]),
      damage: match[3],
      damageType: match[4]?.trim(),
    });
    parsedFields.push("attacks");
  }

  return dedupeById(attacks, (attack) => attack.id).slice(0, 8);
}

function parseSimpleTaggedList(
  text: string,
  labels: string[],
  prefix: string,
  parsedFields: string[],
) {
  const results: CharacterProficiency[] = [];

  for (const label of labels) {
    const values = parseCommaSeparatedList(text, [label], parsedFields, prefix);

    for (const value of values) {
      results.push({
        id: `${prefix}-${slugify(label)}-${slugify(value)}`,
        label: value,
        category: label === "idiomas" ? "language" : "other",
        level: "proficient",
        source: "Nivel20 HTML",
      });
    }
  }

  return dedupeById(results, (entry) => entry.id);
}

function parseSpellcasting(text: string, parsedFields: string[]) {
  const hasSpellSection = /conjuros|hechizos|trucos/i.test(text);

  if (!hasSpellSection) {
    return [];
  }

  const ability = parseSpellAbility(text);
  const saveDc = parseSignedNumberField(text, ["cd", "dc"], "spellcasting.saveDc", parsedFields);
  const spellAttackBonus = parseSignedNumberField(
    text,
    ["ataque de conjuro", "bono ataque", "spell attack"],
    "spellcasting.attackBonus",
    parsedFields,
  );
  const cantripsKnown = parseSignedNumberField(
    text,
    ["trucos", "cantrips"],
    "spellcasting.cantripsKnown",
    parsedFields,
  );
  const spellsKnown = parseSignedNumberField(
    text,
    ["conocidos", "spells known"],
    "spellcasting.spellsKnown",
    parsedFields,
  );

  const slots: CharacterSpellSlotLevel[] = [];
  const slotMatch = text.match(/nivel\s*1\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/i);
  if (slotMatch) {
    slots.push({
      level: 1,
      current: Number(slotMatch[1]),
      maximum: Number(slotMatch[2]),
    });
    parsedFields.push("spellcasting");
  }

  const spells = parseSpellList(text, parsedFields);

  return [
    {
      id: "nivel20-spellcasting",
      source: "Nivel20 HTML",
      ability,
      spellSaveDc: saveDc,
      spellAttackBonus,
      cantripsKnown: cantripsKnown ?? undefined,
      spellsKnown: spellsKnown ?? undefined,
      slots,
      spells,
    },
  ];
}

function parseSpellAbility(text: string): AbilityScoreKey | undefined {
  const match = text.match(/(carisma|sabiduria|inteligencia)/i);

  if (!match) {
    return undefined;
  }

  if (/carisma/i.test(match[1])) {
    return "charisma";
  }
  if (/sabiduria/i.test(match[1])) {
    return "wisdom";
  }
  return "intelligence";
}

function parseSpellList(text: string, parsedFields: string[]) {
  const results: CharacterSpell[] = [];
  const spellNames = [
    "Burla cruel",
    "Mano de mago",
    "Palabra curativa",
    "Susurros disonantes",
    "Hechizar persona",
    "Fuego feerico",
  ];

  for (const spellName of spellNames) {
    if (!text.toLowerCase().includes(spellName.toLowerCase())) {
      continue;
    }

    results.push({
      id: `spell-${slugify(spellName)}`,
      name: spellName,
      level: spellName === "Burla cruel" || spellName === "Mano de mago" ? 0 : 1,
      known: true,
    });
    parsedFields.push("spellcasting");
  }

  return results;
}

function isWelcomePage(text: string, title?: string) {
  const normalizedTitle = (title ?? "").toLowerCase();
  const normalizedText = text.toLowerCase();

  return (
    normalizedTitle.includes("tu plataforma web de rol") ||
    normalizedText.includes("te damos la bienvenida a nivel20")
  );
}

function isSuspiciousText(
  value: string | undefined,
  markers: string[],
  maxLength: number,
) {
  if (!value) {
    return false;
  }

  const normalized = normalizeForInspection(value);
  return (
    value.length > maxLength ||
    markers.some((marker) => normalized.includes(normalizeForInspection(marker))) ||
    /\([a-z]{3}\)\s*[+-]?\d/.test(normalized) ||
    /(acrobacias|interpretacion|intimidar|investigacion|medicina|sigilo)/i.test(normalized)
  );
}

function collectSectionSnippets(text: string) {
  const snippets: Record<string, string> = {};
  const lowerText = text.toLowerCase();

  for (const section of sectionDefinitions) {
    const keyword = section.htmlKeywords.find((entry) => lowerText.includes(entry));

    if (!keyword) {
      continue;
    }

    snippets[section.key] = extractSnippet(text, keyword);
  }

  return snippets;
}

function extractSnippet(text: string, keyword: string) {
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(keyword.toLowerCase());

  if (index === -1) {
    return "";
  }

  return text.slice(Math.max(0, index - 80), Math.min(text.length, index + 220)).trim();
}

function limitText(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit)}...`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchOne(value: string, regex: RegExp) {
  const match = value.match(regex);
  return match?.[1]?.trim();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function buildCandidateMatcherKey(
  sectionKey: string,
  selectorHint: string | undefined,
  suggestedField: Nivel20CandidateField | undefined,
  detectedValue: string,
) {
  return [
    sectionKey,
    selectorHint ?? "no-selector",
    suggestedField ?? "no-suggestion",
    slugify(detectedValue).slice(0, 24),
  ].join("|");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeSlugFromUrl(sourceUrl: string) {
  try {
    const parsedUrl = new URL(sourceUrl);
    const segments = parsedUrl.pathname
      .split("/")
      .filter(Boolean)
      .reverse();
    const candidate =
      segments.find((segment) => /[a-z]/i.test(segment) && !/^\d+$/.test(segment)) ??
      segments.at(0) ??
      "personaje";

    return candidate
      .replace(/^\d+[-_\s]*/, "")
      .split("-")
      .filter(Boolean)
      .map((part) => capitalize(part))
      .join(" ");
  } catch {
    return "Personaje";
  }
}

function dedupeById<T>(entries: T[], getId: (entry: T) => string) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const id = getId(entry);

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function hasActualSectionContent(key: ImportSectionKey, values: ParsedValueMap) {
  switch (key) {
    case "identity":
      return Boolean(values.identity || values.classes?.length || values.totalLevel);
    case "ability-scores":
      return Boolean(values.abilityScores);
    case "combat":
      return Boolean(values.hitPoints || values.armor || values.proficiencyBonus !== undefined);
    case "saving-throws":
      return Boolean(values.savingThrows?.length);
    case "skills":
      return Boolean(values.skills?.length);
    case "proficiencies":
      return Boolean(values.proficiencies?.length || values.languages?.length);
    case "attacks":
      return Boolean(values.attacks?.length);
    case "background":
      return Boolean(values.background || values.backgroundDetails || values.alignment || values.history);
    case "traits":
      return Boolean(values.racialTraits?.length || values.classTraits?.length || values.feats?.length);
    case "equipment":
      return Boolean(
        values.equippedItems?.length || values.carriedItems?.length || values.otherPossessions?.length,
      );
    case "spells":
      return Boolean(values.spellcasting?.length);
    case "quick-actions":
      return Boolean(values.quickActions?.length || values.resources?.length);
    case "companions":
      return Boolean(values.companions?.length);
    case "notes":
      return Boolean(values.notes?.length);
    default:
      return false;
  }
}

function mergeValue<T>(
  sectionKey: ImportSectionKey,
  actualValue: T | undefined,
  previousValue: T | undefined,
  fallbackValue: T,
  sectionStates: Partial<Record<ImportSectionKey, SectionState>>,
  allowPreviousFallback = true,
) {
  if (actualValue !== undefined) {
    sectionStates[sectionKey] = "real";
    return actualValue;
  }

  if (allowPreviousFallback && previousValue !== undefined) {
    sectionStates[sectionKey] = "mock";
    return previousValue;
  }

  if (!sectionStates[sectionKey]) {
    sectionStates[sectionKey] = "missing";
  }

  return fallbackValue;
}

function mergeArray<T>(
  sectionKey: ImportSectionKey,
  actualValue: T[] | undefined,
  previousValue: T[] | undefined,
  fallbackValue: T[],
  sectionStates: Partial<Record<ImportSectionKey, SectionState>>,
  allowPreviousFallback = true,
) {
  if (actualValue?.length) {
    sectionStates[sectionKey] = "real";
    return actualValue;
  }

  if (allowPreviousFallback && previousValue?.length) {
    sectionStates[sectionKey] = "mock";
    return previousValue;
  }

  if (!sectionStates[sectionKey]) {
    sectionStates[sectionKey] = "missing";
  }

  return fallbackValue;
}

function countSectionItems(key: ImportSectionKey, draft: ImportedCharacterDraft) {
  switch (key) {
    case "identity":
      return draft.identity.name ? 1 + draft.classes.length : draft.classes.length;
    case "ability-scores":
      return Object.values(draft.abilityScores).filter((ability) => ability.score > 0).length;
    case "combat":
      return [draft.hitPoints.maximum, draft.armor.armorClass, draft.initiative, draft.speed, draft.proficiencyBonus]
        .filter((value) => value !== undefined && value !== 0 && value !== "No detectada")
        .length;
    case "saving-throws":
      return draft.savingThrows.length;
    case "skills":
      return draft.skills.length;
    case "proficiencies":
      return draft.proficiencies.length + draft.languages.length;
    case "attacks":
      return draft.attacks.length;
    case "background":
      return [
        draft.background,
        draft.alignment,
        draft.history,
        draft.backgroundDetails?.feature,
      ].filter(Boolean).length;
    case "traits":
      return draft.racialTraits.length + draft.classTraits.length + draft.feats.length;
    case "equipment":
      return draft.equippedItems.length + draft.carriedItems.length + draft.otherPossessions.length;
    case "spells":
      return draft.spellcasting.reduce((total, entry) => total + entry.spells.length, 0);
    case "quick-actions":
      return draft.quickActions.length + draft.resources.length;
    case "companions":
      return draft.companions.length;
    case "notes":
      return draft.notes.length;
    default:
      return 0;
  }
}

function sanitizeCharacterName(value: string | undefined, sourceUrl: string) {
  const cleaned = value
    ? value.replace(/^\d+\s+/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
    : undefined;

  if (!cleaned || cleaned.length < 2) {
    return humanizeSlugFromUrl(sourceUrl);
  }

  return cleaned;
}

function hasRepeatedSpeedNoise(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return /30\s+pies.+30\s+pies/i.test(normalized) || normalized.length > 24;
}
