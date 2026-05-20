"use client";

import { useState } from "react";
import { analyzeNivel20Url } from "@/features/characters/importers/nivel20/nivel20Importer";
import type { Nivel20ImportResult } from "@/features/characters/importers/nivel20/types";

export function Nivel20ImportForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Nivel20ImportResult | null>(null);

  return (
    <div className="importer-panel">
      <div className="importer-panel__heading">
        <h2>Probar URL compartida</h2>
        <p>
          No ingreses tu contrasena. Esta prueba solo usa URLs de personaje
          compartidas o publicas.
        </p>
      </div>

      <form
        className="importer-form"
        onSubmit={(event) => {
          event.preventDefault();
          setResult(analyzeNivel20Url(url));
        }}
      >
        <label className="importer-form__label" htmlFor="nivel20-url">
          URL de personaje
        </label>
        <input
          id="nivel20-url"
          name="nivel20-url"
          type="url"
          inputMode="url"
          placeholder="https://nivel20.com/games/..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="importer-form__input"
        />
        <button type="submit" className="primary-link importer-form__button">
          Analizar URL
        </button>
      </form>

      {result ? (
        <section
          className={`importer-result importer-result--${result.status}`}
          aria-live="polite"
        >
          <p className="importer-result__status">
            {result.status === "success"
              ? "URL valida"
              : result.status === "partial"
                ? "URL soportada parcialmente"
                : "URL invalida"}
          </p>
          <p>Fuente analizada: {result.sourceUrl || "Sin URL valida"}</p>
          {result.detectedCharacterName ? (
            <p>Nombre detectado: {result.detectedCharacterName}</p>
          ) : null}
          {result.issues.map((issue) => (
            <p key={`${issue.code}-${issue.message}`}>{issue.message}</p>
          ))}
        </section>
      ) : null}

      {result?.parsedCharacter && result.importedDraft ? (
        <section className="importer-preview">
          <div className="importer-preview__heading">
            <h3>Preview mock de ImportedCharacterDraft</h3>
            <p>
              Nombre: {result.importedDraft.identity.name} ·{" "}
              {result.importedDraft.identity.species} · Nivel{" "}
              {result.importedDraft.totalLevel}
            </p>
          </div>

          <div className="importer-preview__summary">
            <article>
              <span>Clase</span>
              <strong>
                {result.importedDraft.classes
                  .map((entry) =>
                    entry.subclass ? `${entry.name} (${entry.subclass})` : entry.name,
                  )
                  .join(", ")}
              </strong>
            </article>
            <article>
              <span>Conjuros</span>
              <strong>
                {result.importedDraft.spellcasting[0]?.source ?? "Sin lanzamiento"}
              </strong>
            </article>
            <article>
              <span>Raw import data</span>
              <strong>{result.importedDraft.rawImportData?.format ?? "unknown"}</strong>
            </article>
          </div>

          <div className="importer-preview__sections">
            {result.parsedCharacter.sections.map((section) => (
              <article key={section.key} className="importer-preview__section">
                <span>{section.label}</span>
                <strong>{section.itemCount}</strong>
                <p>{section.notes ?? `Estado: ${section.status}`}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
