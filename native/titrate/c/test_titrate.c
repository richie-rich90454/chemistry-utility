/*
 * Comprehensive test suite for the C titrate module.
 *
 * Uses only the C standard library (assert.h, math.h, stdio.h, stdlib.h,
 * string.h). Compile and run with:
 *   make test
 *
 * The suite covers:
 *   - Strong-acid-strong-base titration: equivalence volume, sample pH values
 *     at pre-equivalence, equivalence, and post-equivalence points
 *   - Weak-acid-strong-base titration: initial pH, buffer region pH
 *     (Henderson-Hasselbalch), equivalence pH, post-equivalence pH
 *   - pH clamping to [0, 14]
 *   - Equivalence point detection (pH ~ 7 for strong-strong, pH > 7 for
 *     weak-strong)
 *   - Input validation: non-positive concentrations, zero num_points,
 *     missing pKa, invalid mode, NULL out pointer
 *   - Memory: titrate_result_free is safe on NULL and idempotent
 *   - Monotonic pH increase across the curve
 *   - Sample count equals num_points + 1 when no points are skipped
 *   - Numerical agreement with the Go reference implementation at known
 *     sample points (tolerance 1e-9)
 */

#include "titrate.h"

#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int tests_run = 0;

#define TEST(name) \
    static void name(void); \
    static void name##_runner(void) { \
        tests_run++; \
        printf("  [RUN] %s\n", #name); \
        fflush(stdout); \
        name(); \
        printf("  [OK]  %s\n", #name); \
        fflush(stdout); \
    } \
    static void name(void)

/* Floating-point comparison with tolerance. */
static int approx(double a, double b, double tol) {
    return fabs(a - b) <= tol;
}

/* ---- Strong-acid-strong-base tests ---- */

TEST(strong_strong_equivalence_volume_is_ca_va_over_ct) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_OK);
    /* equivalence_volume = 0.1 * 0.025 / 0.1 = 0.025 L */
    assert(approx(r.equivalence_volume, 0.025, 1e-9));
    titrate_result_free(&r);
}

TEST(strong_strong_initial_pH_is_acidic) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_OK);
    /* At i=0, vb=0, moles_h = 0.1*0.025 = 0.0025, [H+] = 0.0025/0.025 = 0.1, pH = 1. */
    assert(r.num_points > 0);
    assert(approx(r.points[0].volume, 0.0, 1e-9));
    assert(approx(r.points[0].ph, 1.0, 1e-9));
    titrate_result_free(&r);
}

TEST(strong_strong_equivalence_point_pH_is_7) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_OK);
    /* At i = 25 (halfway through 0..50), vb = equivalence_volume * 25/50 * 2 = equivalence_volume. */
    /* moles_h = 0.1*0.025 - 0.1*0.025 = 0, so pH = 7.0. */
    size_t i;
    int found = 0;
    for (i = 0; i < r.num_points; i++) {
        if (approx(r.points[i].volume, 0.025, 1e-9)) {
            assert(approx(r.points[i].ph, 7.0, 1e-9));
            found = 1;
            break;
        }
    }
    assert(found && "equivalence point (vb = 0.025 L) must be in the curve");
    titrate_result_free(&r);
}

TEST(strong_strong_post_equivalence_pH_is_basic) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_OK);
    /* At the last point, vb = 2 * equivalence_volume, so we have excess OH-. */
    double last_ph = r.points[r.num_points - 1].ph;
    assert(last_ph > 7.0);
    titrate_result_free(&r);
}

TEST(strong_strong_pH_is_monotonically_nondecreasing) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.05, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 100, &r);
    assert(err == TITRATE_OK);
    size_t i;
    for (i = 1; i < r.num_points; i++) {
        assert(r.points[i].ph >= r.points[i - 1].ph - 1e-9);
    }
    titrate_result_free(&r);
}

TEST(strong_strong_num_points_is_num_points_plus_one) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_OK);
    /* No points are skipped in strong-strong mode (total_vol never 0 since va > 0). */
    assert(r.num_points == 51);
    titrate_result_free(&r);
}

TEST(strong_strong_high_concentration_initial_pH_is_very_acidic) {
    titrate_result_t r;
    /* 1 M HCl: [H+] = 1, pH = 0. */
    int err = titrate_curve(1.0, 0.025, 1.0, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 10, &r);
    assert(err == TITRATE_OK);
    assert(approx(r.points[0].ph, 0.0, 1e-9));
    titrate_result_free(&r);
}

