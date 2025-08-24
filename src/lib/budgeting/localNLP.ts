/* ──────────────────────────────────────────────────────────────
   src/lib/budgeting/localNLP.ts

   Purpose ▸ Very-lightweight “NLP” helper that pulls an **amount**,
             **category**, **subcategory**, and free-form description
             out of raw speech or OCR text.  Runs entirely offline in
             the browser (no network, no AI model).

   Exports ▸
     • func localParse(text : string)
         → { amount, category, subcategory, description } | null

   Key steps ▸
     1. Extract numeric amounts (digits, or words-to-number fallback)
     2. Handle “change/refund” phrases to compute net amount
     3. Map keywords → category / subcategory via `keywordMap`
     4. Return `null` if nothing was recognised

   Used by ▸
     • QuickSpeechEntry.svelte  (mic input)
     • CameraModal.svelte       (OCR result)
     • routes/budgeting/+page.svelte (expense form helpers)

   Calls ▸ none – totally self-contained
───────────────────────────────────────────────────────────────── */

/* ---- tiny words-to-number helper ---------------------------------- */
function wordsToNumber(str: string) {
  const map: Record<string, number> = {
    zero:0, one:1, two:2, three:3, four:4, five:5,
    six:6, seven:7, eight:8, nine:9, ten:10,
    eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
    sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20,
    thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90
  };
  return str.split(/[\s-]+/).reduce((n,w) => n + (map[w] ?? 0), 0);
}

/* ---- dynamic keyword → category/sub rules -------------------------- */
// The dynamic keyword map, generated from user categories
let keywordMap: Array<{ kw: string[]; cat: string; sub?: string }> = [];

/**
 * Generate the keyword map from the user's categories array.
 * Each category and subcategory name is used as a keyword (lowercased).
 * Optionally, you can extend this to allow user-defined keywords.
 */
export function updateKeywordMap(categories: Array<{ name: string; subs?: string[] }>) {
  const map: Array<{ kw: string[]; cat: string; sub?: string }> = [];
  for (const cat of categories) {
    // Category name as keyword (store multiple forms)
    const catName = String(cat.name || '');
    const catKwForms = generateKwForms(catName);
    map.push({ kw: catKwForms, cat: cat.name });
    // Subcategories as keywords
    if (cat.subs && Array.isArray(cat.subs)) {
      for (const sub of cat.subs) {
        const subName = String(sub || '');
        const subKwForms = generateKwForms(subName);
        map.push({ kw: subKwForms, cat: cat.name, sub });
      }
    }
  }
  keywordMap = map;
}

// Helper: produce keyword variants for better matching
function generateKwForms(s: string) {
  const base = String(s).toLowerCase().trim();
  // raw words
  const words = base.split(/\s+/).filter(Boolean);
  // normalized joined (remove punctuation/space)
  const joined = base.replace(/[^a-z0-9]/gi, '');
  // hyphen/space-insensitive form
  const nospace = base.replace(/[-_\s]+/g, '');
  // include individual words too
  const forms = new Set<string>();
  if (base) forms.add(base);
  if (joined) forms.add(joined);
  if (nospace) forms.add(nospace);
  for (const w of words) if (w) forms.add(w);
  return Array.from(forms);
}

/* ---- main export --------------------------------------------------- */
export function localParse(text: string) {
  const lower = text.toLowerCase();

  /* 1) collect every explicit number  ------------------------------- */
  const nums = [...lower.matchAll(/(\d+(\.\d{1,2})?)/g)].map(m => parseFloat(m[1]));

  /* fallback to words-to-number if no digits */
  if (nums.length === 0) {
    const wordMatch = lower.match(
      /(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)([\s-](one|two|three|four|five|six|seven|eight|nine))?/
    );
    if (wordMatch) nums.push(wordsToNumber(wordMatch[0]));
  }

  /* 1-b) interpret multiple amounts  --------------------------------
     pattern: "paid 100 … returned|change 67" → 100 - 67                */
  let amount = 0;
  if (nums.length === 1) {
    amount = nums[0];
  } else if (
    nums.length >= 2 &&
    /(change|returned|refund|cashback|got back)/.test(lower)
  ) {
    amount = Math.max(...nums) - Math.min(...nums);   // 100-67 = 33
  } else {
    amount = nums.reduce((a,b)=>a+b,0);               // fallback: sum
  }

  /* 2) category mapping */
  let category='', subcategory='';
  // Helper: normalize string for matching (lowercase, remove diacritics, non-alphanumerics)
  function normalize(str: string) {
    // remove diacritics, lowercase, strip non-alphanumerics
    return String(str || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  // Helper: simple fuzzy match (substring or Levenshtein distance 1)
  function fuzzyMatch(a: string, b: string) {
    if (!a || !b) return false;
    if (a.includes(b) || b.includes(a)) return true;
    // Levenshtein distance 1 (allow 1 typo)
    if (Math.abs(a.length - b.length) > 1) return false;
    let mismatches = 0, i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++; j++;
      } else {
        mismatches++;
        if (a.length > b.length) i++;
        else if (a.length < b.length) j++;
        else { i++; j++; }
        if (mismatches > 1) return false;
      }
    }
    mismatches += (a.length - i) + (b.length - j);
    return mismatches <= 1;
  }

  // Tokenize input into words (normalized, split on whitespace)
  const words = lower.split(/\s+/).map(normalize).filter(Boolean);
  const maxWindow = Math.min(4, words.length);
  // For each keyword row, try to match any keyword form against any n-gram window
  // Collect candidate matches with a score and pick the best one (prefer longer/multi-word)
  let best: { score: number; cat: string; sub?: string } | null = null;
  for (const row of keywordMap) {
    for (const kw of row.kw) {
      const normKw = normalize(kw);
      const kwWords = kw.trim().split(/\s+/).filter(Boolean).length || 1;
      // Try windows up to maxWindow words
      for (let size = Math.min(maxWindow, words.length); size >= 1; size--) {
        for (let i = 0; i <= words.length - size; i++) {
          const window = words.slice(i, i + size).join('');
          if (!window) continue;
          if (window === normKw || window.includes(normKw) || normKw.includes(window) || fuzzyMatch(window, normKw)) {
            // score: prefer multi-word and longer normalized keyword
            const score = normKw.length + kwWords * 10 + (size * 2);
            if (!best || score > best.score) {
              best = { score, cat: row.cat, sub: row.sub };
            }
          }
        }
        // continue checking other sizes to possibly find better score
      }
    }
  }
  if (best) {
    category = best.cat;
    subcategory = best.sub || '';
  }

  return amount || category
    ? { amount, category, subcategory, description:text }
    : null;
}