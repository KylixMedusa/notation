import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Optional element pinned to the top-right (e.g. a Save action). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Bottom sheet on phones; on `md+` it centers as a modal card. Backdrop tap + Escape close it.
 */
export function BottomSheet({ open, onClose, title, action, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.div
            className="absolute inset-0 bg-foreground/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full rounded-t-3xl bg-background pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] md:max-w-lg md:rounded-3xl md:pb-6"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="mx-auto my-3 h-1.5 w-10 rounded-full bg-border md:hidden" />
            {(title || action) && (
              <div className="flex items-center justify-between px-6 pt-2 pb-4">
                <span className="w-12" />
                {title && (
                  <h2 className="flex-1 text-center font-display text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                <div className="flex w-12 justify-end">{action}</div>
              </div>
            )}
            <div className="max-h-[75dvh] overflow-y-auto px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