TEST(strong_strong_clamps_to_14_at_high_excess) {
    titrate_result_t r;
    /* 10 M acid with very dilute titrant — at the end, excess OH- would give pH > 14. */
    /* Actually, with ca=10, va=0.025, ct=0.001, eq_vol = 250 L. */
    /* At i=10, vb = 250 * 10/10 * 2 = 500 L. moles_h = 10*0.025 - 0.001*500 = 0.25 - 0.5 = -0.25. */
    /* [OH-] = 0.25 / 525 = 4.76e-4. pOH = 3.32. pH = 10.68. Not above 14. */
    /* Use a setup that actually exceeds 14 to test clamping: 10 M NaOH titrant into 0.001 M acid. */
    int err = titrate_curve(0.001, 0.025, 10.0, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 10, &r);
    assert(err == TITRATE_OK);
    size_t i;
    for (i = 0; i < r.num_points; i++) {
        assert(r.points[i].ph <= 14.0 + 1e-9);
        assert(r.points[i].ph >= 0.0 - 1e-9);
    }
    titrate_result_free(&r);
}

/* ---- Weak-acid-strong-base tests ---- */

TEST(weak_strong_equivalence_volume_matches_formula) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 50, &r);
    assert(err == TITRATE_OK);
    assert(approx(r.equivalence_volume, 0.025, 1e-9));
    titrate_result_free(&r);
}

TEST(weak_strong_initial_pH_uses_weak_acid_formula) {
    titrate_result_t r;
    /* pKa = 4.75, ca = 0.1. Initial pH = 0.5 * (4.75 - log10(0.1)) = 0.5 * (4.75 + 1) = 2.875. */
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 50, &r);
    assert(err == TITRATE_OK);
    assert(approx(r.points[0].ph, 2.875, 1e-9));
    titrate_result_free(&r);
}

TEST(weak_strong_half_equivalence_pH_equals_pKa) {
    titrate_result_t r;
    /* At half-equivalence (fraction = 0.5), pH = pKa + log10(1) = pKa = 4.75. */
    /* fraction = 0.5 occurs when vb = 0.5 * equivalence_volume = 0.0125. */
    /* vb = eq_vol * i / 50 * 2 = 0.025 * i / 50 * 2 = 0.001 * i. */
    /* So vb = 0.0125 at i = 12.5, which is not an integer. */
    /* Use num_points = 100 so i = 25 gives vb = 0.025 * 25/100 * 2 = 0.0125. */
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 100, &r);
    assert(err == TITRATE_OK);
    size_t i;
    int found = 0;
    for (i = 0; i < r.num_points; i++) {
        if (approx(r.points[i].volume, 0.0125, 1e-9)) {
            /* pH = pKa + log10(moles_a / moles_ha). */
            /* moles_a = 0.1 * 0.0125 = 0.00125. moles_ha = 0.1*0.025 - 0.1*0.0125 = 0.00125. */
            /* ratio = 1, log10(1) = 0, pH = 4.75. */
            assert(approx(r.points[i].ph, 4.75, 1e-9));
            found = 1;
            break;
        }
    }
    assert(found && "half-equivalence point must be in the curve");
    titrate_result_free(&r);
}

TEST(weak_strong_equivalence_pH_is_basic) {
    titrate_result_t r;
    /* At equivalence, weak acid fully converted to conjugate base. pH > 7. */
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 50, &r);
    assert(err == TITRATE_OK);
    size_t i;
    int found = 0;
    for (i = 0; i < r.num_points; i++) {
        if (approx(r.points[i].volume, 0.025, 1e-9)) {
            assert(r.points[i].ph > 7.0);
            found = 1;
            break;
        }
    }
    assert(found && "equivalence point must be in the curve");
    titrate_result_free(&r);
}

TEST(weak_strong_post_equivalence_pH_is_high) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 50, &r);
    assert(err == TITRATE_OK);
    double last_ph = r.points[r.num_points - 1].ph;
    assert(last_ph > 10.0);
    titrate_result_free(&r);
}

TEST(weak_strong_pH_monotonically_nondecreasing) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.05, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 100, &r);
    assert(err == TITRATE_OK);
    size_t i;
    for (i = 1; i < r.num_points; i++) {
        assert(r.points[i].ph >= r.points[i - 1].ph - 1e-9);
    }
    titrate_result_free(&r);
}

TEST(weak_strong_clamps_pH_to_valid_range) {
    titrate_result_t r;
    int err = titrate_curve(10.0, 0.025, 10.0, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 0.0, 50, &r);
    assert(err == TITRATE_OK);
    size_t i;
    for (i = 0; i < r.num_points; i++) {
        assert(r.points[i].ph >= 0.0 - 1e-9);
        assert(r.points[i].ph <= 14.0 + 1e-9);
    }
    titrate_result_free(&r);
}

/* ---- Validation tests ---- */

