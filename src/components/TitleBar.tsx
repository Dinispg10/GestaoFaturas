import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./TitleBar.css";

type Props = {
  title?: string;
};

export default function TitleBar({ title: _title }: Props) {
  const appWindow = useMemo(() => getCurrentWindow(), []);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const syncMaximizedState = async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch {
        // Ignora erro em ambientes sem API da janela (ex.: browser normal)
      }
    };

    // Estado inicial
    syncMaximizedState();

    // Atualiza quando redimensiona
    const unlistenPromise = appWindow.onResized(syncMaximizedState);

    return () => {
      unlistenPromise
        .then((unlisten) => unlisten())
        .catch(() => {
          // Ignora erro ao desligar listener
        });
    };
  }, [appWindow]);

  async function minimize() {
    await appWindow.minimize();
  }

  async function toggleMaximize() {
    const max = await appWindow.isMaximized();

    if (max) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }

    setIsMaximized(!max);
  }

  async function close() {
    await appWindow.close();
  }

  return (
    <div className="titlebar-root">
      <div className="titlebar-drag" data-tauri-drag-region>
        <div className="titlebar-spacer" />

        <div className="titlebar-actions" data-tauri-drag-region={false}>
          <button
            className="tb-btn"
            onClick={minimize}
            aria-label="Minimizar"
            title="Minimizar"
            data-tauri-drag-region={false}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="tb-icon">
              <path d="M6 12h12" />
            </svg>
          </button>

          <button
            className="tb-btn"
            onClick={toggleMaximize}
            aria-label={isMaximized ? "Restaurar" : "Maximizar"}
            title={isMaximized ? "Restaurar" : "Maximizar"}
            data-tauri-drag-region={false}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="tb-icon">
              {isMaximized ? (
                <>
                  <path d="M9 6h9v9" />
                  <path d="M15 6v3h-6v9h9v-6h-3" />
                </>
              ) : (
                <path d="M7 7h10v10H7z" />
              )}
            </svg>
          </button>

          <button
            className="tb-btn tb-close"
            onClick={close}
            aria-label="Fechar"
            title="Fechar"
            data-tauri-drag-region={false}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="tb-icon">
              <path d="M7 7l10 10M17 7L7 17" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}