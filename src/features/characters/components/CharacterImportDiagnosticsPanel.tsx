import type { Character } from "@/features/characters/types";

type CharacterImportDiagnosticsPanelProps = {
  character: Character;
};

export function CharacterImportDiagnosticsPanel({
  character,
}: CharacterImportDiagnosticsPanelProps) {
  const diagnostics = character.importDiagnostics;

  if (!diagnostics) {
    return null;
  }

  return (
    <section className="sheet-panel import-diagnostics">
      <div className="sheet-panel__heading">
        <h2>Diagnostico de importacion</h2>
        <p>Visible en desarrollo para auditar que vino real, que quedo en fallback y que no aparecio.</p>
      </div>

      <div className="sheet-detail-grid">
        <article className="sheet-detail-card">
          <span className="sheet-detail-card__label">Estado</span>
          <strong>{diagnostics.state}</strong>
        </article>
        <article className="sheet-detail-card">
          <span className="sheet-detail-card__label">Secciones detectadas</span>
          <strong>{diagnostics.sectionsDetected}</strong>
        </article>
        <article className="sheet-detail-card">
          <span className="sheet-detail-card__label">Campos importados</span>
          <strong>{diagnostics.importedFieldCount}</strong>
        </article>
      </div>

      <div className="sheet-subpanel">
        <div className="sheet-subpanel__title">
          <h3>Campos no detectados</h3>
        </div>
        {diagnostics.missingFields.length ? (
          <ul className="tag-list">
            {diagnostics.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : (
          <p className="sheet-panel__note">No hay faltantes registrados.</p>
        )}
      </div>

      <div className="notes-list">
        {diagnostics.sectionDiagnostics.map((section) => (
          <article key={section.key} className="note-card">
            <h3>
              {section.label} · {section.status}
            </h3>
            <p className="note-card__kind">
              {section.importedCount} items · {section.importedFields.length} campos reales
            </p>
            <p>{section.notes ?? "Sin notas adicionales."}</p>
          </article>
        ))}
      </div>

      <details className="import-raw-details">
        <summary>Ver raw importado</summary>
        <pre>{JSON.stringify(character.rawImportData ?? {}, null, 2)}</pre>
      </details>
    </section>
  );
}
