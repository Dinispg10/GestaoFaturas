import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Props = {
  title?: string;
};

export default function TitleBar({ title = "Farmácia Pinto" }: Props) {
  const appWindow = useMemo(() => getCurrentWindow(), []);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // estado inicial
    (async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch {}
    })();

    // atualiza quando muda
    const unlistenPromise = appWindow.onResized(async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch {}
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten()).catch(() => {});
    };
  }, [appWindow]);

  async function minimize() {
    await appWindow.minimize();
  }

  async function toggleMaximize() {
    const max = await appWindow.isMaximized();
    if (max) await appWindow.unmaximize();
    else await appWindow.maximize();
    setIsMaximized(!max);
  }

  async function close() {
    await appWindow.close();
  }

  return (
    <div className="titlebar-root">
      {/* zona que arrasta */}
      <div className="titlebar-drag" data-tauri-drag-region>
        <div className="titlebar-left" data-tauri-drag-region>
          <div className="titlebar-logo" data-tauri-drag-region />
          <div className="titlebar-title" data-tauri-drag-region>
            {title}
          </div>
        </div>

        <div className="titlebar-spacer" data-tauri-drag-region />

        {/* botões */}
        <div className="titlebar-actions">
          <button className="tb-btn" onClick={minimize} aria-label="Minimizar">
            <span className="tb-icon">—</span>
          </button>

          <button
            className="tb-btn"
            onClick={toggleMaximize}
            aria-label={isMaximized ? "Restaurar" : "Maximizar"}
          >
            <span className="tb-icon">{isMaximized ? "❐" : "□"}</span>
          </button>

          <button className="tb-btn tb-close" onClick={close} aria-label="Fechar">
            <span className="tb-icon">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
