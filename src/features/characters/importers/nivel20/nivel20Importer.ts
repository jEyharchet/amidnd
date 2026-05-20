import type { Nivel20ImportResult } from "@/features/characters/importers/nivel20/types";

const nivel20Hosts = new Set(["nivel20.com", "www.nivel20.com"]);

export function analyzeNivel20Url(input: string): Nivel20ImportResult {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return {
      status: "invalid-url",
      input,
      looksLikeCharacterUrl: false,
      message: "Pegá una URL para poder analizarla.",
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedInput);
  } catch {
    return {
      status: "invalid-url",
      input,
      looksLikeCharacterUrl: false,
      message: "La URL no tiene un formato valido.",
    };
  }

  const detectedDomain = parsedUrl.hostname.toLowerCase();

  if (!nivel20Hosts.has(detectedDomain)) {
    return {
      status: "invalid-url",
      input,
      normalizedUrl: parsedUrl.toString(),
      detectedDomain,
      looksLikeCharacterUrl: false,
      message: "La URL no pertenece a nivel20.com.",
    };
  }

  const pathname = parsedUrl.pathname.toLowerCase();
  const looksLikeCharacterUrl =
    pathname.includes("personaje") ||
    pathname.includes("character") ||
    pathname.includes("pj") ||
    pathname.includes("sheet");

  if (!looksLikeCharacterUrl) {
    return {
      status: "unsupported-url",
      input,
      normalizedUrl: parsedUrl.toString(),
      detectedDomain,
      looksLikeCharacterUrl: false,
      message: "La URL es de Nivel20, pero no parece una ficha de personaje compartida.",
      nextStep: "Pendiente: analizar HTML/PDF/export si Nivel20 lo permite.",
    };
  }

  return {
    status: "valid-url",
    input,
    normalizedUrl: parsedUrl.toString(),
    detectedDomain,
    looksLikeCharacterUrl: true,
    message: "URL valida para una prueba tecnica de importacion.",
    nextStep: "Pendiente: analizar HTML/PDF/export si Nivel20 lo permite.",
  };
}
