export const PARTICIPATION_TERMS_VERSION = "2026-10-07-v2";

export type TermsAcceptance = {
  version: typeof PARTICIPATION_TERMS_VERSION | "2026-10-07-v1";
  acceptedAt: string;
};
