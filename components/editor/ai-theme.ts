/**
 * Color tokens for the AI sidebar, sourced from the app's real theme
 * variables (app/globals.css) instead of hardcoded hex — keeps the panel
 * in sync with the rest of the editor (see ai-status-panel.tsx, editor-navbar.tsx).
 */
export function alpha(colorVar: string, percent: number): string {
  return `color-mix(in srgb, ${colorVar} ${percent}%, transparent)`;
}

export const BG_BASE = "var(--color-bg-base)";
export const BG_SURFACE = "var(--color-bg-surface)";
export const BG_ELEVATED = "var(--color-bg-elevated)";
export const BG_SUBTLE = "var(--color-bg-subtle)";

export const BORDER_DEFAULT = "var(--color-border-default)";

export const TEXT_PRIMARY = "var(--color-text-primary)";
export const TEXT_SECONDARY = "var(--color-text-secondary)";
export const TEXT_MUTED = "var(--color-text-muted)";
export const TEXT_FAINT = "var(--color-text-faint)";

/** Cyan — the app's primary/brand accent; used for the user's own messages. */
export const ACCENT_PRIMARY = "var(--color-accent-primary)";
export const ACCENT_PRIMARY_FOREGROUND = BG_BASE;
export const ACCENT_PRIMARY_RIM = alpha(ACCENT_PRIMARY, 35);

/** Purple — the dedicated Ghost AI accent (matches ai-status-panel.tsx). */
export const ACCENT_AI = "var(--color-accent-ai)";
export const ACCENT_AI_TEXT = "var(--color-accent-ai-text)";
export const ACCENT_AI_DIM = alpha(ACCENT_AI, 10);
export const ACCENT_AI_RIM = alpha(ACCENT_AI, 30);
export const ACCENT_AI_RIM_SUBTLE = alpha(ACCENT_AI, 15);

export const STATE_SUCCESS = "var(--color-state-success)";
export const STATE_ERROR = "var(--color-state-error)";
export const STATE_WARNING = "var(--color-state-warning)";
export const STATE_WARNING_DIM = alpha(STATE_WARNING, 10);
export const STATE_WARNING_RIM = alpha(STATE_WARNING, 30);
