import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";



type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "upToDate" }
  | { kind: "available"; version: string; notes: string | null }
  | { kind: "downloading"; percent: number }
  | { kind: "error"; message: string };

export default function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>({ kind: "idle" });

  async function handleCheck() {
    setStatus({ kind: "checking" });
    try {
      const update = await check();
      if (!update) {
        setStatus({ kind: "upToDate" });
        return;
      }
      setStatus({
        kind: "available",
        version: update.version,
        notes: update.body ?? null,
      });
    } catch (e) {
      setStatus({ kind: "error", message: String(e) });
    }
  }

  async function handleInstall() {
    if (status.kind !== "available") return;

    const update = await check();
    if (!update) return;

    let downloaded = 0;
    let total = 0;

    await update.downloadAndInstall((progress) => {
      if (progress.event === "Started") {
        total = progress.data.contentLength ?? 0;
        setStatus({ kind: "downloading", percent: 0 });
      } else if (progress.event === "Progress") {
        downloaded += progress.data.chunkLength;
        const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
        setStatus({ kind: "downloading", percent });
      } else if (progress.event === "Finished") {
        setStatus({ kind: "downloading", percent: 100 });
      }
    });

    await relaunch();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {status.kind === "idle" && (
        <button className="update-btn" onClick={handleCheck} title="Verificar Atualizações">
          🔄 Verificar Atualizações
        </button>
      )}

      {status.kind === "checking" && (
        <span className="update-msg">A verificar atualizações...</span>
      )}

      {status.kind === "upToDate" && (
        <span className="update-msg update-ok" onClick={() => setStatus({ kind: "idle" })}>
          ✅ App atualizada
        </span>
      )}

      {status.kind === "available" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="update-msg update-new">
            🆕 Versão {status.version} disponível
          </span>
          <button className="update-btn update-install" onClick={handleInstall}>
            Instalar e reiniciar
          </button>
        </div>
      )}

      {status.kind === "downloading" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="update-msg">A descarregar... {status.percent}%</span>
          <div className="update-progress-bar">
            <div
              className="update-progress-fill"
              style={{ width: `${status.percent}%` }}
            />
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <span
          className="update-msg update-error"
          onClick={() => setStatus({ kind: "idle" })}
          title={status.message}
        >
          ❌ Erro ao verificar
        </span>
      )}
    </div>
  );
}
