import type { Character } from "@/features/characters/types";

type CharacterBackgroundPanelProps = {
  character: Character;
};

export function CharacterBackgroundPanel({
  character,
}: CharacterBackgroundPanelProps) {
  const details = character.backgroundDetails;
  const hasContent =
    character.background ||
    character.alignment ||
    character.history ||
    details?.feature ||
    details?.personalityTraits?.length ||
    details?.ideals?.length ||
    details?.bonds?.length ||
    details?.flaws?.length;

  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Trasfondo</h2>
        <p>Biografia, motivaciones y detalles de interpretacion detectados o pendientes.</p>
      </div>

      {hasContent ? (
        <div className="sheet-detail-stack">
          <div className="sheet-detail-grid">
            <article className="sheet-detail-card">
              <span className="sheet-detail-card__label">Trasfondo</span>
              <strong>{character.background ?? details?.name ?? "No detectado"}</strong>
            </article>
            <article className="sheet-detail-card">
              <span className="sheet-detail-card__label">Alineamiento</span>
              <strong>{character.alignment ?? details?.alignment ?? "No detectado"}</strong>
            </article>
            <article className="sheet-detail-card">
              <span className="sheet-detail-card__label">Edad</span>
              <strong>{details?.age ?? "No detectada"}</strong>
            </article>
          </div>

          {details?.feature ? (
            <p className="sheet-panel__note">Rasgo de trasfondo: {details.feature}</p>
          ) : null}

          {character.history || details?.history ? (
            <div className="sheet-subpanel">
              <div className="sheet-subpanel__title">
                <h3>Historia</h3>
              </div>
              <p className="sheet-panel__note">{character.history ?? details?.history}</p>
            </div>
          ) : null}

          <div className="sheet-token-groups">
            <TokenGroup
              title="Personalidad"
              values={details?.personalityTraits}
              emptyLabel="No detectada"
            />
            <TokenGroup title="Ideales" values={details?.ideals} emptyLabel="No detectados" />
            <TokenGroup title="Vinculos" values={details?.bonds} emptyLabel="No detectados" />
            <TokenGroup title="Defectos" values={details?.flaws} emptyLabel="No detectados" />
          </div>
        </div>
      ) : (
        <EmptySection label="Nivel20 no expuso datos claros de trasfondo en el HTML inicial." />
      )}
    </section>
  );
}

function TokenGroup({
  title,
  values,
  emptyLabel,
}: {
  title: string;
  values?: string[];
  emptyLabel: string;
}) {
  return (
    <div className="sheet-subpanel">
      <div className="sheet-subpanel__title">
        <h3>{title}</h3>
      </div>
      {values?.length ? (
        <ul className="tag-list">
          {values.map((value) => (
            <li key={`${title}-${value}`}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="sheet-panel__note">{emptyLabel}</p>
      )}
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return <p className="sheet-panel__note">{label}</p>;
}
