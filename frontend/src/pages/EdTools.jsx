import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import ToolCard from "../components/ToolCard";
import BottomSheet from "../components/BottomSheet";
import YoutubeIcon from "../assets/icons/YoutubeIcon";
import YtMusicTool from "../components/tools/YtMusicTool";
import "./EdTools.css";

export default function EdTools() {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "ED.TOOLS";

    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute("content", "noindex, nofollow");

    return () => {
      document.title = prevTitle;
      if (created && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (prevContent != null) {
        meta.setAttribute("content", prevContent);
      } else {
        meta.removeAttribute("content");
      }
    };
  }, []);

  return (
    <div className="ed-tools">
      <nav className="ed-tools__nav glass">
        <span className="ed-tools__brand">ED.TOOLS</span>
      </nav>

      <main className="ed-tools__main">
        <header className="ed-tools__header">
          <h1>
            Hi! Welcome to <span className="ed-tools__accent">ED.TOOLS</span>
          </h1>
        </header>

        <section className="ed-tools__container" aria-label="Tools">
          <div className="tool-grid">
            <ToolCard
              icon={<YoutubeIcon />}
              name="YT Music Download + Trim"
              description="Paste a YouTube link, grab the audio, trim it like a voice memo, and download the cut."
              onUse={() => setSheetOpen(true)}
            />
          </div>
        </section>
      </main>

      <div className="ed-tools__theme">
        <ThemeToggle />
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="YT Music Download + Trim"
      >
        <YtMusicTool onComplete={() => setSheetOpen(false)} />
      </BottomSheet>
    </div>
  );
}
