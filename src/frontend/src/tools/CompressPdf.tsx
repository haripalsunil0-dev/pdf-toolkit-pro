import { Button } from "@/components/ui/button";
import { Download, Loader2, Upload, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

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

export function CompressPdf({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    originalSize: number;
    newSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const compressed = await doc.save({ useObjectStreams: true });
      const blob = new Blob([compressed.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      setResult({
        blob,
        originalSize: file.size,
        newSize: compressed.byteLength,
      });
      const ratio = (
        ((file.size - compressed.byteLength) / file.size) *
        100
      ).toFixed(1);
      toast.success(`Compressed by ${ratio}%`);
    } catch (e) {
      toast.error("Compression failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const savings = result
    ? (
        ((result.originalSize - result.newSize) / result.originalSize) *
        100
      ).toFixed(1)
    : "0";

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size"
      icon={<Zap className="w-4 h-4" />}
      onBack={onBack}
    >
      <div
        data-ocid="tool.upload_button"
        className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[140px] flex flex-col items-center justify-center gap-3 p-6 ${dragOver ? "dragover border-primary" : ""}`}
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
          if (f?.type === "application/pdf") {
            setFile(f);
            setResult(null);
          }
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
            {file ? `Original: ${fmtSize(file.size)}` : "PDF files only"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setResult(null);
            }
          }}
        />
      </div>

      <Button
        data-ocid="tool.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={compress}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Compressing...
          </>
        ) : (
          <>
            <Zap className="mr-2 w-4 h-4" />
            Compress PDF
          </>
        )}
      </Button>

      {result && (
        <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
          <h3 className="font-display font-semibold">Compression Results</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Original</p>
              <p className="font-semibold text-sm">
                {fmtSize(result.originalSize)}
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary/80 mb-1">Saved</p>
              <p className="font-bold text-sm text-primary">{savings}%</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">New Size</p>
              <p className="font-semibold text-sm">{fmtSize(result.newSize)}</p>
            </div>
          </div>
          <Button
            data-ocid="tool.download_button"
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() =>
              downloadBlob(
                result.blob,
                `compressed-${file?.name ?? "output.pdf"}`,
              )
            }
          >
            <Download className="w-4 h-4" />
            Download Compressed PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  );
}
