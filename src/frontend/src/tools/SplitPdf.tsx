import { Button } from "@/components/ui/button";
import { Download, Loader2, Scissors, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

interface SplitPage {
  index: number;
  blob: Blob;
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

export function SplitPdf({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<SplitPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (f: File) => {
    setFile(f);
    setPages([]);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
    } catch {
      toast.error("Failed to read PDF");
    }
  };

  const split = async () => {
    if (!file) return;
    setLoading(true);
    setPages([]);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const results: SplitPage[] = [];

      for (let i = 0; i < src.getPageCount(); i++) {
        const single = await PDFDocument.create();
        const [page] = await single.copyPages(src, [i]);
        single.addPage(page);
        const out = await single.save();
        results.push({
          index: i + 1,
          blob: new Blob([out.buffer as ArrayBuffer], {
            type: "application/pdf",
          }),
        });
      }

      setPages(results);
      toast.success(`Split into ${results.length} separate PDFs`);
    } catch (e) {
      toast.error("Split failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const p of pages) {
      zip.file(`page-${p.index}.pdf`, p.blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "split-pages.zip");
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Extract each page as a separate PDF"
      icon={<Scissors className="w-4 h-4" />}
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
          if (f?.type === "application/pdf") loadFile(f);
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
            {file ? `${pageCount} pages detected` : "PDF files only"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadFile(f);
          }}
        />
      </div>

      <Button
        data-ocid="tool.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={split}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Splitting...
          </>
        ) : (
          <>
            <Scissors className="mr-2 w-4 h-4" />
            Split into {pageCount > 0 ? `${pageCount} Pages` : "Pages"}
          </>
        )}
      </Button>

      {pages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {pages.length} pages extracted
            </p>
            <Button
              data-ocid="tool.download_button"
              variant="outline"
              size="sm"
              onClick={downloadAll}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              All as ZIP
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {pages.map((p) => (
              <div
                key={p.index}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shadow-card"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {p.index}
                  </span>
                </div>
                <p className="flex-1 text-sm font-medium">Page {p.index}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => downloadBlob(p.blob, `page-${p.index}.pdf`)}
                >
                  <Download className="w-3 h-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
