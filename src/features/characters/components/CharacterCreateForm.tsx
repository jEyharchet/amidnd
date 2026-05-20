"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createCharacterAction,
  type CreateCharacterActionState,
} from "@/features/characters/server/character-actions";

const initialState: CreateCharacterActionState = {};

export function CharacterCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createCharacterAction,
    initialState,
  );
  const [source, setSource] = useState<"LOCAL" | "NIVEL20">("LOCAL");

  return (
    <main className="characters-page">
      <section className="characters-shell" aria-label="Crear personaje">
        <Link href="/characters" className="sheet-back-link">
          Volver a la cripta de aventureros
        </Link>

        <div className="characters-hero">
          <div>
            <p className="characters-kicker">Nuevo personaje</p>
            <h1>Forjar una nueva ficha</h1>
            <p className="characters-copy">
              Elige si la ficha nace localmente o si va a enlazarse a una URL de
              Nivel20 para sincronizar datos mas adelante.
            </p>
          </div>
        </div>

        <form action={formAction} className="create-character-form">
          <div className="create-character-form__grid">
            <label className="importer-form__label" htmlFor="name">
              Nombre
              <input
                id="name"
                name="name"
                type="text"
                className="importer-form__input"
                placeholder="Nombre del personaje"
                required
              />
            </label>

            <label className="importer-form__label" htmlFor="playerName">
              Jugador
              <input
                id="playerName"
                name="playerName"
                type="text"
                className="importer-form__input"
                placeholder="Nombre del jugador"
              />
            </label>

            <label className="importer-form__label" htmlFor="source">
              Origen
              <select
                id="source"
                name="source"
                className="importer-form__input"
                value={source}
                onChange={(event) =>
                  setSource(event.target.value === "NIVEL20" ? "NIVEL20" : "LOCAL")
                }
              >
                <option value="LOCAL">Local</option>
                <option value="NIVEL20">Nivel20</option>
              </select>
            </label>

            {source === "NIVEL20" ? (
              <label className="importer-form__label" htmlFor="sourceUrl">
                URL Nivel20
                <input
                  id="sourceUrl"
                  name="sourceUrl"
                  type="url"
                  className="importer-form__input"
                  placeholder="https://nivel20.com/..."
                  required
                />
              </label>
            ) : null}
          </div>

          {state.error ? (
            <section className="importer-result importer-result--failed" aria-live="polite">
              <p className="importer-result__status">No se pudo crear la ficha</p>
              <p>{state.error}</p>
            </section>
          ) : null}

          <div className="create-character-form__actions">
            <button type="submit" className="primary-link importer-form__button" disabled={isPending}>
              {isPending ? "Creando..." : "Crear personaje"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
