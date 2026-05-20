import { NextResponse } from "next/server";
import { syncCharacterFromSource } from "@/features/characters/server/character-store";

type SyncRouteProps = {
  params: Promise<{
    characterId: string;
  }>;
};

export async function POST(_request: Request, { params }: SyncRouteProps) {
  const { characterId } = await params;

  try {
    const result = await syncCharacterFromSource(characterId);
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "No se pudo sincronizar.",
      },
      {
        status: 400,
      },
    );
  }
}
