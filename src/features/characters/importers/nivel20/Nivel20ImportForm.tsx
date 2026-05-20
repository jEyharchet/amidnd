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
          No ingreses tu contraseña. Esta prueba solo usa URLs de personaje
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
            {result.status === "valid-url"
              ? "URL valida"
              : result.status === "unsupported-url"
                ? "URL no soportada todavia"
                : "URL invalida"}
          </p>
          <p>{result.message}</p>
          {result.detectedDomain ? <p>Dominio detectado: {result.detectedDomain}</p> : null}
          {result.normalizedUrl ? <p>URL valida: {result.normalizedUrl}</p> : null}
          {result.nextStep ? <p>{result.nextStep}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
