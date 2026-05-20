"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type CharacterSyncClientProps = {
  characterId: string;
  source: "LOCAL" | "NIVEL20";
  hasSyncableSource: boolean;
  sourceLabel: string;
  lastSyncedAt?: string | null;
  syncStatus: "NEVER_SYNCED" | "SYNCING" | "SYNCED" | "ERROR";
  syncError?: string | null;
};

const syncStages = [
  "Levantando los datos de Nivel20",
  "Comparando los datos con los actuales",
  "Actualizando novedades",
  "Listo",
];

export function CharacterSyncClient({
  characterId,
  source,
  hasSyncableSource,
  sourceLabel,
  lastSyncedAt,
  syncStatus,
  syncError,
}: CharacterSyncClientProps) {
  const router = useRouter();
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hasSyncableSource || hasAutoStarted) {
      return;
    }

    setHasAutoStarted(true);
    void runSyncFlow();
  }, [hasAutoStarted, hasSyncableSource]);

  const originLabel = useMemo(
    () => (source === "NIVEL20" ? "Origen: Nivel20" : "Origen: Local"),
    [source],
  );

  async function runSyncFlow() {
    setIsOverlayVisible(true);
    setActiveStage(0);
    setMessage(null);

    for (let index = 0; index < syncStages.length - 1; index += 1) {
      setActiveStage(index);
      await delay(500);
    }

    const response = await fetch(`/api/characters/${characterId}/sync`, {
      method: "POST",
    });

    const data = (await response.json()) as {
      ok: boolean;
      message: string;
    };

    setActiveStage(syncStages.length - 1);
    setMessage(data.message);
    await delay(500);

    startTransition(() => {
      router.refresh();
    });

    await delay(1000);
    setIsOverlayVisible(false);
  }

  return (
    <>
      <section className="sync-card">
        <div>
          <p className="sync-card__eyebrow">Estado de origen</p>
          <strong>{originLabel}</strong>
          <p>Etiqueta: {sourceLabel}</p>
          <p>
            Ultima actualizacion:{" "}
            {lastSyncedAt ? formatDate(lastSyncedAt) : "Todavia no sincronizado"}
          </p>
          <p>Estado: {renderSyncStatus(syncStatus)}</p>
          {syncError ? <p>Error previo: {syncError}</p> : null}
        </div>

        {hasSyncableSource ? (
          <button
            type="button"
            className="primary-link importer-form__button"
            onClick={() => void runSyncFlow()}
            disabled={isPending || isOverlayVisible}
          >
            Actualizar ahora
          </button>
        ) : null}
      </section>

      {isOverlayVisible ? (
        <div className="sync-overlay" role="status" aria-live="polite">
          <div className="sync-overlay__panel">
            <p className="sync-overlay__eyebrow">Sincronizacion en curso</p>
            <h2>{syncStages[activeStage]}</h2>
            <div className="sync-overlay__progress">
              <span style={{ width: `${((activeStage + 1) / syncStages.length) * 100}%` }} />
            </div>
            <ol className="sync-overlay__steps">
              {syncStages.map((stage, index) => (
                <li
                  key={stage}
                  className={index <= activeStage ? "is-active" : undefined}
                >
                  {stage}
                </li>
              ))}
            </ol>
            {message ? <p>{message}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function delay(durationMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderSyncStatus(
  syncStatus: "NEVER_SYNCED" | "SYNCING" | "SYNCED" | "ERROR",
) {
  switch (syncStatus) {
    case "SYNCED":
      return "Sincronizado";
    case "SYNCING":
      return "Sincronizando";
    case "ERROR":
      return "Con error";
    case "NEVER_SYNCED":
    default:
      return "Nunca sincronizado";
  }
}
