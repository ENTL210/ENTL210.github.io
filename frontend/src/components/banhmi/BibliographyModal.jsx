import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { springSoft, springBouncy } from "../../motion";
import { sources } from "../../data/banhmiJourney";
import "./BibliographyModal.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

export default function BibliographyModal({ open, onClose, returnFocusRef }) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef(null);
  const headingId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = returnFocusRef?.current;

    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="bib-modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="bib-modal__backdrop"
            role="presentation"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            className="bib-modal banhmi-glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={reduceMotion ? { duration: 0.15 } : springSoft}
          >
            <div className="bib-modal__header">
              <h2 id={headingId} className="bib-modal__heading">
                Bibliography
              </h2>
              <motion.button
                type="button"
                className="bib-modal__close"
                aria-label="Close the bibliography"
                onClick={onClose}
                whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                transition={springBouncy}
              >
                <CloseIcon />
              </motion.button>
            </div>

            <ol className="bib-modal__list">
              {sources.map((source) => (
                <li key={source.n} className="bib-modal__item">
                  <span className="bib-modal__n">{source.n}</span>
                  <div className="bib-modal__entry">
                    <p className="bib-modal__title">{source.title}</p>
                    <p className="bib-modal__publisher">{source.publisher}</p>
                    <p className="bib-modal__note">{source.note}</p>
                    <a
                      className="bib-modal__link"
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.url}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
