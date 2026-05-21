import type { Character } from "@/features/characters/types";

type CharacterAttacksPanelProps = {
  character: Character;
};

export function CharacterAttacksPanel({ character }: CharacterAttacksPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Ataques</h2>
        <p>Ataques detectados en la fuente o conservados como fallback.</p>
      </div>

      {character.attacks?.length ? (
        <div className="table-list">
          {character.attacks.map((attack) => (
            <div key={attack.id} className="table-list__row">
              <div>
                <strong>{attack.name}</strong>
                <span>
                  {attack.damage ?? "Sin dano"} {attack.damageType ? `· ${attack.damageType}` : ""}
                </span>
              </div>
              <div className="table-list__meta">
                <span>{attack.range ?? attack.ability ?? "Sin alcance"}</span>
                <strong>{formatSignedValue(attack.attackBonus ?? 0)}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">Nivel20 no entrego ataques claros en el HTML inicial.</p>
      )}
    </section>
  );
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
