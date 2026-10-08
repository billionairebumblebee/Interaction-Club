export const arrivalStyles = ["Early", "On time", "Late", "Unpredictable"] as const;

export function cleanArrivalStyle(value: unknown): string | null {
  return typeof value === "string" && arrivalStyles.some(style => style === value) ? value : null;
}
