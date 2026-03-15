// Extrai metadados do nome do arquivo PDF
// Padrão: "Nome da Música (TOM BPM).pdf"
// Exemplo: "Agradeço (A 70).pdf"

const PATTERN = /^(.+?)\s*\(([A-Gb#m]+)\s+(\d+)\)\s*(?:\(.*\))?\s*$/i;

export function parseFileName(raw) {
  const base = raw.replace(/\.pdf$/i, '').trim();
  const m = base.match(PATTERN);
  if (!m) return { valid: false, raw, displayName: base, name: base, key: '', bpm: '' };
  return {
    valid: true,
    raw,
    displayName: base,
    name: m[1].trim(),
    key: m[2].trim(),
    bpm: parseInt(m[3], 10),
  };
}

export function buildSongName(name, key, bpm) {
  if (!name) return '';
  if (!key) return name;
  return `${name.trim()} (${key} ${bpm})`;
}

export function stripSuffix(name) {
  return name.replace(/\s*\([A-Gb#m]+\s+\d+\)\s*$/i, '').trim();
}

export function isYouTubeUrl(url) {
  return /youtu\.?be|youtube\.com/i.test(url);
}

export async function extractLinksFromPDF(arrayBuffer) {
  try {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) return [];
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const links = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann.url) links.push(ann.url);
        if (ann.action?.url) links.push(ann.action.url);
      }
    }
    return [...new Set(links)];
  } catch (e) {
    return [];
  }
}

export const TEMPO_NAMES = [
  { max: 39,  name: 'Larghissimo' },
  { max: 59,  name: 'Largo' },
  { max: 65,  name: 'Larghetto' },
  { max: 75,  name: 'Adagio' },
  { max: 107, name: 'Andante' },
  { max: 119, name: 'Moderato' },
  { max: 139, name: 'Allegretto' },
  { max: 167, name: 'Allegro' },
  { max: 199, name: 'Vivace' },
  { max: 300, name: 'Presto' },
];

export function getTempoName(bpm) {
  return (TEMPO_NAMES.find(t => bpm <= t.max) || TEMPO_NAMES[TEMPO_NAMES.length - 1]).name;
}
