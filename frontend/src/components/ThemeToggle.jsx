import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springBouncy } from "../motion";
import "./ThemeToggle.css";

function getInitialTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") || "light";
}

function SunIcon() {
  return (
    <svg
      className="theme-toggle__svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2.5v2.25M12 19.25V21.5M4.22 4.22l1.59 1.59M18.19 18.19l1.59 1.59M2.5 12h2.25M19.25 12H21.5M4.22 19.78l1.59-1.59M18.19 5.81l1.59-1.59"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="theme-toggle__svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Centered crescent in the 24×24 box */}
      <path
        d="M12 3.5a8.5 8.5 0 1 0 8.4 9.9 7 7 0 1 1-8.4-9.9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.9 }}
      transition={springBouncy}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          className="theme-toggle__icon"
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={springBouncy}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
