import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockOpen,
  Upload,
} from "lucide-react";
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

export function PasswordPdf({ onBack }: Props) {
  // Lock state
  const [lockFile, setLockFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockDrag, setLockDrag] = useState(false);
  const lockInputRef = useRef<HTMLInputElement>(null);

  // Unlock state
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showUnlockPass, setShowUnlockPass] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockDrag, setUnlockDrag] = useState(false);
  const unlockInputRef = useRef<HTMLInputElement>(null);

  const lockPdf = async () => {
    if (!lockFile || !password) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLockLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await lockFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out = await doc.save({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: "lowResolution",
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false,
        },
      } as any);
      const blob = new Blob([out.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      downloadBlob(blob, `locked-${lockFile.name}`);
      toast.success("PDF locked with password");
    } catch (e) {
      toast.error("Failed to lock PDF");
      console.error(e);
    } finally {
      setLockLoading(false);
    }
  };

  const unlockPdf = async () => {
    if (!unlockFile || !unlockPassword) return;
    setUnlockLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await unlockFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes, {
        password: unlockPassword,
        ignoreEncryption: false,
      } as any);
      const out = await doc.save();
      const blob = new Blob([out.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      downloadBlob(blob, `unlocked-${unlockFile.name}`);
      toast.success("PDF unlocked successfully");
    } catch (e) {
      toast.error("Failed to unlock. Check the password.");
      console.error(e);
    } finally {
      setUnlockLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Lock / Unlock PDF"
      description="Password protect or remove protection"
      icon={<Lock className="w-4 h-4" />}
      onBack={onBack}
    >
      <Tabs defaultValue="lock">
        <TabsList className="w-full">
          <TabsTrigger
            data-ocid="password.lock_tab"
            value="lock"
            className="flex-1"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Lock PDF
          </TabsTrigger>
          <TabsTrigger
            data-ocid="password.unlock_tab"
            value="unlock"
            className="flex-1"
          >
            <LockOpen className="w-3.5 h-3.5 mr-1.5" />
            Unlock PDF
          </TabsTrigger>
        </TabsList>

        {/* Lock Tab */}
        <TabsContent value="lock" className="space-y-4 mt-4">
          <div
            className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[120px] flex flex-col items-center justify-center gap-3 p-6 ${
              lockDrag ? "dragover border-primary" : ""
            }`}
            onClick={() => lockInputRef.current?.click()}
            onKeyDown={(e) =>
              e.key === "Enter" && lockInputRef.current?.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              setLockDrag(true);
            }}
            onDragLeave={() => setLockDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setLockDrag(false);
              const f = e.dataTransfer.files[0];
              if (f?.type === "application/pdf") setLockFile(f);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground text-sm">
                {lockFile ? lockFile.name : "Tap to upload PDF"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lockFile ? fmtSize(lockFile.size) : "PDF files only"}
              </p>
            </div>
            <input
              ref={lockInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setLockFile(f);
              }}
            />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lock-password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <input
                  id="lock-password"
                  data-ocid="password.password_input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-3 pr-10 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-medium">
                Confirm Password
              </Label>
              <input
                id="confirm-password"
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          <Button
            data-ocid="password.submit_button"
            className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
            onClick={lockPdf}
            disabled={
              !lockFile ||
              !password ||
              password !== confirmPassword ||
              lockLoading
            }
          >
            {lockLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Locking PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 w-4 h-4" />
                Lock &amp; Download PDF
              </>
            )}
          </Button>
        </TabsContent>

        {/* Unlock Tab */}
        <TabsContent value="unlock" className="space-y-4 mt-4">
          <div
            className={`upload-zone rounded-xl border-2 border-dashed border-border transition-all cursor-pointer min-h-[120px] flex flex-col items-center justify-center gap-3 p-6 ${
              unlockDrag ? "dragover border-primary" : ""
            }`}
            onClick={() => unlockInputRef.current?.click()}
            onKeyDown={(e) =>
              e.key === "Enter" && unlockInputRef.current?.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              setUnlockDrag(true);
            }}
            onDragLeave={() => setUnlockDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setUnlockDrag(false);
              const f = e.dataTransfer.files[0];
              if (f?.type === "application/pdf") setUnlockFile(f);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground text-sm">
                {unlockFile ? unlockFile.name : "Tap to upload protected PDF"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unlockFile ? fmtSize(unlockFile.size) : "PDF files only"}
              </p>
            </div>
            <input
              ref={unlockInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setUnlockFile(f);
              }}
            />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-2">
            <Label htmlFor="unlock-password" className="text-xs font-medium">
              Password
            </Label>
            <div className="relative">
              <input
                id="unlock-password"
                type={showUnlockPass ? "text" : "password"}
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter PDF password"
                className="w-full pl-3 pr-10 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowUnlockPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showUnlockPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-tool"
            onClick={unlockPdf}
            disabled={!unlockFile || !unlockPassword || unlockLoading}
          >
            {unlockLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Unlocking PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 w-4 h-4" />
                Unlock &amp; Download PDF
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </ToolLayout>
  );
}
