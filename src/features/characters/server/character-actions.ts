"use server";

import { redirect } from "next/navigation";
import { createCharacterInDb } from "@/features/characters/server/character-store";

export type CreateCharacterActionState = {
  error?: string;
};

export async function createCharacterAction(
  _previousState: CreateCharacterActionState,
  formData: FormData,
): Promise<CreateCharacterActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const playerName = String(formData.get("playerName") ?? "").trim();
  const source = String(formData.get("source") ?? "LOCAL").trim().toUpperCase();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!name) {
    return {
      error: "El nombre es obligatorio.",
    };
  }

  if (source !== "LOCAL" && source !== "NIVEL20") {
    return {
      error: "El origen seleccionado no es valido.",
    };
  }

  if (source === "NIVEL20") {
    if (!sourceUrl) {
      return {
        error: "La URL de Nivel20 es obligatoria para ese origen.",
      };
    }

    try {
      const parsedUrl = new URL(sourceUrl);
      const normalizedHost = parsedUrl.hostname.toLowerCase();

      if (normalizedHost !== "nivel20.com" && normalizedHost !== "www.nivel20.com") {
        return {
          error: "La URL debe pertenecer a nivel20.com.",
        };
      }
    } catch {
      return {
        error: "La URL de Nivel20 no es valida.",
      };
    }
  }

  let createdCharacter;

  try {
    createdCharacter = await createCharacterInDb({
      name,
      playerName,
      source: source as "LOCAL" | "NIVEL20",
      sourceUrl: source === "NIVEL20" ? sourceUrl : undefined,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");

    console.error("[characters.create]", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      databaseUrlExists: Boolean(process.env.DATABASE_URL),
      source,
    });

    return {
      error:
        "No pude guardar el personaje en la base todavia. Revisa DATABASE_URL y la migracion de Prisma.",
    };
  }

  redirect(`/characters/${createdCharacter.id}`);
}
