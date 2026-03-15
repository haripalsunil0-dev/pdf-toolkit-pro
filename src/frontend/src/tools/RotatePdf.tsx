import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Loader2, RotateCw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

type RotateAngle = 90 | 180 | 270;

const ANGLES: { value: RotateAngle; label: string }[] = [
  { value: 90, label: "90° CW" },
  { value: 180, label: "180°" },
  { value: 270, label: "270° CW" },
];

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

export function RotatePdf({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rotateAll, setRotateAll] = useState(true);
  const [specificPages, setSpecificPages] = useState("");
  const [angle, setAngle] = useState<RotateAngle>(90);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.type !== "application/pdf") return;
    setFile(f);
    setPageCount(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(null);
    }
  };

  const parsePageNums = (input: string, total: number): number[] => {
    const nums = new Set<number>();
    for (const part of input.split(",")) {
      const range = part.trim().split("-");
      if (range.length === 2) {
        const from = Math.max(1, Number.parseInt(range[0]));
        const to = Math.min(total, Number.parseInt(range[1]));
        for (let i = from; i <= to; i++) nums.add(i - 1);
      } else {
        const n = Number.parseInt(part.trim());
        if (!Number.isNaN(n) && n >= 1 && n <= total) nums.add(n - 1);
      }
    }
    return Array.from(nums);
  };

  const process = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();
      const total = pages.length;

      let targets: number[];
      if (rotateAll) {
        targets = pages.map((_, i) => i);
      } else {
        targets = parsePageNums(specificPages, total);
        if (targets.length === 0) {
          toast.error("No valid page numbers entered");
          setLoading(false);
          return;
        }
      }

      for (const idx of targets) {
        const page = pages[idx];
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      }

      const out = await doc.save();
      const blob = new Blob([out.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      downloadBlob(blob, `rotated-${file.name}`);
      toast.success(
        `Rotated ${targets.length} page${targets.length > 1 ? "s" : ""}`,
      );
    } catch (e) {
      toast.error("Failed to rotate PDF");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Rotate Pages"
      description="Fix page orientation in your PDF"
      icon={<RotateCw className="w-4 h-4" />}
      onBack={onBack}
    >
      {/* Upload */}
      <div
        data-ocid="rotate.upload_button"
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
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground text-sm">
            {file ? file.name : "Tap to upload PDF"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {file
              ? `${fmtSize(file.size)}${pageCount != null ? ` · ${pageCount} pages` : ""}`
              : "PDF files only"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {/* Options */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-5">
        <h3 className="font-display font-semibold text-sm">Rotation Options</h3>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Rotation Angle</Label>
          <div
            className="grid grid-cols-3 gap-2"
            data-ocid="rotate.rotate_select"
          >
            {ANGLES.map((a) => (
              <button
                type="button"
                key={a.value}
                onClick={() => setAngle(a.value)}
                className={`px-3 py-2.5 text-xs rounded-lg border transition-all font-medium ${
                  angle === a.value
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-medium">Pages to Rotate</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                checked={rotateAll}
                onChange={() => setRotateAll(true)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">
                All pages{pageCount != null ? ` (${pageCount})` : ""}
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                checked={!rotateAll}
                onChange={() => setRotateAll(false)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">Specific pages</span>
            </label>
          </div>

          {!rotateAll && (
            <input
              type="text"
              value={specificPages}
              onChange={(e) => setSpecificPages(e.target.value)}
              placeholder={`e.g. 1, 3, 5-8${pageCount ? ` (1–${pageCount})` : ""}`}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
          )}
        </div>
      </div>

      <Button
        data-ocid="rotate.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={process}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Rotating...
          </>
        ) : (
          <>
            <Download className="mr-2 w-4 h-4" />
            Rotate &amp; Download
          </>
        )}
      </Button>
    </ToolLayout>
  );
}
