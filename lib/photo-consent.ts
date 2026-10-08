export const PHOTO_CONSENT_VERSION = "2026-10-07-v3";

export type PhotoChoices = {
  capture: boolean;
  hackathon: boolean;
  publicPosting: boolean;
};

export type PhotoAnswers = { [Key in keyof PhotoChoices]: boolean | null };

export function photoAnswersComplete(value: PhotoAnswers): value is PhotoChoices {
  return typeof value.capture === "boolean" && typeof value.hackathon === "boolean" && typeof value.publicPosting === "boolean"
    && (value.capture || (!value.hackathon && !value.publicPosting));
}

export type PhotoConsent = PhotoChoices & {
  version: typeof PHOTO_CONSENT_VERSION | "2026-10-07-v2" | "2026-10-07-v1";
  recordedAt: string;
};

// Derived from current saved permissions, never written back as new consent.
// Older partial grants are not expanded into marketing permission.
export function photoGroupingPreference(value: unknown): "photo-free" | "photography" | "confirm" {
  if (!value || typeof value !== "object") return "confirm";
  const saved = value as Record<string, unknown>;
  const consent = typeof saved.recordedAt === "string" ? cleanPhotoConsent(value, saved.recordedAt) : null;
  if (!consent) return "confirm";
  if (!consent.capture) return "photo-free";
  return consent.publicPosting ? "photography" : "confirm";
}

// Legacy profiles and unsupported versions grant no permission. Only actual
// boolean opt-ins count; client timestamps and arbitrary release text do not.
export function cleanPhotoConsent(value: unknown, recordedAt: string): PhotoConsent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  // Preserve older granular grants; never upgrade them to the bundled release.
  if (input.version !== PHOTO_CONSENT_VERSION && input.version !== "2026-10-07-v2" && input.version !== "2026-10-07-v1") return null;
  if (!photoAnswersComplete(input as PhotoAnswers)) return null;
  if (input.version === PHOTO_CONSENT_VERSION && (input.capture !== input.hackathon || input.capture !== input.publicPosting)) return null;
  const capture = input.capture === true;
  return {
    version: input.version as PhotoConsent["version"],
    recordedAt,
    capture,
    hackathon: capture && input.hackathon === true,
    publicPosting: capture && input.publicPosting === true,
  };
}

export function photoConsentSummary(value: unknown): string {
  if (!value || typeof value !== "object") return "Photo permissions: not recorded — ask before taking or using photos.";
  const saved = value as Record<string, unknown>;
  const permission = typeof saved.recordedAt === "string" ? cleanPhotoConsent(value, saved.recordedAt) : null;
  if (!permission) return "Photo permissions: not recorded — ask before taking or using photos.";
  return `Photo permissions (${permission.version}; ${permission.recordedAt}): capture ${permission.capture ? "YES" : "NO"}; ${permission.version === PHOTO_CONSENT_VERSION ? "club/hackathon presentations" : "hackathon presentation"} ${permission.hackathon ? "YES" : "NO"}; Interaction Club website/socials ${permission.publicPosting ? "YES" : "NO"}. Standing choices; check for event-specific changes. No sponsor reuse or paid ads.`;
}
