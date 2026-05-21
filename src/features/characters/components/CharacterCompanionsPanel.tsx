import type { Character } from "@/features/characters/types";

type CharacterCompanionsPanelProps = {
  character: Character;
};

export function CharacterCompanionsPanel({
  character,
}: CharacterCompanionsPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Companeros</h2>
        <p>Familiares, mascotas, monturas o summons detectados en la fuente.</p>
      </div>

      {character.companions?.length ? (
        <div className="table-list">
          {character.companions.map((companion) => (
            <div key={companion.id} className="table-list__row">
              <div>
                <strong>{companion.name}</strong>
                <span>{companion.kind}</span>
              </div>
              <div className="table-list__meta">
                <span>CA {companion.armorClass ?? "-"}</span>
                <strong>{companion.hitPoints ?? "-"}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">No se detectaron companeros en el HTML inicial.</p>
      )}
    </section>
  );
}