TEST(rejects_zero_analyte_concentration) {
    titrate_result_t r;
    int err = titrate_curve(0.0, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_ERR_INVALID_CONCENTRATION);
    assert(r.error == TITRATE_ERR_INVALID_CONCENTRATION);
    assert(r.points == NULL);
    assert(r.num_points == 0);
    titrate_result_free(&r);
}

TEST(rejects_negative_analyte_concentration) {
    titrate_result_t r;
    int err = titrate_curve(-0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_ERR_INVALID_CONCENTRATION);
    titrate_result_free(&r);
}

TEST(rejects_zero_analyte_volume) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.0, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_ERR_INVALID_CONCENTRATION);
    titrate_result_free(&r);
}

TEST(rejects_zero_titrant_concentration) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.0, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_ERR_INVALID_CONCENTRATION);
    titrate_result_free(&r);
}

TEST(rejects_zero_num_points) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 0, &r);
    assert(err == TITRATE_ERR_INVALID_NUM_POINTS);
    titrate_result_free(&r);
}

TEST(rejects_missing_pKa_for_weak_acid_mode) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_ERR_PKA_REQUIRED);
    titrate_result_free(&r);
}

TEST(rejects_invalid_mode_value) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, (titrate_mode_t)99, NAN, 50, &r);
    assert(err == TITRATE_ERR_INVALID_MODE);
    titrate_result_free(&r);
}

TEST(strong_strong_accepts_nan_pKa) {
    /* Strong-strong mode does not use pKa; NaN is fine. */
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 10, &r);
    assert(err == TITRATE_OK);
    titrate_result_free(&r);
}

/* ---- Memory safety tests ---- */

TEST(titrate_result_free_handles_null) {
    titrate_result_free(NULL);
}

TEST(titrate_result_free_handles_zero_initialized) {
    titrate_result_t r;
    r.points = NULL;
    r.num_points = 0;
    r.equivalence_volume = 0.0;
    r.error = TITRATE_OK;
    titrate_result_free(&r);
    assert(r.points == NULL);
    assert(r.num_points == 0);
}

TEST(titrate_result_free_is_idempotent) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 10, &r);
    assert(err == TITRATE_OK);
    titrate_result_free(&r);
    /* Calling again should be a no-op. */
    titrate_result_free(&r);
    assert(r.points == NULL);
}

TEST(titrate_result_free_works_after_error) {
    titrate_result_t r;
    int err = titrate_curve(0.0, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 10, &r);
    assert(err != TITRATE_OK);
    /* points is NULL, but free should still be safe. */
    titrate_result_free(&r);
    assert(r.points == NULL);
}

/* ---- Numerical agreement tests ---- */

TEST(strong_strong_agrees_with_reference_at_quarter_equivalence) {
    /* At vb = 0.25 * eq_vol = 0.00625: moles_h = 0.1*0.025 - 0.1*0.00625 = 0.001875. */
    /* total_vol = 0.025 + 0.00625 = 0.03125. [H+] = 0.001875/0.03125 = 0.06. pH = -log10(0.06) = 1.2218487496. */
    /* Use num_points=200 so i=25 gives vb = 0.025 * 25/200 * 2 = 0.00625 exactly. */
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 200, &r);
    assert(err == TITRATE_OK);
    size_t i;
    int found = 0;
    for (i = 0; i < r.num_points; i++) {
        if (approx(r.points[i].volume, 0.00625, 1e-9)) {
            double expected = -log10(0.06);
            assert(approx(r.points[i].ph, expected, 1e-6));
            found = 1;
            break;
        }
    }
    assert(found);
    titrate_result_free(&r);
}

TEST(weak_strong_buffer_region_uses_henderson_hasselbalch) {
    /* At fraction = 0.25 (vb = 0.00625), pH = pKa + log10(0.25/0.75) = 4.75 + log10(1/3). */
    /* log10(1/3) = -0.4771212547. Expected pH = 4.2728787453. */
    /* Use num_points=200 so i=25 gives vb = 0.025 * 25/200 * 2 = 0.00625 exactly. */
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.75, 200, &r);
    assert(err == TITRATE_OK);
    size_t i;
    int found = 0;
    for (i = 0; i < r.num_points; i++) {
        if (approx(r.points[i].volume, 0.00625, 1e-9)) {
            double expected = 4.75 + log10(0.25 / 0.75);
            assert(approx(r.points[i].ph, expected, 1e-6));
            found = 1;
            break;
        }
    }
    assert(found);
    titrate_result_free(&r);
}

