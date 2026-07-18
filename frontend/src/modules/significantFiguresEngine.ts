/**
 * Engine for tracking significant figures through calculations.
 * Provides methods for counting, rounding, and applying sig fig rules
 * to arithmetic operations (multiplication and addition).
 */
export class SignificantFiguresEngine {
    /**
     * Counts the number of significant figures in a numeric string.
     *
     * Rules:
     *   - Non-zero digits are always significant: 1-9
     *   - Zeros between non-zero digits are significant: 1002 has 4 sig figs
     *   - Leading zeros are NOT significant: 0.002 has 1 sig fig
     *   - Trailing zeros after decimal point ARE significant: 2.00 has 3 sig figs
     *   - Trailing zeros in whole number with decimal ARE significant: 100. has 3 sig figs
     *   - Trailing zeros in whole number without decimal are AMBIGUOUS: returns -1
     *   - In scientific notation, all digits in coefficient are significant: 1.00e3 has 3
     */
    public static countSigFigs(value: string): number {
        let trimmed = value.trim();
        if (trimmed.length === 0) {
            return 0;
        }

        if (trimmed.charAt(0) === "-") {
            trimmed = trimmed.substring(1);
        } else if (trimmed.charAt(0) === "+") {
            trimmed = trimmed.substring(1);
        }

        if (trimmed.length === 0) {
            return 0;
        }

        // Handle scientific notation: extract coefficient
        let coefficient = trimmed;
        let eIndex = trimmed.toLowerCase().indexOf("e");
        if (eIndex !== -1) {
            coefficient = trimmed.substring(0, eIndex);
        }

        // Special case: pure-zero values like "0", "0.", ".0", "0.00", "00.000"
        if (/^(0+\.?0*|0*\.0+)$/.test(coefficient)) {
            return 1;
        }

        // Check if it has a decimal point
        let hasDecimal = coefficient.indexOf(".") !== -1;

        if (hasDecimal) {
            // Split into integer and fractional parts
            let parts = coefficient.split(".");
            let integerPart = parts[0];
            let fractionalPart = parts[1];

            // Remove leading zeros from integer part
            let strippedInteger = integerPart.replace(/^0+/, "");

            let sigFigs = 0;

            // Count significant digits in integer part (after leading zeros)
            for (let i = 0; i < strippedInteger.length; i++) {
                if (strippedInteger.charAt(i) !== "0" || sigFigs > 0) {
                    sigFigs++;
                }
            }

            if (sigFigs > 0) {
                // Integer part has significant digits, so all fractional digits are significant
                sigFigs += fractionalPart.length;
            } else {
                // Integer part is all zeros, so leading zeros in fractional part are not significant
                // but trailing zeros after the first non-zero digit ARE significant
                let foundNonZero = false;
                for (let i = 0; i < fractionalPart.length; i++) {
                    let ch = fractionalPart.charAt(i);
                    if (ch !== "0") {
                        foundNonZero = true;
                        sigFigs++;
                    } else if (foundNonZero) {
                        // Zeros after a non-zero digit in the fractional part are significant
                        sigFigs++;
                    }
                }
            }

            return sigFigs;
        } else {
            // No decimal point: e.g., "100", "1020"
            // Remove leading zeros
            let stripped = coefficient.replace(/^0+/, "");
            if (stripped.length === 0) {
                return 1;
            }

            // Check for trailing zeros without decimal point (ambiguous)
            if (stripped.length > 1 && stripped.charAt(stripped.length - 1) === "0") {
                // Has trailing zeros without decimal - ambiguous
                // Return -1 to indicate ambiguity
                let lastNonZero = -1;
                for (let i = stripped.length - 1; i >= 0; i--) {
                    if (stripped.charAt(i) !== "0") {
                        lastNonZero = i;
                        break;
                    }
                }
                if (lastNonZero < stripped.length - 1) {
                    return -1;
                }
            }

            // No trailing zeros - count all digits
            let count = 0;
            let foundNonZero = false;
            for (let i = 0; i < stripped.length; i++) {
                let ch = stripped.charAt(i);
                if (ch !== "0") {
                    foundNonZero = true;
                    count++;
                } else if (foundNonZero) {
                    count++;
                }
            }
            return count;
        }
    }

    /**
     * Rounds a number to the specified number of significant figures.
     */
    public static roundToSigFigs(value: number, sigFigs: number): number {
        if (sigFigs <= 0) {
            return 0;
        }
        if (value === 0) {
            return 0;
        }
        let magnitude = Math.floor(Math.log10(Math.abs(value)));
        let factor = Math.pow(10, sigFigs - 1 - magnitude);
        let rounded = Math.round(value * factor) / factor;
        return rounded;
    }

    /**
     * Applies multiplication sig fig rules: result has min(aSigFigs, bSigFigs) sig figs.
     */
    public static multiply(a: number, aSigFigs: number, b: number, bSigFigs: number): { result: number; sigFigs: number } {
        let product = a * b;
        let resultSigFigs = Math.min(aSigFigs, bSigFigs);
        let result = SignificantFiguresEngine.roundToSigFigs(product, resultSigFigs);
        return { result: result, sigFigs: resultSigFigs };
    }

    /**
     * Applies addition sig fig rules: result has min(aDecimalPlaces, bDecimalPlaces) decimal places.
     */
    public static add(a: number, aDecimalPlaces: number, b: number, bDecimalPlaces: number): { result: number; decimalPlaces: number } {
        let sum = a + b;
        let resultDecimalPlaces = Math.min(aDecimalPlaces, bDecimalPlaces);
        let factor = Math.pow(10, resultDecimalPlaces);
        let result = Math.round(sum * factor) / factor;
        return { result: result, decimalPlaces: resultDecimalPlaces };
    }

    /**
     * Formats a number with the specified number of significant figures.
     * Uses scientific notation for very large or very small numbers.
     */
    public static formatResult(value: number, sigFigs: number): string {
        if (sigFigs <= 0) {
            return "0";
        }
        if (value === 0) {
            let zeros = "";
            for (let i = 0; i < sigFigs - 1; i++) {
                zeros += "0";
            }
            return "0." + zeros + "0";
        }
        let rounded = SignificantFiguresEngine.roundToSigFigs(value, sigFigs);
        let absValue = Math.abs(rounded);
        if (absValue >= 1e6 || (absValue < 1e-3 && absValue !== 0)) {
            return rounded.toExponential(sigFigs - 1);
        }
        // Format with the right number of decimal places
        let magnitude = Math.floor(Math.log10(absValue));
        let decimalPlaces = Math.max(0, sigFigs - 1 - magnitude);
        let result = rounded.toFixed(decimalPlaces);
        return result;
    }

    /**
     * Counts the number of decimal places in a numeric string.
     */
    public static countDecimalPlaces(value: string): number {
        let trimmed = value.trim();
        let dotIndex = trimmed.indexOf(".");
        if (dotIndex === -1) {
            return 0;
        }
        // Handle scientific notation
        let eIndex = trimmed.toLowerCase().indexOf("e");
        let fractionalEnd = eIndex !== -1 ? eIndex : trimmed.length;
        return fractionalEnd - dotIndex - 1;
    }
}
