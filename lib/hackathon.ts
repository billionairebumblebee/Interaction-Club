// This records an affinity preference, not verified attendance or eligibility.
// Unchecked and legacy profiles remain eligible for every otherwise-fitting plan.
export function hackathonAffinity(people: readonly unknown[]) {
  const count = people.filter(person => person !== null && typeof person === "object" && "hackathonGroupOptIn" in person && person.hackathonGroupOptIn === true).length;
  return count * (count - 1);
}
