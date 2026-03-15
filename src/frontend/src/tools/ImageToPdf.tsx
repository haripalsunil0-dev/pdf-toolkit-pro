import { Button } from "@/components/ui/button";
import {
  Download,
  ImageIcon,
  Loader2,
  MoveDown,
  MoveUp,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
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

export function ImageToPdf({ onBack }: Props) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      newImages.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      });
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const remove = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const convert = async () => {
    if (images.length === 0) return;
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const W = 210;
      const H = 297;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        const img = new Image();
        img.src = images[i].preview;
        await new Promise<void>((res) => {
          img.onload = () => res();
        });

        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const ratio = Math.min(W / iw, H / ih);
        const fw = iw * ratio;
        const fh = ih * ratio;
        const x = (W - fw) / 2;
        const y = (H - fh) / 2;

        const ext = images[i].file.type === "image/png" ? "PNG" : "JPEG";
        doc.addImage(images[i].preview, ext, x, y, fw, fh);
      }

      const blob = doc.output("blob");
      downloadBlob(blob, "images-to-pdf.pdf");
      toast.success(
        `PDF created with ${images.length} page${images.length > 1 ? "s" : ""}`,
      );
    } catch (e) {
      toast.error("Failed to create PDF");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert images into a PDF document"
      icon={<ImageIcon className="w-4 h-4" />}
      onBack={onBack}
    >
      {/* Upload Zone */}
      <div
        data-ocid="tool.upload_button"
        className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[140px] flex flex-col items-center justify-center gap-3 p-6 ${
          dragOver ? "dragover border-primary" : ""
        }`}
        onClick={() => inputRef.current?.click()}
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
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground text-sm">
            Tap to add images
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG, WebP supported
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Image List */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {images.length} image{images.length > 1 ? "s" : ""} selected
          </p>
          <AnimatePresence initial={false}>
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shadow-card"
              >
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-12 h-12 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{img.name}</p>
                  <p className="text-xs text-muted-foreground">Page {i + 1}</p>
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
                    disabled={i === images.length - 1}
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:text-destructive"
                    onClick={() => remove(img.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Convert Button */}
      <Button
        data-ocid="tool.submit_button"
        className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
        onClick={convert}
        disabled={images.length === 0 || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Creating PDF...
          </>
        ) : (
          <>
            <Download className="mr-2 w-4 h-4" />
            Convert to PDF
          </>
        )}
      </Button>
    </ToolLayout>
  );
}
