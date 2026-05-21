"use server";

import {
  inspectNivel20SourceForTrainer,
} from "@/features/characters/importers/nivel20/nivel20Importer";
import {
  createDefaultNivel20MappingProfile,
} from "@/features/characters/importers/nivel20/nivel20MappingProfile";
import type {
  Nivel20TrainerInspection,
} from "@/features/characters/importers/nivel20/nivel20MappingTypes";
import type { Nivel20MappingProfile } from "@/features/characters/types";
import {
  getLatestNivel20MappingProfile,
  saveNivel20MappingProfile,
} from "@/features/characters/server/mapping-profile-store";

export type Nivel20TrainerActionState = {
  error?: string;
  inspection?: Nivel20TrainerInspection;
  savedProfile?: Nivel20MappingProfile;
};

export async function inspectNivel20TrainerAction(
  _previousState: Nivel20TrainerActionState,
  formData: FormData,
): Promise<Nivel20TrainerActionState> {
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!sourceUrl) {
    return {
      error: "Pega una URL de Nivel20 para inspeccionar la fuente.",
    };
  }

  const existingProfile = await getLatestNivel20MappingProfile();
  const inspection = await inspectNivel20SourceForTrainer({
    sourceUrl,
    mappingProfile: existingProfile ?? createDefaultNivel20MappingProfile(),
  });

  return {
    inspection,
  };
}

export async function saveNivel20TrainerProfileAction(
  _previousState: Nivel20TrainerActionState,
  formData: FormData,
): Promise<Nivel20TrainerActionState> {
  const rawProfile = String(formData.get("mappingProfile") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!rawProfile) {
    return {
      error: "No encontre un perfil de mapeo para guardar.",
    };
  }

  let parsedProfile: Nivel20MappingProfile;

  try {
    parsedProfile = JSON.parse(rawProfile) as Nivel20MappingProfile;
  } catch {
    return {
      error: "El perfil de mapeo no tiene un JSON valido.",
    };
  }

  const savedProfile = await saveNivel20MappingProfile(parsedProfile);
  const inspection = sourceUrl
    ? await inspectNivel20SourceForTrainer({
        sourceUrl,
        mappingProfile: savedProfile,
      })
    : undefined;

  return {
    inspection,
    savedProfile,
  };
}
