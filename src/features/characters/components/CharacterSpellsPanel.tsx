import type { Character } from "@/features/characters/types";

type CharacterSpellsPanelProps = {
  character: Character;
};

export function CharacterSpellsPanel({ character }: CharacterSpellsPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Conjuros listados</h2>
        <p>Resumen visible de espacios, atributo magico y lista de conjuros detectados.</p>
      </div>

      {character.spellcastingDetails?.length ? (
        <div className="sheet-subpanel-list">
          {character.spellcastingDetails.map((entry) => (
            <div key={entry.id} className="sheet-subpanel">
              <div className="sheet-subpanel__title">
                <h3>{entry.source}</h3>
              </div>

              <div className="sheet-detail-grid">
                <article className="sheet-detail-card">
                  <span className="sheet-detail-card__label">Atributo</span>
                  <strong>{entry.ability ? character.abilityScores[entry.ability].label : "No detectado"}</strong>
                </article>
                <article className="sheet-detail-card">
                  <span className="sheet-detail-card__label">CD</span>
                  <strong>{entry.spellSaveDc ?? "No detectada"}</strong>
                </article>
                <article className="sheet-detail-card">
                  <span className="sheet-detail-card__label">Ataque</span>
                  <strong>{entry.spellAttackBonus ?? "No detectado"}</strong>
                </article>
                <article className="sheet-detail-card">
                  <span className="sheet-detail-card__label">Trucos</span>
                  <strong>{entry.cantripsKnown ?? 0}</strong>
                </article>
                <article className="sheet-detail-card">
                  <span className="sheet-detail-card__label">Conocidos</span>
                  <strong>{entry.spellsKnown ?? entry.spells.length}</strong>
                </article>
                <article className="sheet-detail-card">
                  <span className="sheet-detail-card__label">Espacios</span>
                  <strong>
                    {entry.slots.length
                      ? entry.slots.map((slot) => `${slot.level}: ${slot.current}/${slot.maximum}`).join(" · ")
                      : "No detectados"}
                  </strong>
                </article>
              </div>

              {entry.spells.length ? (
                <div className="notes-list">
                  {entry.spells.map((spell) => (
                    <article key={spell.id} className="note-card">
                      <h3>
                        {spell.name} · Nivel {spell.level}
                      </h3>
                      <p className="note-card__kind">
                        {spell.school ?? "Escuela no detectada"}
                        {spell.components?.length ? ` · ${spell.components.join(", ")}` : ""}
                      </p>
                      <p>{spell.description ?? spell.notes ?? "Sin descripcion importada."}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="sheet-panel__note">No se listaron conjuros individuales.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">No se detectaron conjuros en el HTML inicial.</p>
      )}
    </section>
  );
}
