import { Button } from "@/components/ui/button";
import {
  Check,
  Download,
  FolderOpen,
  MoveDown,
  MoveUp,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

interface PdfEntry {
  id: string;
  file: File;
  displayName: string;
  editing: boolean;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeName(name: string): string {
  const n = name.trim();
  if (!n) return "document.pdf";
  return n.endsWith(".pdf") ? n : `${n}.pdf`;
}

interface Props {
  onBack: () => void;
}

export function OrganizePdf({ onBack }: Props) {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const newEntries: PdfEntry[] = [];
    for (const f of Array.from(fl)) {
      if (f.type !== "application/pdf") continue;
      newEntries.push({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        displayName: f.name,
        editing: false,
      });
    }
    setEntries((prev) => [...prev, ...newEntries]);
  };

  const remove = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const move = (idx: number, dir: -1 | 1) => {
    setEntries((prev) => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  };

  const startEdit = (id: string) => {
    setEntries((prev) => prev.map((e) => ({ ...e, editing: e.id === id })));
  };

  const updateName = (id: string, name: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, displayName: name } : e)),
    );
  };

  const finishEdit = (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, editing: false, displayName: sanitizeName(e.displayName) }
          : e,
      ),
    );
  };

  const downloadAll = async () => {
    if (entries.length === 0) return;
    let downloadCount = 0;
    for (const entry of entries) {
      try {
        const bytes = await entry.file.arrayBuffer();
        const blob = new Blob([bytes], { type: "application/pdf" });
        downloadBlob(blob, entry.displayName);
        downloadCount++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        toast.error(`Failed to download ${entry.displayName}`);
        console.error(e);
      }
    }
    toast.success(
      `Downloaded ${downloadCount} file${downloadCount > 1 ? "s" : ""}`,
    );
  };

  return (
    <ToolLayout
      title="Organize Files"
      description="Rename and reorder your PDFs"
      icon={<FolderOpen className="w-4 h-4" />}
      onBack={onBack}
    >
      {/* Upload */}
      <div
        data-ocid="organize.upload_button"
        className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[120px] flex flex-col items-center justify-center gap-3 p-6 ${
          dragOver ? "dragover border-primary" : ""
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground text-sm">Add PDF files</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tap or drop to add
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {entries.length} file{entries.length > 1 ? "s" : ""} — reorder and
            rename
          </p>
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border shadow-card"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {entry.editing ? (
                    <input
                      type="text"
                      value={entry.displayName}
                      onChange={(e) => updateName(entry.id, e.target.value)}
                      onBlur={() => finishEdit(entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape")
                          finishEdit(entry.id);
                      }}
                      className="w-full px-2 py-1 text-sm bg-background border border-primary/60 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  ) : (
                    <div>
                      <p className="text-sm font-medium truncate">
                        {entry.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtSize(entry.file.size)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {entry.editing ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-primary"
                      onClick={() => finishEdit(entry.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => startEdit(entry.id)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => move(i, 1)}
                    disabled={i === entries.length - 1}
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:text-destructive"
                    onClick={() => remove(entry.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {entries.length === 0 && (
        <div
          data-ocid="organize.empty_state"
          className="text-center py-8 text-muted-foreground"
        >
          <p className="text-sm">Add PDF files above to organize them.</p>
        </div>
      )}

      <Button
        data-ocid="organize.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={downloadAll}
        disabled={entries.length === 0}
      >
        <Download className="mr-2 w-4 h-4" />
        Download All Files ({entries.length})
      </Button>
    </ToolLayout>
  );
}
