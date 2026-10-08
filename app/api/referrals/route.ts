import { createReferrer, referralSlug, resolveInviter, validReferralSlug } from "@/lib/referrals";

export async function GET(request: Request) {
  try {
    const referrer = await resolveInviter(new URL(request.url).searchParams.get("from"));
    return Response.json({ referrer }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ referrer: null }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const slug = referralSlug(body.slug || name);
    if (name.length < 1 || name.length > 60 || !/^[\p{L}\p{M} .’'-]+$/u.test(name) || !validReferralSlug(slug) || body.publicNameConsent !== true) return Response.json({ error: "Add your name, choose an available link name, and confirm it can appear publicly." }, { status: 400 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "Invitation links are unavailable right now. Please try again soon." }, { status: 503 });
    return Response.json({ referrer: await createReferrer(name, slug) }, { status: 201 });
  } catch { return Response.json({ error: "We couldn’t make your link. Please try again." }, { status: 503 }); }
}
