import type { Character } from "@/features/characters/types";

type CharacterResourcesPanelProps = {
  character: Character;
};

export function CharacterResourcesPanel({
  character,
}: CharacterResourcesPanelProps) {
  return (
    <section className="sheet-panel">
      <div className="sheet-panel__heading">
        <h2>Recursos</h2>
        <p>Preparado para evolucionar a acciones, consumibles y contadores del sistema.</p>
      </div>

      {character.resources.length ? (
        <div className="table-list">
          {character.resources.map((resource) => (
            <div key={resource.id} className="table-list__row">
              <div>
                <strong>{resource.label}</strong>
                <span>{resource.resetsOn ? `Recarga: ${resource.resetsOn}` : "Uso libre"}</span>
              </div>
              <div className="table-list__meta">
                <strong>
                  {resource.current}
                  {resource.maximum !== undefined ? `/${resource.maximum}` : ""}
                </strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-panel__note">No se detectaron recursos contables.</p>
      )}
    </section>
  );
}
