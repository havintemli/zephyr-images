export function orDefaultValue(
  value: number | undefined,
  defaultValue: number
): number {
  return value === 0 ? value : value || defaultValue;
}
