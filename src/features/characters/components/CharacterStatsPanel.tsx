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
                {formatOptionalSignedValue(ability.overrideModifier ?? ability.modifier)}
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
          {abilityOrder
            .map((abilityKey) => {
              const ability = character.abilityScores[abilityKey];
              const savingThrow =
                character.savingThrows.find((entry) => entry.ability === abilityKey) ??
                (ability.savingThrowModifier !== undefined || ability.savingThrowProficient !== undefined
                  ? {
                      ability: abilityKey,
                      modifier: ability.savingThrowModifier,
                      proficient: ability.savingThrowProficient ?? false,
                    }
                  : undefined);

              if (!savingThrow) {
                return null;
              }

              return (
                <li key={savingThrow.ability}>
                  {ability.label}: {formatOptionalSignedValue(savingThrow.modifier)}
                  {savingThrow.proficient ? " · competente" : ""}
                </li>
              );
            })
            .filter(Boolean)}
        </ul>
      </div>
    </section>
  );
}

function formatOptionalSignedValue(value?: number) {
  if (value === undefined) {
    return "No detectado";
  }

  return value >= 0 ? `+${value}` : `${value}`;
}
