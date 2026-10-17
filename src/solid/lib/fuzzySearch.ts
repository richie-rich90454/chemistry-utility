function levenshteinDistance(a: string, b: string): number {
    let m = a.length;
    let n = b.length;
    let d: number[][] = [];
    let i: number;
    let j: number;
    for (i = 0; i <= m; i++) {
        d[i] = [i];
    }
    for (j = 0; j <= n; j++) {
        d[0][j] = j;
    }
    for (i = 1; i <= m; i++) {
        for (j = 1; j <= n; j++) {
            let cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[m][n];
}
function fuzzyMatch(query: string, text: string): boolean {
    if (text.includes(query)) {
        return true;
    }
    let words = text.split(/\s+/);
    let i: number;
    for (i = 0; i < words.length; i++) {
        let distance = levenshteinDistance(query, words[i]);
        if (distance <= Math.max(1, Math.floor(query.length * 0.3))) {
            return true;
        }
    }
    return false;
}
export {levenshteinDistance, fuzzyMatch};
