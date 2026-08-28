import { motion } from "framer-motion";
import { springBouncy } from "../motion";
import "./ToolCard.css";

export default function ToolCard({ icon, name, description, onUse }) {
  return (
    <article className="tool-card glass">
      <div className="tool-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="tool-card__name">{name}</h2>
      <p className="tool-card__description">{description}</p>
      <motion.button
        type="button"
        className="tool-card__use"
        onClick={onUse}
        whileTap={{ scale: 0.96 }}
        transition={springBouncy}
      >
        Use
      </motion.button>
    </article>
  );
}
