export type Nivel20ImportStatus = "valid-url" | "invalid-url" | "unsupported-url";

export type Nivel20ImportResult = {
  status: Nivel20ImportStatus;
  input: string;
  normalizedUrl?: string;
  detectedDomain?: string;
  looksLikeCharacterUrl: boolean;
  message: string;
  nextStep?: string;
};
