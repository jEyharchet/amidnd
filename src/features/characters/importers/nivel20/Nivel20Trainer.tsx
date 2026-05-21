"use client";

import { useActionState, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  applyNivel20MappingProfileToDraft,
  createDefaultNivel20MappingProfile,
  createEmptyCustomAttributeDefinition,
  createMappingRuleFromCandidate,
  nivel20ExistingFieldOptions,
} from "@/features/characters/importers/nivel20/nivel20MappingProfile";
import type {
  Nivel20TrainerCandidate,
  Nivel20TrainerInspection,
} from "@/features/characters/importers/nivel20/nivel20MappingTypes";
import type {
  CharacterCustomAttributeDefinition,
  Nivel20MappingProfile,
  Nivel20MappingRule,
} from "@/features/characters/types";
import {
  inspectNivel20TrainerAction,
  saveNivel20TrainerProfileAction,
  type Nivel20TrainerActionState,
} from "@/features/characters/server/nivel20-trainer-actions";

const initialActionState: Nivel20TrainerActionState = {};

export function Nivel20Trainer() {
  const [inspectState, inspectAction, inspectPending] = useActionState(
    inspectNivel20TrainerAction,
    initialActionState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveNivel20TrainerProfileAction,
    initialActionState,
  );
  const inspection = inspectState.inspection ?? saveState.inspection;
  const activeError = inspectState.error ?? saveState.error;
  const [sourceUrl, setSourceUrl] = useState("");
  const [profile, setProfile] = useState<Nivel20MappingProfile>(
    createDefaultNivel20MappingProfile(),
  );

  useEffect(() => {
    if (!inspection) {
      return;
    }

    setSourceUrl(inspection.sourceUrl);
    setProfile(inspection.mappingProfile);
  }, [inspection]);

  const previewDraft = useMemo(() => {
    if (!inspection) {
      return null;
    }

    return applyNivel20MappingProfileToDraft(
      inspection.baseDraft,
      profile,
      inspection.candidates,
    );
  }, [inspection, profile]);

  const visibleCustomAttributes =
    previewDraft?.customAttributes
      ?.filter((attribute) => attribute.visibleInSheet)
      .sort((left, right) => (left.visualOrder ?? 999) - (right.visualOrder ?? 999)) ?? [];

  return (
    <div className="trainer-panel">
      <div className="importer-panel__heading">
        <h2>Trainer experimental de mapeo</h2>
        <p>
          Usa fetch server-side para inspeccionar HTML publico de Nivel20, sugerir
          candidatos y guardar reglas versionadas sin pedir credenciales.
        </p>
      </div>

      <form action={inspectAction} className="importer-form trainer-toolbar">
        <label className="importer-form__label" htmlFor="trainer-nivel20-url">
          URL de personaje
        </label>
        <input
          id="trainer-nivel20-url"
          name="sourceUrl"
          type="url"
          inputMode="url"
          className="importer-form__input"
          placeholder="https://nivel20.com/games/..."
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
        />
        <button type="submit" className="primary-link importer-form__button" disabled={inspectPending}>
          {inspectPending ? "Analizando..." : "Inspeccionar fuente"}
        </button>
      </form>

      {activeError ? (
        <section className="importer-result importer-result--failed">
          <p className="importer-result__status">No pude completar la inspeccion</p>
          <p>{activeError}</p>
        </section>
      ) : null}

      {saveState.savedProfile ? (
        <section className="importer-result importer-result--success">
          <p className="importer-result__status">Perfil guardado</p>
          <p>
            Version {saveState.savedProfile.version} guardada para Nivel20.
          </p>
        </section>
      ) : null}

      {inspection && previewDraft ? (
        <>
          <div className="trainer-layout">
            <section className="trainer-column trainer-column--left">
              <div className="trainer-card">
                <div className="sheet-subpanel__title">
                  <h3>Bloques detectados</h3>
                </div>
                <div className="trainer-tags">
                  {inspection.detectedSections.map((section) => (
                    <details key={section.key} className="trainer-snippet">
                      <summary>
                        {section.label} <span>{section.key}</span>
                      </summary>
                      <p>{section.snippet ?? "Sin snippet adicional."}</p>
                    </details>
                  ))}
                </div>
              </div>

              <div className="trainer-card">
                <div className="sheet-subpanel__title">
                  <h3>Texto normalizado recibido</h3>
                </div>
                <pre className="trainer-code-block">{inspection.normalizedText || "Sin texto."}</pre>
              </div>

              <div className="trainer-card">
                <div className="sheet-subpanel__title">
                  <h3>HTML recibido</h3>
                </div>
                <pre className="trainer-code-block">{inspection.htmlSnapshot || "Sin HTML."}</pre>
              </div>
            </section>

            <section className="trainer-column trainer-column--right">
              <div className="trainer-card">
                <div className="sheet-subpanel__title">
                  <h3>Campos amidnd detectados</h3>
                </div>
                <div className="trainer-summary-grid">
                  <article className="sheet-detail-card">
                    <span className="sheet-detail-card__label">Nombre</span>
                    <strong>{previewDraft.identity.name}</strong>
                  </article>
                  <article className="sheet-detail-card">
                    <span className="sheet-detail-card__label">Clase</span>
                    <strong>{previewDraft.classes[0]?.name ?? "Sin clase"}</strong>
                  </article>
                  <article className="sheet-detail-card">
                    <span className="sheet-detail-card__label">Nivel</span>
                    <strong>{previewDraft.totalLevel}</strong>
                  </article>
                  <article className="sheet-detail-card">
                    <span className="sheet-detail-card__label">PG max</span>
                    <strong>{previewDraft.hitPoints.maximum}</strong>
                  </article>
                  <article className="sheet-detail-card">
                    <span className="sheet-detail-card__label">CA</span>
                    <strong>{previewDraft.armor.armorClass}</strong>
                  </article>
                  <article className="sheet-detail-card">
                    <span className="sheet-detail-card__label">Conjuros</span>
                    <strong>{previewDraft.spellcasting.reduce((total, entry) => total + entry.spells.length, 0)}</strong>
                  </article>
                </div>
              </div>

              <div className="trainer-card">
                <div className="sheet-subpanel__title">
                  <h3>Atributos personalizados</h3>
                </div>
                {visibleCustomAttributes.length ? (
                  <div className="notes-list">
                    {visibleCustomAttributes.map((attribute) => (
                      <article key={attribute.key} className="note-card">
                        <p className="note-card__kind">
                          {attribute.category} · {attribute.type}
                        </p>
                        <h3>{attribute.label}</h3>
                        <p>{formatValue(attribute.value)}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="sheet-panel__note">
                    Todavia no hay atributos personalizados visibles en el preview.
                  </p>
                )}
              </div>

              <div className="trainer-card">
                <div className="sheet-subpanel__title">
                  <h3>JSON resultante</h3>
                </div>
                <pre className="trainer-code-block">
                  {JSON.stringify(previewDraft, null, 2)}
                </pre>
              </div>
            </section>
          </div>

          <section className="trainer-card">
            <div className="sheet-subpanel__title">
              <h3>Candidatos de extraccion</h3>
            </div>

            <div className="trainer-candidate-list">
              {inspection.candidates.map((candidate) => {
                const rule = getRuleForCandidate(profile, candidate);
                const customDefinition = rule?.customAttributeKey
                  ? profile.customAttributeDefinitions.find(
                      (definition) => definition.key === rule.customAttributeKey,
                    )
                  : undefined;

                return (
                  <article key={candidate.id} className="trainer-candidate-card">
                    <div className="trainer-candidate-card__meta">
                      <span className={`trainer-confidence trainer-confidence--${candidate.confidence}`}>
                        {candidate.confidence}
                      </span>
                      <strong>{candidate.suggestedField ?? "Sin sugerencia"}</strong>
                    </div>

                    <div className="trainer-candidate-card__grid">
                      <div>
                        <span className="sheet-detail-card__label">Texto original</span>
                        <p>{candidate.originalText}</p>
                      </div>
                      <div>
                        <span className="sheet-detail-card__label">Selector/tag</span>
                        <p>{candidate.selectorHint ?? "No disponible"}</p>
                      </div>
                      <div>
                        <span className="sheet-detail-card__label">Valor detectado</span>
                        <p>{candidate.detectedValue}</p>
                      </div>
                      <div>
                        <span className="sheet-detail-card__label">Campo amidnd sugerido</span>
                        <p>{candidate.suggestedField ?? "Sin sugerencia"}</p>
                      </div>
                    </div>

                    <div className="trainer-mapping-controls">
                      <label className="importer-form__label" htmlFor={`candidate-action-${candidate.id}`}>
                        Asignacion
                      </label>
                      <select
                        id={`candidate-action-${candidate.id}`}
                        className="importer-form__input trainer-select"
                        value={serializeRuleSelection(rule)}
                        onChange={(event) =>
                          handleRuleSelectionChange(
                            candidate,
                            event.target.value,
                            setProfile,
                          )
                        }
                      >
                        <option value="ignore">ignore</option>
                        {candidate.suggestedField ? (
                          <option value={`existing:${candidate.suggestedField}`}>
                            {candidate.suggestedField} (sugerido)
                          </option>
                        ) : null}
                        {nivel20ExistingFieldOptions.map((option) => (
                          <option key={option.value} value={`existing:${option.value}`}>
                            {option.label}
                          </option>
                        ))}
                        <option value="custom">nuevo atributo personalizado</option>
                      </select>
                    </div>

                    {rule?.action === "map-custom" ? (
                      <CustomDefinitionEditor
                        candidate={candidate}
                        definition={customDefinition}
                        onChange={(definition) =>
                          setProfile((currentProfile) =>
                            updateCustomDefinition(
                              currentProfile,
                              rule.customAttributeKey ?? definition.key,
                              definition,
                            ),
                          )
                        }
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <form action={saveAction} className="create-character-form__actions trainer-save-form">
            <input type="hidden" name="sourceUrl" value={sourceUrl} />
            <input type="hidden" name="mappingProfile" value={JSON.stringify(profile)} />
            <button type="submit" className="primary-link importer-form__button" disabled={savePending}>
              {savePending ? "Guardando perfil..." : "Guardar mapping profile versionado"}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

function getRuleForCandidate(
  profile: Nivel20MappingProfile,
  candidate: Nivel20TrainerCandidate,
) {
  return profile.rules.find((rule) => rule.candidateId === candidate.id);
}

function serializeRuleSelection(rule?: Nivel20MappingRule) {
  if (!rule || rule.action === "ignore") {
    return "ignore";
  }

  if (rule.action === "map-custom") {
    return "custom";
  }

  return `existing:${rule.targetField}`;
}

function handleRuleSelectionChange(
  candidate: Nivel20TrainerCandidate,
  selection: string,
  setProfile: Dispatch<SetStateAction<Nivel20MappingProfile>>,
) {
  setProfile((currentProfile) => {
    const nextRules = currentProfile.rules.filter((rule) => rule.candidateId !== candidate.id);

    if (selection === "ignore") {
      nextRules.push({
        ...createMappingRuleFromCandidate(candidate),
        action: "ignore",
        targetField: undefined,
      });

      return {
        ...currentProfile,
        rules: nextRules,
      };
    }

    if (selection === "custom") {
      const nextDefinition =
        currentProfile.customAttributeDefinitions.find(
          (definition) => definition.key === `custom.nivel20.${candidate.id}`,
        ) ?? {
          ...createEmptyCustomAttributeDefinition(currentProfile.customAttributeDefinitions.length),
          key: `custom.nivel20.${candidate.id}`,
          label: candidate.detectedValue.slice(0, 40) || "Nuevo atributo",
        };

      nextRules.push({
        ...createMappingRuleFromCandidate(candidate),
        action: "map-custom",
        targetField: undefined,
        customAttributeKey: nextDefinition.key,
      });

      return {
        ...currentProfile,
        rules: nextRules,
        customAttributeDefinitions: upsertCustomDefinition(
          currentProfile.customAttributeDefinitions,
          nextDefinition,
        ),
      };
    }

    const targetField = selection.replace("existing:", "");
    nextRules.push({
      ...createMappingRuleFromCandidate(candidate),
      action: "map-existing",
      targetField,
      customAttributeKey: undefined,
    });

    return {
      ...currentProfile,
      rules: nextRules,
    };
  });
}

function updateCustomDefinition(
  profile: Nivel20MappingProfile,
  key: string,
  definition: CharacterCustomAttributeDefinition,
) {
  return {
    ...profile,
    customAttributeDefinitions: upsertCustomDefinition(
      profile.customAttributeDefinitions,
      {
        ...definition,
        key,
      },
    ),
  };
}

function upsertCustomDefinition(
  definitions: CharacterCustomAttributeDefinition[],
  nextDefinition: CharacterCustomAttributeDefinition,
) {
  const existingIndex = definitions.findIndex((definition) => definition.key === nextDefinition.key);

  if (existingIndex === -1) {
    return [...definitions, nextDefinition];
  }

  return definitions.map((definition, index) =>
    index === existingIndex ? nextDefinition : definition,
  );
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  return String(value ?? "Sin valor");
}

function CustomDefinitionEditor({
  candidate,
  definition,
  onChange,
}: {
  candidate: Nivel20TrainerCandidate;
  definition?: CharacterCustomAttributeDefinition;
  onChange: (definition: CharacterCustomAttributeDefinition) => void;
}) {
  const safeDefinition = definition ?? {
    ...createEmptyCustomAttributeDefinition(),
    key: `custom.nivel20.${candidate.id}`,
    label: candidate.detectedValue.slice(0, 40) || "Nuevo atributo",
  };

  return (
    <div className="trainer-custom-editor">
      <div className="create-character-form__grid">
        <Field
          label="Key tecnica"
          value={safeDefinition.key}
          onChange={(value) => onChange({ ...safeDefinition, key: value })}
        />
        <Field
          label="Label visible"
          value={safeDefinition.label}
          onChange={(value) => onChange({ ...safeDefinition, label: value })}
        />
        <SelectField
          label="Tipo"
          value={safeDefinition.type}
          options={["text", "number", "boolean", "list", "object", "richText"]}
          onChange={(value) =>
            onChange({
              ...safeDefinition,
              type: value as CharacterCustomAttributeDefinition["type"],
            })
          }
        />
        <SelectField
          label="Categoria"
          value={safeDefinition.category}
          options={[
            "identity",
            "combat",
            "skills",
            "spells",
            "equipment",
            "background",
            "traits",
            "actions",
            "companions",
            "custom",
          ]}
          onChange={(value) =>
            onChange({
              ...safeDefinition,
              category: value as CharacterCustomAttributeDefinition["category"],
            })
          }
        />
        <Field
          label="Descripcion"
          value={safeDefinition.description ?? ""}
          onChange={(value) => onChange({ ...safeDefinition, description: value })}
        />
        <Field
          label="Orden visual"
          value={String(safeDefinition.visualOrder ?? "")}
          onChange={(value) =>
            onChange({
              ...safeDefinition,
              visualOrder: value ? Number(value) : undefined,
            })
          }
        />
      </div>

      <label className="trainer-checkbox">
        <input
          type="checkbox"
          checked={safeDefinition.visibleInSheet}
          onChange={(event) =>
            onChange({
              ...safeDefinition,
              visibleInSheet: event.target.checked,
            })
          }
        />
        Visible en ficha
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="importer-form__label trainer-field">
      {label}
      <input
        className="importer-form__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="importer-form__label trainer-field">
      {label}
      <select
        className="importer-form__input trainer-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
