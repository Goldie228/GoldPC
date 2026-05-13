/**
 * Переопределение отображаемых названий производителей.
 * API может возвращать сокращённые/технические имена (BE, INTEL, etc.),
 * которые нужно показывать в нормальном виде на сайте.
 */
const manufacturerNameOverrides: Record<string, string> = {
  BE: 'BE QUIET!',
  be: 'BE QUIET!',
  'be quiet!': 'BE QUIET!',
};

export function getDisplayManufacturerName(
  name: string | null | undefined,
): string {
  if (!name) return '';
  return manufacturerNameOverrides[name] ?? name;
}
