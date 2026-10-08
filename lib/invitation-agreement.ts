import { cleanPhotoConsent, PHOTO_CONSENT_VERSION, type PhotoConsent } from "./photo-consent";
import { PARTICIPATION_TERMS_VERSION, type TermsAcceptance } from "./participation-terms";

export type InvitationAgreement = { termsAcceptance?: TermsAcceptance; photoConsent?: PhotoConsent | null };
export function invitationAgreementComplete(value: InvitationAgreement) {
  return value.termsAcceptance?.version === PARTICIPATION_TERMS_VERSION
    && Number.isFinite(Date.parse(value.termsAcceptance.acceptedAt))
    && value.photoConsent?.version === PHOTO_CONSENT_VERSION
    && !!cleanPhotoConsent(value.photoConsent, value.photoConsent.recordedAt);
}
export function acceptInvitationAgreement(body: Record<string, unknown>, at: string): Required<InvitationAgreement> {
  if (body.agreement !== true || body.termsVersion !== PARTICIPATION_TERMS_VERSION)
    throw new Error("Please accept the participation terms and show-up agreement before confirming your RSVP.");
  const photoConsent = cleanPhotoConsent(body.photoConsent, at);
  if (!photoConsent || photoConsent.version !== PHOTO_CONSENT_VERSION)
    throw new Error("Please choose Yes or No for the photo release. No is completely fine.");
  return { termsAcceptance: { version: PARTICIPATION_TERMS_VERSION, acceptedAt: at }, photoConsent };
}
