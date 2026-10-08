import { put } from "@vercel/blob";
import { queueSheetRecord } from "@/lib/sheets";
import { eveningIntents } from "@/lib/matching";
import { dressCodeOptions } from "@/lib/dress-code";
import { cleanInterests } from "@/lib/interest-tags";
import { publishInterestTags } from "@/lib/interest-catalog";
import { cleanAvailability } from "@/lib/availability";
import { AVAILABILITY_REQUIRED, hasSignupAvailability } from "@/lib/signup-availability";
import { resolveInviter } from "@/lib/referrals";
import { cleanArrivalStyle } from "@/lib/arrival-style";
import { cleanQuizChoice, conversationStyles, conversationTopics, mbtiTypes } from "@/lib/personality-quiz";
import { schoolStages } from "@/lib/school-work";
import { baseAreas } from "@/lib/locations";
import { PILOT_WEEK, cleanPilotDinners } from "@/lib/pilot-week";
import { cleanSideQuestDays, cleanSideQuestTransport, cleanSideQuestMaxSpend } from "@/lib/side-quests";
import { cleanPhotoConsent, PHOTO_CONSENT_VERSION } from "@/lib/photo-consent";
import { PARTICIPATION_TERMS_VERSION } from "@/lib/participation-terms";
import { cleanCommunityProfile } from "@/lib/communities";

export const maxDuration = 60;

const activities = new Set(["Dinner", "Quick connect", "Build together", "Do something"]);
const budgets = new Set(["Free plans only", "Under $15", "$15–30", "$30–50", "$100+"]);
const areas = new Set<string>(baseAreas);
const tableFormats = new Set(["50/50 men + women", "Women only", "Men only", "Inclusive / everyone"]);
const dietaryNeeds = new Set(["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Peanut allergy", "Tree nut allergy", "Shellfish allergy", "Lactose intolerant"]);
const foodLikes = new Set(["Ramen", "Tacos", "Burgers", "Coffee + matcha", "Desserts", "Shared plates", "Spicy food"]);
const foodDislikes = new Set(["Seafood", "Very spicy food", "Loud places", "Meat-heavy", "Dairy-heavy", "Sweet food"]);

