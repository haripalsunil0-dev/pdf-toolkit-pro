import { Button } from "@/components/ui/button";
import { GitMerge, Loader2, MoveDown, MoveUp, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: string;
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

interface Props {
  onBack: () => void;
}

export function MergePdfs({ onBack }: Props) {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const newFiles: PdfFile[] = [];
    for (const f of Array.from(fl)) {
      if (f.type !== "application/pdf") continue;
      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        size: fmtSize(f.size),
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const remove = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const move = (idx: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  };

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const pf of files) {
        const bytes = await pf.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        for (const p of pages) merged.addPage(p);
      }
      const bytes = await merged.save();
      downloadBlob(
        new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        "merged.pdf",
      );
      toast.success(`Merged ${files.length} PDFs successfully`);
    } catch (e) {
      toast.error("Merge failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Merge PDFs"
      description="Combine multiple PDFs into one"
      icon={<GitMerge className="w-4 h-4" />}
      onBack={onBack}
    >
      <div
        data-ocid="tool.upload_button"
        className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[120px] flex flex-col items-center justify-center gap-3 p-6 ${dragOver ? "dragover border-primary" : ""}`}
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
            Add 2 or more to merge
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

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {files.length} file{files.length > 1 ? "s" : ""} — drag to reorder
          </p>
          <AnimatePresence initial={false}>
            {files.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shadow-card"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.size}</p>
                </div>
                <div className="flex items-center gap-1">
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
                    disabled={i === files.length - 1}
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:text-destructive"
                    onClick={() => remove(f.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Button
        data-ocid="tool.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={merge}
        disabled={files.length < 2 || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Merging...
          </>
        ) : (
          <>
            <GitMerge className="mr-2 w-4 h-4" />
            Merge {files.length > 0 ? `${files.length} PDFs` : "PDFs"}
          </>
        )}
      </Button>
    </ToolLayout>
  );
}
