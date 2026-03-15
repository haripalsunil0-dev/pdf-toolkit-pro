import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  Droplets,
  FileImage,
  FolderOpen,
  GitMerge,
  ImageIcon,
  Lock,
  Moon,
  RotateCw,
  Scissors,
  Star,
  Sun,
  Wrench,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CompressPdf } from "./tools/CompressPdf";
import { ImageToPdf } from "./tools/ImageToPdf";
import { MergePdfs } from "./tools/MergePdfs";
import { OrganizePdf } from "./tools/OrganizePdf";
import { PasswordPdf } from "./tools/PasswordPdf";
import { PdfToImages } from "./tools/PdfToImages";
import { RotatePdf } from "./tools/RotatePdf";
import { SplitPdf } from "./tools/SplitPdf";
import { ViewPdf } from "./tools/ViewPdf";
import { WatermarkPdf } from "./tools/WatermarkPdf";

type Tool =
  | "home"
  | "image-to-pdf"
  | "pdf-to-images"
  | "merge"
  | "split"
  | "compress"
  | "view"
  | "watermark"
  | "password"
  | "rotate"
  | "organize";

const TOOLS = [
  {
    id: "image-to-pdf" as Tool,
    label: "Image to PDF",
    description: "Convert photos & images",
    icon: ImageIcon,
    gradient: "from-rose-500 to-orange-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "pdf-to-images" as Tool,
    label: "PDF to Images",
    description: "Export pages as PNG",
    icon: FileImage,
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "merge" as Tool,
    label: "Merge PDFs",
    description: "Combine multiple files",
    icon: GitMerge,
    gradient: "from-red-600 to-rose-500",
    bg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    id: "split" as Tool,
    label: "Split PDF",
    description: "Extract individual pages",
    icon: Scissors,
    gradient: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "compress" as Tool,
    label: "Compress PDF",
    description: "Reduce file size",
    icon: Zap,
    gradient: "from-red-500 to-orange-600",
    bg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-500 dark:text-red-400",
  },
  {
    id: "view" as Tool,
    label: "View PDF",
    description: "Read & browse documents",
    icon: BookOpen,
    gradient: "from-rose-600 to-red-700",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-700 dark:text-rose-400",
  },
  {
    id: "watermark" as Tool,
    label: "Add Watermark",
    description: "Stamp text on every page",
    icon: Droplets,
    gradient: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "password" as Tool,
    label: "Lock / Unlock",
    description: "Password protect PDF",
    icon: Lock,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "rotate" as Tool,
    label: "Rotate Pages",
    description: "Fix page orientation",
    icon: RotateCw,
    gradient: "from-teal-500 to-emerald-500",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "organize" as Tool,
    label: "Organize Files",
    description: "Rename & reorder PDFs",
    icon: FolderOpen,
    gradient: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
];

function initTheme(): boolean {
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function App() {
  const [tool, setTool] = useState<Tool>("home");
  const [dark, setDark] = useState<boolean>(initTheme);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("pdf-toolkit-favorites") ?? "[]",
      ) as string[];
    } catch {
      return [];
    }
  });

  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem("pdf-toolkit-favorites", JSON.stringify(next));
      return next;
    });
  };

  const filteredTools = search
    ? TOOLS.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()))
    : TOOLS;

  const favoriteTools = TOOLS.filter((t) => favorites.includes(t.id));

  const renderToolCard = (
    t: (typeof TOOLS)[0],
    i: number,
    inFavSection = false,
  ) => {
    const Icon = t.icon;
    const isFav = favorites.includes(t.id);
    const ocidSuffix = inFavSection ? `fav.${i + 1}` : `${i + 1}`;
    return (
      <motion.div
        key={`${t.id}-${inFavSection ? "fav" : "main"}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
        className="relative group"
      >
        <motion.button
          data-ocid={`home.tool_card.${ocidSuffix}`}
          whileHover={{
            y: -3,
            boxShadow: "0 8px 24px -4px oklch(0.56 0.22 25 / 0.2)",
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setTool(t.id)}
          className="w-full text-left p-4 bg-card rounded-2xl border border-border shadow-card hover:border-primary/30 transition-colors"
        >
          <div
            className={`w-11 h-11 rounded-xl ${t.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
          >
            <Icon className={`w-5 h-5 ${t.iconColor}`} />
          </div>
          <p className="font-display font-semibold text-foreground text-sm leading-tight">
            {t.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            {t.description}
          </p>
        </motion.button>
        <button
          type="button"
          data-ocid={`home.tool_card.fav_toggle.${i + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(t.id);
          }}
          className={`absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full transition-all ${
            isFav
              ? "text-amber-500 bg-amber-50 dark:bg-amber-950/50"
              : "text-muted-foreground/40 hover:text-amber-400 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-950/30"
          }`}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={isFav ? "currentColor" : "none"}
          />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {tool === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header */}
            <header className="bg-card border-b border-border px-4 pt-10 pb-5">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-tool">
                    <Wrench className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="font-display text-2xl font-bold flex-1">
                    PDF <span className="shimmer-text">Toolkit Pro</span>
                  </h1>
                  <button
                    type="button"
                    data-ocid="home.darkmode_toggle"
                    onClick={() => setDark((d) => !d)}
                    className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label={
                      dark ? "Switch to light mode" : "Switch to dark mode"
                    }
                  >
                    {dark ? (
                      <Sun className="w-4.5 h-4.5" />
                    ) : (
                      <Moon className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground ml-13 pl-[52px]">
                  All PDF tools in one place — free &amp; private
                </p>
              </div>
            </header>

            {/* Feature banner */}
            <div className="bg-primary/5 border-b border-primary/10 px-4 py-3">
              <div className="max-w-2xl mx-auto flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                100% client-side processing — your files never leave your device
              </div>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto w-full px-4 pt-5">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  data-ocid="home.search_input"
                  type="search"
                  placeholder="Search tools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">
              {/* Favorites section */}
              {!search && favoriteTools.length > 0 && (
                <div data-ocid="home.favorites.section" className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    Favorites
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {favoriteTools.map((t, i) => renderToolCard(t, i, true))}
                  </div>
                </div>
              )}

              {/* All tools */}
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {search ? `Results for "${search}"` : "All Tools"}
              </p>
              {filteredTools.length === 0 ? (
                <div
                  data-ocid="home.tools.empty_state"
                  className="text-center py-12 text-muted-foreground"
                >
                  <p className="text-sm">No tools match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredTools.map((t, i) => renderToolCard(t, i, false))}
                </div>
              )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border px-4 py-5">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground">
                  &copy; {year}.{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Built with ♥ using caffeine.ai
                  </a>
                </p>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div key={tool} className="flex-1">
            {tool === "image-to-pdf" && (
              <ImageToPdf onBack={() => setTool("home")} />
            )}
            {tool === "pdf-to-images" && (
              <PdfToImages onBack={() => setTool("home")} />
            )}
            {tool === "merge" && <MergePdfs onBack={() => setTool("home")} />}
            {tool === "split" && <SplitPdf onBack={() => setTool("home")} />}
            {tool === "compress" && (
              <CompressPdf onBack={() => setTool("home")} />
            )}
            {tool === "view" && <ViewPdf onBack={() => setTool("home")} />}
            {tool === "watermark" && (
              <WatermarkPdf onBack={() => setTool("home")} />
            )}
            {tool === "password" && (
              <PasswordPdf onBack={() => setTool("home")} />
            )}
            {tool === "rotate" && <RotatePdf onBack={() => setTool("home")} />}
            {tool === "organize" && (
              <OrganizePdf onBack={() => setTool("home")} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" richColors />
    </div>
  );
}
