import type { Character } from "@/features/characters/types";

type CharacterQuickActionsPanelProps = {
  character: Character;
};

export function CharacterQuickActionsPanel({
  character,
}: CharacterQuickActionsPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Acciones rapidas</h2>
        <p>Acciones adicionales, reacciones o atajos de juego detectados.</p>
      </div>

      {character.quickActions?.length ? (
        <div className="notes-list">
          {character.quickActions.map((action) => (
            <article key={action.id} className="note-card">
              <h3>{action.name}</h3>
              <p className="note-card__kind">{action.kind}</p>
              <p>{action.description ?? "Sin descripcion importada."}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">
          Esta seccion sigue vacia si Nivel20 no publica acciones rapidas en el HTML inicial.
        </p>
      )}
    </section>
  );
}
