import type { Character } from "@/features/characters/types";

type CharacterProficienciesPanelProps = {
  character: Character;
};

export function CharacterProficienciesPanel({
  character,
}: CharacterProficienciesPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Competencias</h2>
        <p>Idiomas, herramientas y otras competencias visibles en la importacion.</p>
      </div>

      <div className="sheet-subpanel-list">
        <div className="sheet-subpanel">
          <div className="sheet-subpanel__title">
            <h3>Idiomas</h3>
          </div>
          {character.languages?.length ? (
            <ul className="tag-list">
              {character.languages.map((language) => (
                <li key={language}>{language}</li>
              ))}
            </ul>
          ) : (
            <p className="sheet-panel__note">No detectados.</p>
          )}
        </div>

        <div className="sheet-subpanel">
          <div className="sheet-subpanel__title">
            <h3>Listado</h3>
          </div>
          {character.proficiencies?.length ? (
            <div className="table-list">
              {character.proficiencies.map((proficiency) => (
                <div key={proficiency.id} className="table-list__row">
                  <div>
                    <strong>{proficiency.label}</strong>
                    <span>{proficiency.category}</span>
                  </div>
                  <div className="table-list__meta">
                    <span>{proficiency.source ?? "Sin origen"}</span>
                    <strong>{proficiency.level}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sheet-panel__note">No detectadas.</p>
          )}
        </div>
      </div>
    </section>
  );
}
