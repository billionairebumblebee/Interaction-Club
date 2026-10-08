/** Only an explicitly supplied organizer address is exposed on invitations. */
export function cleanHostContactEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  if (email.length > 254 || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(email)) return null;
  return email;
}

export function hostContactHref(value: unknown): string | null {
  const email = cleanHostContactEmail(value);
  return email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Question about my Interaction invitation")}` : null;
}
