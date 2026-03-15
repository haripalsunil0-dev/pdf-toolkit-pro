import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  onBack: () => void;
  children: ReactNode;
}

export function ToolLayout({
  title,
  description,
  icon,
  onBack,
  children,
}: ToolLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen flex flex-col"
    >
      {/* Tool Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            data-ocid="tool.back_button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 hover:bg-primary/10 hover:text-primary"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-foreground text-base leading-tight truncate">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {children}
      </div>
    </motion.div>
  );
}