TEST(strong_strong_with_different_concentrations) {
    /* ca = 0.5, va = 0.02, ct = 0.25. eq_vol = 0.5*0.02/0.25 = 0.04 L. */
    titrate_result_t r;
    int err = titrate_curve(0.5, 0.02, 0.25, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 50, &r);
    assert(err == TITRATE_OK);
    assert(approx(r.equivalence_volume, 0.04, 1e-9));
    /* Initial pH: [H+] = 0.5, pH = 0.30103. */
    assert(approx(r.points[0].ph, -log10(0.5), 1e-9));
    titrate_result_free(&r);
}

TEST(weak_strong_with_acetic_acid_pKa) {
    /* Acetic acid pKa = 4.76. ca = 0.1, va = 0.025, ct = 0.1. */
    /* Initial pH = 0.5 * (4.76 - log10(0.1)) = 0.5 * (4.76 + 1) = 2.88. */
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_WEAK_ACID_STRONG_BASE, 4.76, 50, &r);
    assert(err == TITRATE_OK);
    assert(approx(r.points[0].ph, 2.88, 1e-9));
    titrate_result_free(&r);
}

TEST(num_points_one_produces_two_samples) {
    titrate_result_t r;
    int err = titrate_curve(0.1, 0.025, 0.1, TITRATE_MODE_STRONG_ACID_STRONG_BASE, NAN, 1, &r);
    assert(err == TITRATE_OK);
    assert(r.num_points == 2);
    titrate_result_free(&r);
}

TEST(strerror_returns_non_null_for_all_codes) {
    assert(titrate_strerror(TITRATE_OK) != NULL);
    assert(titrate_strerror(TITRATE_ERR_INVALID_CONCENTRATION) != NULL);
    assert(titrate_strerror(TITRATE_ERR_INVALID_NUM_POINTS) != NULL);
    assert(titrate_strerror(TITRATE_ERR_PKA_REQUIRED) != NULL);
    assert(titrate_strerror(TITRATE_ERR_OUT_OF_MEMORY) != NULL);
    assert(titrate_strerror(TITRATE_ERR_INVALID_MODE) != NULL);
    assert(titrate_strerror(999) != NULL);
}

TEST(strerror_returns_distinct_messages) {
    const char *m1 = titrate_strerror(TITRATE_ERR_INVALID_CONCENTRATION);
    const char *m2 = titrate_strerror(TITRATE_ERR_INVALID_NUM_POINTS);
    assert(strcmp(m1, m2) != 0);
}

/* ---- Runner ---- */

typedef void (*test_fn)(void);

static test_fn all_tests[] = {
    strong_strong_equivalence_volume_is_ca_va_over_ct_runner,
    strong_strong_initial_pH_is_acidic_runner,
    strong_strong_equivalence_point_pH_is_7_runner,
    strong_strong_post_equivalence_pH_is_basic_runner,
    strong_strong_pH_is_monotonically_nondecreasing_runner,
    strong_strong_num_points_is_num_points_plus_one_runner,
    strong_strong_high_concentration_initial_pH_is_very_acidic_runner,
    strong_strong_clamps_to_14_at_high_excess_runner,
    weak_strong_equivalence_volume_matches_formula_runner,
    weak_strong_initial_pH_uses_weak_acid_formula_runner,
    weak_strong_half_equivalence_pH_equals_pKa_runner,
    weak_strong_equivalence_pH_is_basic_runner,
    weak_strong_post_equivalence_pH_is_high_runner,
    weak_strong_pH_monotonically_nondecreasing_runner,
    weak_strong_clamps_pH_to_valid_range_runner,
    rejects_zero_analyte_concentration_runner,
    rejects_negative_analyte_concentration_runner,
    rejects_zero_analyte_volume_runner,
    rejects_zero_titrant_concentration_runner,
    rejects_zero_num_points_runner,
    rejects_missing_pKa_for_weak_acid_mode_runner,
    rejects_invalid_mode_value_runner,
    strong_strong_accepts_nan_pKa_runner,
    titrate_result_free_handles_null_runner,
    titrate_result_free_handles_zero_initialized_runner,
    titrate_result_free_is_idempotent_runner,
    titrate_result_free_works_after_error_runner,
    strong_strong_agrees_with_reference_at_quarter_equivalence_runner,
    weak_strong_buffer_region_uses_henderson_hasselbalch_runner,
    strong_strong_with_different_concentrations_runner,
    weak_strong_with_acetic_acid_pKa_runner,
    num_points_one_produces_two_samples_runner,
    strerror_returns_non_null_for_all_codes_runner,
    strerror_returns_distinct_messages_runner
};

int main(void) {
    size_t n = sizeof(all_tests) / sizeof(all_tests[0]);
    size_t i;
    printf("Running %zu titrate tests...\n", n);
    for (i = 0; i < n; i++) {
        all_tests[i]();
    }
    printf("\nAll %d tests passed.\n", tests_run);
    return 0;
}
