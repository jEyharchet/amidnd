import type { Character } from "@/features/characters/types";

type CharacterCombatPanelProps = {
  character: Character;
};

export function CharacterCombatPanel({ character }: CharacterCombatPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Combate</h2>
        <p>Resumen rapido de supervivencia, defensa y tempo de turno.</p>
      </div>

      <dl className="combat-grid">
        <div>
          <dt>PG</dt>
          <dd>
            {character.hitPoints.current}/{character.hitPoints.maximum}
          </dd>
        </div>
        <div>
          <dt>Temp</dt>
          <dd>{character.hitPoints.temporary ?? 0}</dd>
        </div>
        <div>
          <dt>CA</dt>
          <dd>{character.armor.armorClass}</dd>
        </div>
        <div>
          <dt>Iniciativa</dt>
          <dd>{formatSignedValue(character.initiative ?? character.armor.initiative ?? 0)}</dd>
        </div>
        <div>
          <dt>Velocidad</dt>
          <dd>{character.armor.speed ?? "No definida"}</dd>
        </div>
        <div>
          <dt>Golpes</dt>
          <dd>{character.hitPoints.hitDice ?? "Pendiente"}</dd>
        </div>
      </dl>

      {character.armor.notes ? (
        <p className="sheet-panel__note">Defensa: {character.armor.notes}</p>
      ) : null}

      {character.spellcasting ? (
        <div className="sheet-subpanel">
          <div className="sheet-subpanel__title">
            <h3>Conjuros</h3>
          </div>
          <ul className="tag-list">
            <li>
              Atributo:{" "}
              {character.spellcasting.ability
                ? character.abilityScores[character.spellcasting.ability].label
                : "Pendiente"}
            </li>
            <li>Ataque: {formatSignedValue(character.spellcasting.attackBonus ?? 0)}</li>
            <li>CD: {character.spellcasting.saveDc ?? "Pendiente"}</li>
            <li>
              Concentracion: {character.spellcasting.concentration ? "si" : "no"}
            </li>
          </ul>
          {character.spellcasting.notes ? (
            <p className="sheet-panel__note">{character.spellcasting.notes}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
