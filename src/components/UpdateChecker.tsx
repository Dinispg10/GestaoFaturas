import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { exit } from "@tauri-apps/plugin-process";
import { Button } from "./Button";



type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "upToDate" }
  | { kind: "available"; version: string; notes: string | null }
  | { kind: "installed" }
  | { kind: "downloading"; percent: number }
  | { kind: "error"; message: string };

export default function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>({ kind: "idle" });

  async function handleCheck() {
    if (status.kind === "checking") return;
    setStatus({ kind: "checking" });
    try {
      const update = await check();
      if (!update) {
        setStatus({ kind: "upToDate" });
        setTimeout(() => setStatus({ kind: "idle" }), 3000);
        return;
      }
      setStatus({
        kind: "available",
        version: update.version,
        notes: update.body ?? null,
      });
    } catch (e) {
      setStatus({ kind: "error", message: String(e) });
      setTimeout(() => setStatus({ kind: "idle" }), 5000);
    }
  }

  async function handleInstall() {
    if (status.kind !== "available") return;

    try {
      const update = await check();
      if (!update) {
        setStatus({ kind: "upToDate" });
        return;
      }
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

      setStatus({ kind: "installed" });
    } catch (e) {
      setStatus({ kind: "error", message: String(e) });
    }
  }

  async function handleRestart() {
    await exit(0);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {status.kind === "idle" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCheck}
          title="Verificar Atualizações"
          style={{ padding: '8px 10px', minWidth: 'auto' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
          </svg>
        </Button>
      )}

      {status.kind === "checking" && (
        <span className="update-msg" style={{ fontSize: '13px', color: '#677283' }}>Checking...</span>
      )}

      {status.kind === "upToDate" && (
        <span className="update-msg update-ok" style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 600 }}>
          ✓ Updated
        </span>
      )}

      {status.kind === "available" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="update-msg update-new" style={{ fontSize: '13px', color: '#4f2d74', fontWeight: 600 }}>
            New v{status.version}
          </span>
          <Button variant="primary" size="sm" onClick={handleInstall}>
            Install
          </Button>
        </div>
      )}

      {status.kind === "downloading" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="update-msg" style={{ fontSize: '12px' }}>{status.percent}%</span>
          <div style={{ width: '60px', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{ width: `${status.percent}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s' }}
            />
          </div>
        </div>
      )}

      {status.kind === "installed" && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="update-msg update-ok" style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 600 }}>✓ Done</span>
          <Button variant="primary" size="sm" onClick={handleRestart}>
            Relaunch Now
          </Button>
        </div>
      )}

      {status.kind === "error" && (
        <span
          className="update-msg update-error"
          onClick={() => setStatus({ kind: "idle" })}
          title={status.message}
          style={{ fontSize: '12px', color: '#d32f2f', cursor: 'pointer' }}
        >
          ⚠ Error
        </span>
      )}
    </div>
  );
}
