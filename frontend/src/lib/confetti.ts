import confetti from "canvas-confetti";

/** Fired on fund/pay success — the two moments money actually moves. */
export function celebrate() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#a3e635", "#fbbf24", "#eef2ef"],
    disableForReducedMotion: true,
  });
}
