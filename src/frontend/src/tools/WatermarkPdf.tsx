import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download, Droplets, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

type Position =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
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

export function WatermarkPdf({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState<Position>("center");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = async () => {
    if (!file || !text.trim()) return;
    setLoading(true);
    try {
      const { PDFDocument, rgb, degrees } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = text.length * (fontSize * 0.5);
        const textHeight = fontSize;

        let x = 0;
        let y = 0;
        let rotate = degrees(0);

        if (position === "center") {
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
          rotate = degrees(-30);
        } else if (position === "top-left") {
          x = 40;
          y = height - textHeight - 40;
        } else if (position === "top-right") {
          x = width - textWidth - 40;
          y = height - textHeight - 40;
        } else if (position === "bottom-left") {
          x = 40;
          y = 40;
        } else {
          x = width - textWidth - 40;
          y = 40;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate,
        });
      }

      const out = await doc.save();
      const blob = new Blob([out.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      downloadBlob(blob, `watermarked-${file.name}`);
      toast.success(
        `Watermark added to ${pages.length} page${pages.length > 1 ? "s" : ""}`,
      );
    } catch (e) {
      toast.error("Failed to add watermark");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Add Watermark"
      description="Stamp text on every PDF page"
      icon={<Droplets className="w-4 h-4" />}
      onBack={onBack}
    >
      {/* Upload */}
      <div
        data-ocid="watermark.upload_button"
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
          if (f?.type === "application/pdf") setFile(f);
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
            {file ? fmtSize(file.size) : "PDF files only"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
      </div>

      {/* Options */}
      <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-5">
        <h3 className="font-display font-semibold text-sm">
          Watermark Options
        </h3>

        <div className="space-y-2">
          <Label htmlFor="wm-text" className="text-xs font-medium">
            Watermark Text
          </Label>
          <input
            id="wm-text"
            data-ocid="watermark.text_input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter watermark text"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Font Size</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {fontSize}pt
            </span>
          </div>
          <Slider
            min={12}
            max={72}
            step={2}
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Opacity</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <Slider
            min={10}
            max={100}
            step={5}
            value={[Math.round(opacity * 100)]}
            onValueChange={([v]) => setOpacity(v / 100)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Position</Label>
          <div className="grid grid-cols-3 gap-2">
            {POSITIONS.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setPosition(p.value)}
                className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                  position === p.value
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        data-ocid="watermark.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={process}
        disabled={!file || !text.trim() || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Adding Watermark...
          </>
        ) : (
          <>
            <Download className="mr-2 w-4 h-4" />
            Apply Watermark &amp; Download
          </>
        )}
      </Button>
    </ToolLayout>
  );
}
