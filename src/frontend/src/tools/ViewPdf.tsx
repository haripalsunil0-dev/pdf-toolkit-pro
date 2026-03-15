import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

interface RenderedPage {
  index: number;
  dataUrl: string;
}

interface Props {
  onBack: () => void;
}

export function ViewPdf({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const loadAndRender = async (f: File) => {
    setFile(f);
    setPages([]);
    setLoading(true);
    try {
      const { pdfjsLib } = await import("@/lib/pdfWorker");
      const bytes = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      setTotalPages(pdf.numPages);
      const rendered: RenderedPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        rendered.push({
          index: i,
          dataUrl: canvas.toDataURL("image/jpeg", 0.85),
        });
      }

      setPages(rendered);
      setCurrentPage(1);
    } catch (e) {
      toast.error("Failed to render PDF");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToPage = (n: number) => {
    const el = pageRefs.current[n - 1];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(n);
  };

  return (
    <ToolLayout
      title="View PDF"
      description="Read and browse PDF documents"
      icon={<BookOpen className="w-4 h-4" />}
      onBack={onBack}
    >
      {!file ? (
        <div
          data-ocid="tool.upload_button"
          className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[200px] flex flex-col items-center justify-center gap-3 p-6 ${dragOver ? "dragover border-primary" : ""}`}
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
            if (f?.type === "application/pdf") loadAndRender(f);
          }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Tap to open a PDF</p>
            <p className="text-xs text-muted-foreground mt-1">PDF files only</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadAndRender(f);
            }}
          />
        </div>
      ) : (
        <>
          {/* File info + controls */}
          <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shadow-card">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              {totalPages > 0 && (
                <p className="text-xs text-muted-foreground">
                  {totalPages} pages
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              className="shrink-0 text-xs"
            >
              Change
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadAndRender(f);
              }}
            />
          </div>

          {loading && (
            <div
              data-ocid="tool.loading_state"
              className="flex items-center justify-center gap-3 py-16 text-muted-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Rendering pages...</span>
            </div>
          )}

          {pages.length > 0 && (
            <>
              {/* Page navigator */}
              <div className="sticky top-[57px] z-10 flex items-center justify-between bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <p className="text-sm font-medium">
                  Page{" "}
                  <span className="text-primary font-bold">{currentPage}</span>{" "}
                  of {totalPages}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() =>
                    scrollToPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Pages */}
              <div className="space-y-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.index}
                    ref={(el) => {
                      pageRefs.current[idx] = el;
                    }}
                    onMouseEnter={() => setCurrentPage(p.index)}
                    className="relative rounded-xl overflow-hidden border border-border shadow-card bg-white"
                  >
                    <div className="absolute top-2 left-2 z-10 bg-foreground/70 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {p.index}
                    </div>
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.index}`}
                      className="w-full h-auto block"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </ToolLayout>
  );
}
