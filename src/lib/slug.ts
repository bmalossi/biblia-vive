const accentMap: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ä: 'a', ã: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o', õ: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
  Á: 'a', À: 'a', Â: 'a', Ä: 'a', Ã: 'a',
  É: 'e', È: 'e', Ê: 'e', Ë: 'e',
  Í: 'i', Ì: 'i', Î: 'i', Ï: 'i',
  Ó: 'o', Ò: 'o', Ô: 'o', Ö: 'o', Õ: 'o',
  Ú: 'u', Ù: 'u', Û: 'u', Ü: 'u',
  Ç: 'c', Ñ: 'n',
};

function removeAccents(str: string): string {
  return str.replace(/[áàâäãéèêëíìîïóòôöõúùûüçñ]/gi, (m) => accentMap[m] ?? m);
}

export function generateSlug(title: string): string {
  const normalized = removeAccents(title.toLowerCase());
  const withHyphens = normalized.replace(/\s+/g, '-');
  const alphanumeric = withHyphens.replace(/[^a-z0-9-]/g, '');
  const clean = alphanumeric.replace(/-+/g, '-');
  return clean.replace(/^-+|-+$/g, '');
}