export const springSoft = { type: "spring", stiffness: 300, damping: 30 };
export const springBouncy = { type: "spring", stiffness: 400, damping: 22 };
// Near-critically damped and much slower than springSoft, which settles in
// ~300ms. Sized so a map camera move reads as a deliberate push (~900ms) rather
// than a snap, and never overshoots the stop it is framing.
export const springCamera = { type: "spring", stiffness: 42, damping: 13 };
