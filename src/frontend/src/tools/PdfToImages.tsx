import { Button } from "@/components/ui/button";
import { Download, FileImage, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

interface PageImage {
  index: number;
  dataUrl: string;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

interface Props {
  onBack: () => void;
}

export function PdfToImages({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [images, setImages] = useState<PageImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (f: File) => {
    setFile(f);
    setImages([]);
    try {
      const { pdfjsLib } = await import("@/lib/pdfWorker");
      const bytes = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPageCount(pdf.numPages);
    } catch {
      toast.error("Failed to read PDF");
    }
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setImages([]);
    try {
      const { pdfjsLib } = await import("@/lib/pdfWorker");
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const results: PageImage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        results.push({ index: i, dataUrl: canvas.toDataURL("image/png") });
      }

      setImages(results);
      toast.success(`Converted ${pdf.numPages} pages to images`);
    } catch (e) {
      toast.error("Conversion failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = async () => {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const img of images) {
        const base64 = img.dataUrl.split(",")[1];
        zip.file(`page-${img.index}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdf-pages.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Failed to create zip");
    }
  };

  return (
    <ToolLayout
      title="PDF to Images"
      description="Export each PDF page as a PNG image"
      icon={<FileImage className="w-4 h-4" />}
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
        onClick={convert}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Converting pages...
          </>
        ) : (
          <>
            <FileImage className="mr-2 w-4 h-4" />
            Convert to Images
          </>
        )}
      </Button>

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {images.length} pages converted
            </p>
            <Button
              data-ocid="tool.download_button"
              variant="outline"
              size="sm"
              onClick={downloadAll}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download All (ZIP)
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <div
                key={img.index}
                className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-card"
              >
                <img
                  src={img.dataUrl}
                  alt={`Page ${img.index}`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={() =>
                      downloadDataUrl(img.dataUrl, `page-${img.index}.png`)
                    }
                  >
                    <Download className="w-3 h-3" />
                    Page {img.index}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
