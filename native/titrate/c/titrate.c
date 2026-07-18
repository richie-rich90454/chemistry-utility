#include "titrate.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

/* Clamp pH to the valid [0, 14] range. */
static double clamp_ph(double ph) {
    if (ph < 0.0) {
        return 0.0;
    }
    if (ph > 14.0) {
        return 14.0;
    }
    return ph;
}

int titrate_curve(double analyte_concentration,
                  double analyte_volume,
                  double titrant_concentration,
                  titrate_mode_t mode,
                  double pKa,
                  size_t num_points,
                  titrate_result_t *out) {
    if (out == NULL) {
        return TITRATE_ERR_INVALID_NUM_POINTS;
    }
    out->points = NULL;
    out->num_points = 0;
    out->equivalence_volume = 0.0;
    out->error = TITRATE_OK;

    /* Validate concentrations and volume. */
    if (!(analyte_concentration > 0.0) ||
        !(analyte_volume > 0.0) ||
        !(titrant_concentration > 0.0)) {
        out->error = TITRATE_ERR_INVALID_CONCENTRATION;
        return out->error;
    }
    /* Validate num_points. */
    if (num_points == 0) {
        out->error = TITRATE_ERR_INVALID_NUM_POINTS;
        return out->error;
    }
    /* Validate mode. */
    if (mode != TITRATE_MODE_STRONG_ACID_STRONG_BASE &&
        mode != TITRATE_MODE_WEAK_ACID_STRONG_BASE) {
        out->error = TITRATE_ERR_INVALID_MODE;
        return out->error;
    }
    /* Validate pKa for weak-acid mode. */
    if (mode == TITRATE_MODE_WEAK_ACID_STRONG_BASE && isnan(pKa)) {
        out->error = TITRATE_ERR_PKA_REQUIRED;
        return out->error;
    }

    double ca = analyte_concentration;
    double va = analyte_volume;
    double ct = titrant_concentration;
    double equivalence_volume = ca * va / ct;

    /* Allocate buffer for num_points + 1 samples. */
    size_t capacity = num_points + 1;
    titrate_point_t *points = (titrate_point_t *)malloc(capacity * sizeof(titrate_point_t));
    if (points == NULL) {
        out->error = TITRATE_ERR_OUT_OF_MEMORY;
        return out->error;
    }
    size_t count = 0;

    size_t i;
    for (i = 0; i <= num_points; i++) {
        double vb = equivalence_volume * (double)i / (double)num_points * 2.0;
        double total_vol = va + vb;
        if (total_vol == 0.0) {
            continue;
        }
        double ph = 0.0;
        int produced = 1;

        if (mode == TITRATE_MODE_STRONG_ACID_STRONG_BASE) {
            double moles_h = ca * va - ct * vb;
            if (moles_h > 0.0) {
                ph = -log10(moles_h / total_vol);
            } else if (moles_h < 0.0) {
                double moles_oh = -moles_h;
                double pOH = -log10(moles_oh / total_vol);
                ph = 14.0 - pOH;
            } else {
                ph = 7.0;
            }
        } else {
            /* Weak acid + strong base. */
            double fraction = ct * vb / (ca * va);
            if (fraction <= 0.001) {
                ph = 0.5 * (pKa - log10(ca));
            } else if (fraction >= 0.999 && fraction <= 1.001) {
                ph = 0.5 * (14.0 + pKa - log10(ca * va / total_vol));
            } else if (fraction > 1.001) {
                double excess_oh = (ct * vb - ca * va) / total_vol;
                double pOH = -log10(excess_oh);
                ph = 14.0 - pOH;
            } else {
                double moles_ha = ca * va - ct * vb;
                double moles_a = ct * vb;
                if (moles_ha <= 0.0 || moles_a <= 0.0) {
                    produced = 0;
                } else {
                    ph = pKa + log10(moles_a / moles_ha);
                }
            }
        }

        if (!produced) {
            continue;
        }
        ph = clamp_ph(ph);
        points[count].volume = vb;
        points[count].ph = ph;
        count++;
    }

    out->points = points;
    out->num_points = count;
    out->equivalence_volume = equivalence_volume;
    out->error = TITRATE_OK;
    return TITRATE_OK;
}

void titrate_result_free(titrate_result_t *result) {
    if (result == NULL) {
        return;
    }
    if (result->points != NULL) {
        free(result->points);
        result->points = NULL;
    }
    result->num_points = 0;
    result->equivalence_volume = 0.0;
    result->error = TITRATE_OK;
}

const char *titrate_strerror(int err) {
    switch (err) {
        case TITRATE_OK:
            return "success";
        case TITRATE_ERR_INVALID_CONCENTRATION:
            return "analyte concentration, analyte volume, and titrant concentration must be positive";
        case TITRATE_ERR_INVALID_NUM_POINTS:
            return "num_points must be greater than 0";
        case TITRATE_ERR_PKA_REQUIRED:
            return "pKa is required for weak-acid-strong-base mode";
        case TITRATE_ERR_OUT_OF_MEMORY:
            return "out of memory";
        case TITRATE_ERR_INVALID_MODE:
            return "invalid titration mode";
        default:
            return "unknown error";
    }
}
