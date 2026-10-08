export const conversationStyles = ["Start chatting", "Wait for an opening", "Find one person to talk to", "Depends on the day"] as const;
export const conversationTopics = ["Big ideas", "Ridiculous hypotheticals", "Personal stories", "Whatever happens"] as const;
export const mbtiTypes = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP", "No idea"] as const;

export function cleanQuizChoice(value: unknown, choices: readonly string[]): string | null {
  return typeof value === "string" && choices.includes(value) ? value : null;
}
