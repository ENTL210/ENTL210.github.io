import { motion, useReducedMotion } from "framer-motion";
import { springBouncy } from "../../motion";
import "./BanhMiNavbar.css";

function VietnamFlag() {
  return (
    <svg
      className="banhmi-navbar__flag"
      viewBox="0 0 30 20"
      role="img"
      aria-label="Flag of Vietnam"
    >
      <rect width="30" height="20" rx="2" fill="#DA251D" />
      <path
        d="M15 5.2l1.47 4.52h4.75l-3.84 2.8 1.46 4.52L15 14.24l-3.84 2.8 1.46-4.52-3.84-2.8h4.75z"
        fill="#FFFF00"
      />
    </svg>
  );
}

export default function BanhMiNavbar({ bibliographyButtonRef, onOpenBibliography }) {
  const reduceMotion = useReducedMotion();

  return (
    <header className="banhmi-navbar bm-glass">
      <div className="banhmi-navbar__brand">
        <h1 className="banhmi-navbar__title">The History of Bánh Mì</h1>
        <VietnamFlag />
      </div>

      <motion.button
        type="button"
        ref={bibliographyButtonRef}
        className="banhmi-navbar__bib"
        aria-label="Open the bibliography"
        onClick={onOpenBibliography}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        transition={springBouncy}
      >
        Bibliography
      </motion.button>
    </header>
  );
}
