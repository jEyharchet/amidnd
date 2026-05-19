import type { Character } from "@/features/characters/types";

type CharacterStatsPanelProps = {
  character: Character;
};

const abilityOrder: Array<keyof Character["abilityScores"]> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export function CharacterStatsPanel({ character }: CharacterStatsPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Caracteristicas</h2>
        <p>Base flexible para reglas futuras sin fijar logica de sistema todavia.</p>
      </div>

      <div className="ability-grid">
        {abilityOrder.map((abilityKey) => {
          const ability = character.abilityScores[abilityKey];

          return (
            <article key={ability.key} className="ability-card">
              <span className="ability-card__label">{ability.label}</span>
              <strong className="ability-card__score">{ability.score}</strong>
              <span className="ability-card__modifier">
                {formatSignedValue(ability.modifier ?? 0)}
              </span>
            </article>
          );
        })}
      </div>

      <div className="sheet-subpanel">
        <div className="sheet-subpanel__title">
          <h3>Salvaciones</h3>
        </div>
        <ul className="tag-list">
          {character.savingThrows.map((savingThrow) => (
            <li key={savingThrow.ability}>
              {character.abilityScores[savingThrow.ability].label}:{" "}
              {formatSignedValue(savingThrow.modifier ?? 0)}
              {savingThrow.proficient ? " · competente" : ""}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
