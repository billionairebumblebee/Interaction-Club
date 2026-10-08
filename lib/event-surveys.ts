export const experienceOptions = ["Loved it", "It was okay", "Not for me", "I had a bad experience", "I didn’t attend"] as const;
export const againOptions = ["Yes", "Maybe", "No"] as const;
export const connectionOptions = ["Not yet", "We made another plan", "We met again independently"] as const;
export const hopeOptions = ["Meet new friends", "Have a good conversation", "Try something new", "Just get out of the house"] as const;

export type SurveyKind = "before" | "after" | "concern";
type SurveyQuestion = { id: string; label: string; help?: string; options: readonly string[]; audience?: "attended" | "absent" };
export const surveyQuestions: Record<SurveyKind, SurveyQuestion[]> = {
  before: [
    { id: "feeling", label: "How are you feeling about going to this event?", options: ["Excited", "Nervous", "Excited and nervous", "Neutral", "Not sure I want to go"] },
    { id: "planFit", label: "Does this invitation fit the preferences you gave us?", help: "Think about the activity, time, location, and budget—not whether you know the other guests yet.", options: ["Fits well", "Some parts fit", "Doesn’t fit", "Not enough information yet"] },
    { id: "groupConfidence", label: "How confident are you that this group will be a good fit?", help: "Go by what we’ve actually told you. It’s fine not to know yet.", options: ["Confident", "Somewhat confident", "Unsure", "Not confident", "I haven’t been told enough about the group"] },
    { id: "clarity", label: "Do you know where to go, when to arrive, and what you’ll pay?", options: ["All clear", "Something is unclear", "I haven’t checked yet"] },
  ],
  after: [
    { id: "feeling", label: "How do you feel after spending time with this group?", options: ["More connected", "Glad I went", "About the same", "Disappointed", "Uncomfortable", "Mixed feelings"] },
    { id: "groupFit", label: "Did the group fit the kind of people you wanted to meet?", help: "Think about shared interests, the conversation, and why you came—not rating individual people.", options: ["Good fit", "Partly", "Not a good fit", "Too soon to tell"] },
    { id: "conversation", label: "How easy was it to join the conversation?", options: ["Easy", "Took a little time", "Difficult", "I felt left out", "I mostly wanted to listen"] },
    { id: "planAccuracy", label: "Did the activity, venue, and cost match your invitation?", options: ["Yes", "Mostly", "Something important was different", "Not sure"] },
    { id: "absenceReason", label: "What was the main reason you didn’t attend?", help: "This helps us improve the plan. It isn’t an automatic attendance penalty.", audience: "absent", options: ["Schedule changed", "Cost", "Getting there", "Felt nervous about going", "The plan wasn’t a good fit", "Couldn’t find the event or details", "Something else", "Prefer not to say"] },
  ],
  concern: [
    { id: "concernArea", label: "What is your concern about?", help: "Choose the closest fit, or skip this and tell us below.", options: ["Another attendee’s behavior", "Host behavior", "Food or dietary needs", "Venue or accessibility", "Privacy or unwanted contact", "Something else"] },
  ],
};

export function questionsFor(kind: SurveyKind, experience?: string) {
  return surveyQuestions[kind].filter(question => kind !== "after" || (experience === "I didn’t attend" ? question.audience === "absent" : question.audience !== "absent"));
}

export type SurveyAnswers = {
  questionAnswers?: Record<string, string>;
  experience?: typeof experienceOptions[number];
  meetAgain?: typeof againOptions[number];
  connection?: typeof connectionOptions[number];
  hopes?: string[];
  note: string;
  followUp: boolean;
};
export type SurveyRecord = SurveyAnswers & {
  id: string; tableId: string; applicationId: string; kind: SurveyKind; submittedAt: string;
};

export function surveyWindow(table: { status: string; startsAt: string; endsAt?: string }, now = Date.now()) {
  const start = Date.parse(table.startsAt);
  const end = table.endsAt ? Date.parse(table.endsAt) : start + 3 * 60 * 60 * 1000;
  return {
    before: table.status === "invited" && Number.isFinite(start) && now < start,
    after: table.status !== "cancelled" && table.status !== "draft" && (table.status === "complete" || (Number.isFinite(end) && now >= end)),
  };
}

export function validateSurvey(kind: SurveyKind, body: Record<string, unknown>): SurveyAnswers {
  if (body.note !== undefined && typeof body.note !== "string") throw new Error("Please enter your note as text.");
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 2000) throw new Error("Keep your note under 2,000 characters.");
  if (body.followUp !== undefined && typeof body.followUp !== "boolean") throw new Error("Please check your follow-up choice.");
  const answers: SurveyAnswers = { note, followUp: body.followUp === true };
  if (body.questionAnswers !== undefined) {
    if (!body.questionAnswers || typeof body.questionAnswers !== "object" || Array.isArray(body.questionAnswers)) throw new Error("Please check your survey answers.");
    answers.questionAnswers = {};
    for (const [id, value] of Object.entries(body.questionAnswers)) {
      const question = questionsFor(kind, typeof body.experience === "string" ? body.experience : undefined).find(question => question.id === id);
      if (!question || typeof value !== "string" || !question.options.includes(value)) throw new Error("Please check your survey choices.");
      answers.questionAnswers[id] = value;
    }
  }
  if (kind === "concern") {
    if (!note) throw new Error("Tell us what happened so we can review it.");
  } else if (kind === "before") {
    const hopes = body.hopes ?? [];
    if (!Array.isArray(hopes) || hopes.some(value => !hopeOptions.includes(value))) throw new Error("Please check your choices.");
    answers.hopes = [...new Set(hopes)] as string[];
    if (!answers.hopes.length && !note && !Object.keys(answers.questionAnswers || {}).length) throw new Error("Answer any question or leave a note—or skip this check-in.");
  } else {
    if (!experienceOptions.includes(body.experience as never)) throw new Error("Choose how it went before sending.");
    answers.experience = body.experience as SurveyAnswers["experience"];
    if (answers.experience !== "I didn’t attend") {
      if (body.meetAgain !== undefined && !againOptions.includes(body.meetAgain as never)) throw new Error("Please check your meet-again choice.");
      if (body.connection !== undefined && !connectionOptions.includes(body.connection as never)) throw new Error("Please check your second-hangout choice.");
      answers.meetAgain = body.meetAgain as SurveyAnswers["meetAgain"];
      answers.connection = body.connection as SurveyAnswers["connection"];
    }
  }
  return answers;
}
