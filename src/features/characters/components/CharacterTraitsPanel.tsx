import type { Character, CharacterTrait } from "@/features/characters/types";

type CharacterTraitsPanelProps = {
  character: Character;
};

export function CharacterTraitsPanel({ character }: CharacterTraitsPanelProps) {
  const entries: Array<{ label: string; items: Array<CharacterTrait | { id: string; name: string; description?: string; source?: string }> }> = [
    { label: "Rasgos raciales", items: character.racialTraits ?? [] },
    { label: "Rasgos de clase", items: character.classTraits ?? [] },
    { label: "Dotes", items: (character.feats ?? []).map((feat) => ({ ...feat })) },
  ];

  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Rasgos y dotes</h2>
        <p>Lista de rasgos detectados, heredados como fallback o aun ausentes.</p>
      </div>

      <div className="sheet-subpanel-list">
        {entries.map((entry) => (
          <div key={entry.label} className="sheet-subpanel">
            <div className="sheet-subpanel__title">
              <h3>{entry.label}</h3>
            </div>
            {entry.items.length ? (
              <div className="notes-list">
                {entry.items.map((item) => (
                  <article key={item.id} className="note-card">
                    <h3>{item.name}</h3>
                    {item.source ? <p className="note-card__kind">{item.source}</p> : null}
                    <p>{item.description ?? "Sin descripcion importada."}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="sheet-panel__note">No detectados.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
