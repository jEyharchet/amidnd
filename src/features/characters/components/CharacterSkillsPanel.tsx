import type { Character } from "@/features/characters/types";

type CharacterSkillsPanelProps = {
  character: Character;
};

export function CharacterSkillsPanel({ character }: CharacterSkillsPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Habilidades</h2>
        <p>La lista queda desacoplada para soportar reglas variantes o homebrew.</p>
      </div>

      {character.skills.length ? (
        <div className="table-list">
          {character.skills.map((skill) => (
            <div key={skill.key} className="table-list__row">
              <div>
                <strong>{skill.label}</strong>
                <span>{character.abilityScores[skill.ability].label}</span>
              </div>
              <div className="table-list__meta">
                <span>{skill.proficiency}</span>
                <strong>{formatSignedValue(skill.modifier ?? 0)}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">No se detectaron habilidades en la fuente actual.</p>
      )}
    </section>
  );
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
