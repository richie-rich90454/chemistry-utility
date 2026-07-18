#ifndef TITRATE_H
#define TITRATE_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Titration curve calculator.
 *
 * Computes pH vs titrant volume data points for two titration modes:
 *   - Strong acid + strong base
 *   - Weak acid + strong base (Henderson-Hasselbalch in the buffer region)
 *
 * The implementation is portable C99 and uses only the C standard library
 * (math.h, stdlib.h, string.h, stdio.h). It mirrors the algorithm in
 * internal/calculators/solution.go (TitrationCurve) so results are
 * byte-for-byte compatible with the Go reference implementation.
 */

/* Titration mode selector. */
typedef enum {
    /* Strong acid analyte titrated with a strong base. */
    TITRATE_MODE_STRONG_ACID_STRONG_BASE = 0,
    /* Weak acid analyte titrated with a strong base. Requires pKa. */
    TITRATE_MODE_WEAK_ACID_STRONG_BASE = 1
} titrate_mode_t;

/* A single point on the titration curve. */
typedef struct {
    /* Volume of titrant added (L). */
    double volume;
    /* pH at this volume. */
    double ph;
} titrate_point_t;

/* Result of a titration curve calculation. */
typedef struct {
    /* Pointer to an array of num_points curve points, heap-allocated.
       Owned by the caller after a successful call; free with
       titrate_result_free. NULL if error != 0. */
    titrate_point_t *points;
    /* Number of valid entries in points. 0 if error != 0. */
    size_t num_points;
    /* Volume of titrant required to reach the equivalence point (L). */
    double equivalence_volume;
    /* Error code: 0 on success, non-zero on failure. See titrate_strerror. */
    int error;
} titrate_result_t;

/* Error codes returned in titrate_result_t.error. */
enum {
    TITRATE_OK = 0,
    /* analyte_concentration, analyte_volume, or titrant_concentration <= 0. */
    TITRATE_ERR_INVALID_CONCENTRATION = 1,
    /* num_points == 0. */
    TITRATE_ERR_INVALID_NUM_POINTS = 2,
    /* Weak-acid mode selected but pKa is NaN. */
    TITRATE_ERR_PKA_REQUIRED = 3,
    /* malloc failed. */
    TITRATE_ERR_OUT_OF_MEMORY = 4,
    /* mode value is not a member of titrate_mode_t. */
    TITRATE_ERR_INVALID_MODE = 5
};

/*
 * Computes the titration curve.
 *
 *   analyte_concentration (ca): molarity of the analyte (mol/L), must be > 0.
 *   analyte_volume (va):        initial volume of the analyte (L), must be > 0.
 *   titrant_concentration (ct): molarity of the titrant (mol/L), must be > 0.
 *   mode:                        titration mode (see titrate_mode_t).
 *   pKa:                         acid dissociation constant (only required
 *                                for TITRATE_MODE_WEAK_ACID_STRONG_BASE;
 *                                pass NAN for strong-acid mode).
 *   num_points:                  number of intervals along the x-axis; the
 *                                result contains num_points + 1 samples.
 *                                Must be > 0.
 *   out:                         pointer to a titrate_result_t to fill in.
 *                                On success, out->points is heap-allocated
 *                                and owned by the caller.
 *
 * Returns: 0 on success (also stored in out->error), non-zero error code on
 *          failure. On failure, out->points is NULL and out->num_points is 0.
 *
 * The caller MUST call titrate_result_free(out) when done to release the
 * points buffer, even on error (the function is idempotent on NULL).
 */
int titrate_curve(double analyte_concentration,
                  double analyte_volume,
                  double titrant_concentration,
                  titrate_mode_t mode,
                  double pKa,
                  size_t num_points,
                  titrate_result_t *out);

/*
 * Releases the points buffer owned by a titrate_result_t. Safe to call on
 * a zero-initialized struct or after a failed titrate_curve call. Sets
 * points to NULL and num_points to 0.
 */
void titrate_result_free(titrate_result_t *result);

/*
 * Returns a human-readable description of an error code.
 */
const char *titrate_strerror(int err);

#ifdef __cplusplus
}
#endif

#endif /* TITRATE_H */
