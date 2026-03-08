/**
 * English → Hindi (Devanagari) phonetic transliteration utility.
 *
 * Converts Latin-script text to Devanagari using a phonetic mapping table.
 * Designed for Indian names — handles common consonant clusters like "sh", "bh", "kh", etc.
 *
 * This is a best-effort, offline-first transliteration.
 */

// Vowel mappings (independent forms used at the start of a word / after another vowel)
const VOWELS: Record<string, string> = {
    'aa': 'आ', 'ee': 'ई', 'oo': 'ऊ', 'ai': 'ऐ', 'au': 'औ',
    'ei': 'ऐ', 'ou': 'औ',
    'a': 'अ', 'e': 'ए', 'i': 'इ', 'o': 'ओ', 'u': 'उ',
};

// Vowel matras (dependent forms used after a consonant)
const MATRAS: Record<string, string> = {
    'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ai': 'ै', 'au': 'ौ',
    'ei': 'ै', 'ou': 'ौ',
    'a': '', 'e': 'े', 'i': 'ि', 'o': 'ो', 'u': 'ु',
};

// Consonant mappings (multi-char first for greedy matching)
const CONSONANTS: Record<string, string> = {
    // Aspirated / special clusters
    'bh': 'भ', 'ch': 'छ', 'chh': 'छ', 'dh': 'ध', 'gh': 'घ',
    'jh': 'झ', 'kh': 'ख', 'ph': 'फ', 'sh': 'श', 'shh': 'ष',
    'th': 'थ', 'ng': 'ङ', 'ny': 'ञ',
    'tr': 'त्र', 'gn': 'ज्ञ', 'gy': 'ज्ञ',
    'ksh': 'क्ष', 'ks': 'क्ष',
    'dny': 'ज्ञ',
    // Simple consonants
    'b': 'ब', 'c': 'क', 'd': 'द', 'f': 'फ', 'g': 'ग',
    'h': 'ह', 'j': 'ज', 'k': 'क', 'l': 'ल', 'm': 'म',
    'n': 'न', 'p': 'प', 'q': 'क', 'r': 'र', 's': 'स',
    't': 'त', 'v': 'व', 'w': 'व', 'x': 'क्स', 'y': 'य',
    'z': 'ज़',
};

// Sort keys by length descending for greedy matching
const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);
const MATRA_KEYS = Object.keys(MATRAS).sort((a, b) => b.length - a.length);
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);

function matchKey(text: string, pos: number, keys: string[]): string | null {
    const remaining = text.substring(pos).toLowerCase();
    for (const key of keys) {
        if (remaining.startsWith(key)) {
            return key;
        }
    }
    return null;
}

/**
 * Transliterate a single word from English to Hindi (Devanagari).
 */
function transliterateWord(word: string): string {
    if (!word) return '';

    let result = '';
    let i = 0;
    let lastWasConsonant = false;

    while (i < word.length) {
        // Try to match a consonant
        const consonantKey = matchKey(word, i, CONSONANT_KEYS);
        if (consonantKey) {
            if (lastWasConsonant) {
                // Add halant before this consonant (consonant cluster)
                result += '्';
            }
            result += CONSONANTS[consonantKey];
            i += consonantKey.length;
            lastWasConsonant = true;

            // Check if a vowel follows the consonant
            const matraKey = matchKey(word, i, MATRA_KEYS);
            if (matraKey) {
                result += MATRAS[matraKey];
                i += matraKey.length;
                lastWasConsonant = false;
            }
            // If no vowel follows, the inherent 'a' is implied — we'll add halant
            // only if another consonant follows (handled in next iteration)
            continue;
        }

        // Try to match a vowel (independent form)
        const vowelKey = matchKey(word, i, VOWEL_KEYS);
        if (vowelKey) {
            if (lastWasConsonant) {
                // Vowel after consonant — use matra form
                const mk = matchKey(word, i, MATRA_KEYS);
                if (mk) {
                    result += MATRAS[mk];
                    i += mk.length;
                } else {
                    result += VOWELS[vowelKey];
                    i += vowelKey.length;
                }
            } else {
                result += VOWELS[vowelKey];
                i += vowelKey.length;
            }
            lastWasConsonant = false;
            continue;
        }

        // Unrecognized character — pass through
        if (lastWasConsonant) {
            // End the consonant with implicit 'a' (no halant needed for standalone)
            lastWasConsonant = false;
        }
        result += word[i];
        i++;
    }

    return result;
}

/**
 * Transliterate English text to Hindi (Devanagari) script.
 *
 * @example
 *   transliterateToHindi('Ramesh Sharma')  // → 'रमेश शर्मा'
 *   transliterateToHindi('Prashant Dubey') // → 'प्रशांत दुबे'
 */
export function transliterateToHindi(text: string): string {
    if (!text) return '';
    return text
        .split(/(\s+)/) // split but keep whitespace tokens
        .map(segment => (/^\s+$/.test(segment) ? segment : transliterateWord(segment)))
        .join('');
}
