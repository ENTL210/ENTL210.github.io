import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { springSoft, springBouncy } from "../motion";
import "./BottomSheet.css";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomSheet({ open, onClose, children, title }) {
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="bottom-sheet"
          className="bottom-sheet-root"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bottom-sheet-backdrop" onClick={onClose} />
          <motion.div
            className="bottom-sheet glass"
            role="dialog"
            aria-modal="true"
            aria-label={title || "Tool"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springSoft}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.85 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 8 || info.velocity.y > 80) {
                onClose();
              }
            }}
          >
            <div
              className="bottom-sheet__header"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <button
                type="button"
                className="bottom-sheet__handle"
                aria-label="Close"
                onClick={onClose}
              />
              <motion.button
                type="button"
                className="bottom-sheet__close"
                aria-label="Close"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                whileTap={{ scale: 0.9 }}
                transition={springBouncy}
              >
                <CloseIcon />
              </motion.button>
            </div>
            <div className="bottom-sheet__body">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
