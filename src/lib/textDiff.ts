// ─────────────────────────────────────────────────────────────────────────────
// textDiff.ts — Bíblia Viva · Sprint 8
// Word-level LCS diff between two text strings.
// Returns an array of tokens, each tagged as "equal" or "different".
// Zero external dependencies.
// ─────────────────────────────────────────────────────────────────────────────

export interface DiffToken {
    word: string;
    type: "equal" | "different";
}

/** Normalise a word to lowercase, stripping punctuation for comparison */
const norm = (w: string) => w.toLowerCase().replace(/[^\wáéíóúãõâêîôûàèìòùçüñ]/gu, "");

/**
 * Compute the LCS matrix for two word arrays (O(n×m) space).
 * Returns a boolean mask: true = word at index i of `a` is in the LCS.
 */
function lcsMatchMask(a: string[], b: string[]): boolean[] {
    const na = a.length;
    const nb = b.length;

    // dp[i][j] = LCS length for a[0..i-1] vs b[0..j-1]
    const dp: number[][] = Array.from({ length: na + 1 }, () => new Array(nb + 1).fill(0));

    for (let i = 1; i <= na; i++) {
        for (let j = 1; j <= nb; j++) {
            if (norm(a[i - 1]) === norm(b[j - 1])) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to find which indices of `a` are in the LCS
    const matched = new Array(na).fill(false);
    let i = na;
    let j = nb;
    while (i > 0 && j > 0) {
        if (norm(a[i - 1]) === norm(b[j - 1])) {
            matched[i - 1] = true;
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return matched;
}

/**
 * Diff two verse texts at the word level.
 * Returns tokens for `textA` where words not in the LCS are marked "different".
 * Also returns tokens for `textB` symmetrically.
 */
export function diffVerses(
    textA: string,
    textB: string
): { tokensA: DiffToken[]; tokensB: DiffToken[] } {
    if (!textA || !textB) {
        const tokensA: DiffToken[] = (textA ?? "").trim().split(/\s+/).filter(Boolean).map(w => ({ word: w, type: "equal" as const }));
        const tokensB: DiffToken[] = (textB ?? "").trim().split(/\s+/).filter(Boolean).map(w => ({ word: w, type: "equal" as const }));
        return { tokensA, tokensB };
    }
    const wordsA = textA.trim().split(/\s+/);
    const wordsB = textB.trim().split(/\s+/);

    const maskA = lcsMatchMask(wordsA, wordsB);
    const maskB = lcsMatchMask(wordsB, wordsA);

    const tokensA: DiffToken[] = wordsA.map((w, i) => ({
        word: w,
        type: maskA[i] ? "equal" : "different",
    }));

    const tokensB: DiffToken[] = wordsB.map((w, i) => ({
        word: w,
        type: maskB[i] ? "equal" : "different",
    }));

    return { tokensA, tokensB };
}