function isAtLeast18(birthMonth: number, birthYear: number) {
  const now = new Date();
  const age = now.getFullYear() - birthYear;
  return age > 18 || (age === 18 && birthMonth <= now.getMonth() + 1);
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanList(value: unknown, allowed: Set<string>, max: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item)))].slice(0, max);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const fullName = cleanText(payload.fullName, 80);
    const email = cleanText(payload.email, 120).toLowerCase();
    const baseArea = cleanText(payload.baseArea, 40);
    const birthMonth = Number(payload.birthMonth);
    const birthYear = Number(payload.birthYear);
    const selectedActivities = cleanList(payload.activities, activities, 4);
    const budget = cleanText(payload.budget, 20);
    const selectedAvailability = cleanAvailability(payload.availability);
    const selectedDinners = cleanPilotDinners(payload.pilotDinnerDates);
    const selectedTables = cleanList(payload.tableFormats, tableFormats, 4);
    // Keep older single-choice forms compatible; new forms can select several.
    const dressCodes = cleanList(payload.dressCodes ?? [payload.vibe], new Set(dressCodeOptions), dressCodeOptions.length);
    const gender = cleanText(payload.gender, 80);
    const pronouns = cleanText(payload.pronouns, 100);
    const intent = cleanText(payload.intent, 40);
    const maxSpend = payload.maxSpend === "" || payload.maxSpend === undefined ? undefined : Number(payload.maxSpend);
    if (!eveningIntents.includes(intent as typeof eveningIntents[number]) || (budget === "$100+" && (maxSpend === undefined || !Number.isFinite(maxSpend) || maxSpend < 100))) return Response.json({ error: "Choose your evening intent and an exact limit for the LARP tier." }, { status: 400 });
    // Intake records preferences; table eligibility is checked during matching.

    if (!hasSignupAvailability(payload)) return Response.json({ error: AVAILABILITY_REQUIRED, field: "availability" }, { status: 400 });

    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !areas.has(baseArea) || !selectedActivities.length || !budgets.has(budget) || !selectedTables.length || !Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12 || !Number.isInteger(birthYear) || birthYear < 1900 || !isAtLeast18(birthMonth, birthYear) || payload.ageConfirmed !== true || payload.agreement !== true) {
      return Response.json({ error: "Please complete the required fields before joining." }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json({ error: "The application inbox is not configured yet. Please try again soon." }, { status: 503 });
    }

    if (payload.participationTermsVersion !== PARTICIPATION_TERMS_VERSION) return Response.json({ error: "Please refresh the quiz and accept the current participation terms." }, { status: 400 });
    const acceptedAt = new Date().toISOString();
    const photoConsent = cleanPhotoConsent(payload.photoConsent, acceptedAt);
    if (!photoConsent || photoConsent.version !== PHOTO_CONSENT_VERSION) return Response.json({ error: "Please choose Yes or No for the photo release. No is completely fine." }, { status: 400 });
    const id = crypto.randomUUID();
    const application = {
      id,
      photoConsent,
      termsAcceptance: { version: PARTICIPATION_TERMS_VERSION, acceptedAt },
      // Referral context only: never used as identity verification or eligibility.
      invitedBy: (await resolveInviter(payload.invitedBy))?.slug ?? null,
      referralSource: payload.referralSource === "mox" || payload.invitedBy === "mox" ? "mox" : null,
      ...cleanCommunityProfile(payload),
      fullName, email, baseArea, birthMonth, birthYear,
      willingToTravelToBerkeley: payload.willingToTravelToBerkeley === true,
      gender: gender || null, tableFormats: selectedTables,
      pronouns: pronouns || null,
      intent, discipline: cleanText(payload.discipline, 1000), ageConfirmed: true,
      comments: cleanText(payload.comments, 2000),
      dinnerSideQuest: cleanText(payload.dinnerSideQuest, 240),
      currentRabbitHole: cleanText(payload.currentRabbitHole, 400),
      tenMinuteTopic: cleanText(payload.tenMinuteTopic, 400),
      meetAgainSpark: cleanText(payload.meetAgainSpark, 240),
      yapper: cleanQuizChoice(payload.yapper, ["Yes — I talk a lot", "No", "Depends on…"]),
      yapperContext: cleanText(payload.yapperContext, 240),
      diningHallPreference: cleanQuizChoice(payload.diningHallPreference, ["I’d be down for Crossroads", "Please, anywhere but a dining hall"]),
      diningHallContext: cleanText(payload.diningHallContext, 240),
      arrivalStyle: cleanArrivalStyle(payload.arrivalStyle),
      conversationStyle: cleanQuizChoice(payload.conversationStyle, conversationStyles),
      conversationTopic: cleanQuizChoice(payload.conversationTopic, conversationTopics),
      mbti: cleanQuizChoice(payload.mbti, mbtiTypes),
      schoolStage: cleanQuizChoice(payload.schoolStage, schoolStages),
      major: cleanText(payload.major, 100),
      industry: cleanText(payload.industry, 100),
      jobTitle: cleanText(payload.jobTitle, 100),
      sideQuestDays: cleanSideQuestDays(payload.sideQuestDays),
      sideQuestIdea: cleanText(payload.sideQuestIdea, 240),
      sideQuestInvitations: payload.sideQuestInvitations === true,
      sideQuestTransport: cleanSideQuestTransport(payload.sideQuestTransport),
      sideQuestTransportOther: cleanText(payload.sideQuestTransportOther, 160),
      sideQuestMaxSpend: cleanSideQuestMaxSpend(payload.sideQuestMaxSpend),
      // Older clients may still submit this preference; do not infer wider-community consent.
      ...(typeof payload.hackathonGroupOptIn === "boolean" ? { hackathonGroupOptIn: payload.hackathonGroupOptIn } : {}),
      ...(budget === "$100+" ? { maxSpend } : {}),
      activities: selectedActivities, budget, availability: selectedAvailability, dressCodes,
      vibe: dressCodes.join(", ") || null, // Existing Google Sheet column stays readable.
      foodLikeTags: cleanList(payload.foodLikeTags, foodLikes, 7), foodDislikeTags: cleanList(payload.foodDislikeTags, foodDislikes, 6),
      foodLikes: cleanText(payload.foodLikes, 240), foodDislikes: cleanText(payload.foodDislikes, 240),
      dietaryNeeds: cleanList(payload.dietaryNeeds, dietaryNeeds, 9),
      dietaryOther: cleanText(payload.dietaryOther, 240),
      accessibilityNotes: cleanText(payload.accessibilityNotes, 240),
      spontaneous: payload.spontaneous === true, interests: cleanInterests(payload.interests), agreement: true,
      submittedAt: new Date().toISOString(),
      pilotWeekAvailability: Array.isArray(payload.pilotDinnerDates) ? { startsOn: PILOT_WEEK.startsOn, endsOn: PILOT_WEEK.endsOn, available: selectedDinners.length > 0, dinnerDates: selectedDinners } : typeof payload.availablePilotWeek === "boolean" ? { startsOn: PILOT_WEEK.startsOn, endsOn: PILOT_WEEK.endsOn, available: payload.availablePilotWeek } : null,
    };

    await put(`applications/${new Date().toISOString().slice(0, 10)}/${id}.json`, JSON.stringify(application), {
      access: "private", addRandomSuffix: false, contentType: "application/json",
    });

    // Only new forms displaying the sharing notice opt tags into the catalog.
    // Existing private submissions are never backfilled into public suggestions.
    if (payload.shareInterestTags === true) {
      try { await publishInterestTags(application.interests); }
      catch { console.error("Interest suggestions unavailable; application is saved"); }
    }

    // Keep the saved intake even if Google is temporarily unavailable. Admin can retry/backfill by ID.
    try { await queueSheetRecord({ id, kind: "response", record: application }); }
    catch { console.error("Sheet enqueue failed; application is saved and can be backfilled", id); }
    return Response.json({ id }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong. Try again in a minute." }, { status: 500 });
  }
}
