"""Comprehensive test suite for the Python titrate module.

Uses only the Python standard library (unittest, math). Run with:
    python -m unittest test_titrate -v

Coverage:
  - Strong-acid-strong-base: equivalence volume, initial pH, equivalence pH,
    post-equivalence pH, monotonicity, sample count, high-concentration edge
  - Weak-acid-strong-base: initial pH (weak acid formula), half-equivalence
    (pH = pKa), buffer region (Henderson-Hasselbalch), equivalence pH > 7,
    post-equivalence pH, monotonicity
  - pH clamping to [0, 14]
  - Input validation: non-positive concentrations, zero num_points, missing
    pKa, invalid mode, NaN pKa
  - Numerical agreement with reference values at known sample points
"""

import math
import unittest

from titrate import (
    TitrationError,
    TitrationMode,
    TitrationPoint,
    TitrationResult,
    titrate_curve,
)


def _approx(a: float, b: float, tol: float = 1e-9) -> bool:
    return abs(a - b) <= tol


class TestStrongAcidStrongBase(unittest.TestCase):
    """Tests for the strong-acid + strong-base titration mode."""

    def test_equivalence_volume_is_ca_va_over_ct(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertTrue(_approx(result.equivalence_volume, 0.025))

    def test_initial_ph_is_acidic(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertEqual(len(result.points), 51)
        self.assertTrue(_approx(result.points[0].volume, 0.0))
        self.assertTrue(_approx(result.points[0].ph, 1.0))

    def test_equivalence_point_ph_is_7(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        found = False
        for pt in result.points:
            if _approx(pt.volume, 0.025):
                self.assertTrue(_approx(pt.ph, 7.0))
                found = True
                break
        self.assertTrue(found, "equivalence point must be in the curve")

    def test_post_equivalence_ph_is_basic(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertGreater(result.points[-1].ph, 7.0)

    def test_ph_is_monotonically_nondecreasing(self) -> None:
        result = titrate_curve(0.1, 0.05, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=100)
        for i in range(1, len(result.points)):
            self.assertGreaterEqual(result.points[i].ph, result.points[i - 1].ph - 1e-9)

    def test_num_points_is_num_points_plus_one(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertEqual(len(result.points), 51)

    def test_high_concentration_initial_ph_is_very_acidic(self) -> None:
        result = titrate_curve(1.0, 0.025, 1.0, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=10)
        self.assertTrue(_approx(result.points[0].ph, 0.0))

    def test_clamps_ph_to_valid_range(self) -> None:
        result = titrate_curve(0.001, 0.025, 10.0, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=10)
        for pt in result.points:
            self.assertGreaterEqual(pt.ph, 0.0 - 1e-9)
            self.assertLessEqual(pt.ph, 14.0 + 1e-9)

    def test_quarter_equivalence_ph_matches_reference(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=200)
        expected = -math.log10(0.06)
        found = False
        for pt in result.points:
            if _approx(pt.volume, 0.00625):
                self.assertTrue(_approx(pt.ph, expected, 1e-6))
                found = True
                break
        self.assertTrue(found, "quarter-equivalence point must be in the curve")

    def test_different_concentrations(self) -> None:
        result = titrate_curve(0.5, 0.02, 0.25, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertTrue(_approx(result.equivalence_volume, 0.04))
        self.assertTrue(_approx(result.points[0].ph, -math.log10(0.5)))

    def test_num_points_one_produces_two_samples(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=1)
        self.assertEqual(len(result.points), 2)


class TestWeakAcidStrongBase(unittest.TestCase):
    """Tests for the weak-acid + strong-base titration mode."""

    def test_equivalence_volume_matches_formula(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=50)
        self.assertTrue(_approx(result.equivalence_volume, 0.025))

    def test_initial_ph_uses_weak_acid_formula(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=50)
        expected = 0.5 * (4.75 - math.log10(0.1))
        self.assertTrue(_approx(result.points[0].ph, expected))

    def test_half_equivalence_ph_equals_pKa(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=100)
        found = False
        for pt in result.points:
            if _approx(pt.volume, 0.0125):
                self.assertTrue(_approx(pt.ph, 4.75))
                found = True
                break
        self.assertTrue(found, "half-equivalence point must be in the curve")

    def test_equivalence_ph_is_basic(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=50)
        found = False
        for pt in result.points:
            if _approx(pt.volume, 0.025):
                self.assertGreater(pt.ph, 7.0)
                found = True
                break
        self.assertTrue(found, "equivalence point must be in the curve")

    def test_post_equivalence_ph_is_high(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=50)
        self.assertGreater(result.points[-1].ph, 10.0)

    def test_ph_monotonically_nondecreasing(self) -> None:
        result = titrate_curve(0.1, 0.05, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=100)
        for i in range(1, len(result.points)):
            self.assertGreaterEqual(result.points[i].ph, result.points[i - 1].ph - 1e-9)

    def test_clamps_ph_to_valid_range(self) -> None:
        result = titrate_curve(10.0, 0.025, 10.0, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=0.0, num_points=50)
        for pt in result.points:
            self.assertGreaterEqual(pt.ph, 0.0 - 1e-9)
            self.assertLessEqual(pt.ph, 14.0 + 1e-9)

    def test_buffer_region_uses_henderson_hasselbalch(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=200)
        expected = 4.75 + math.log10(0.25 / 0.75)
        found = False
        for pt in result.points:
            if _approx(pt.volume, 0.00625):
                self.assertTrue(_approx(pt.ph, expected, 1e-6))
                found = True
                break
        self.assertTrue(found, "quarter-equivalence buffer point must be in the curve")

    def test_acetic_acid_pKa(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.76, num_points=50)
        expected = 0.5 * (4.76 + 1.0)
        self.assertTrue(_approx(result.points[0].ph, expected))


class TestInputValidation(unittest.TestCase):
    """Tests for input validation and error handling."""

    def test_rejects_zero_analyte_concentration(self) -> None:
        with self.assertRaises(TitrationError) as cm:
            titrate_curve(0.0, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertIn("analyte_concentration", str(cm.exception))

    def test_rejects_negative_analyte_concentration(self) -> None:
        with self.assertRaises(TitrationError):
            titrate_curve(-0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)

    def test_rejects_zero_analyte_volume(self) -> None:
        with self.assertRaises(TitrationError) as cm:
            titrate_curve(0.1, 0.0, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertIn("analyte_volume", str(cm.exception))

    def test_rejects_zero_titrant_concentration(self) -> None:
        with self.assertRaises(TitrationError) as cm:
            titrate_curve(0.1, 0.025, 0.0, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        self.assertIn("titrant_concentration", str(cm.exception))

    def test_rejects_zero_num_points(self) -> None:
        with self.assertRaises(TitrationError) as cm:
            titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=0)
        self.assertIn("num_points", str(cm.exception))

    def test_rejects_negative_num_points(self) -> None:
        with self.assertRaises(TitrationError):
            titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=-5)

    def test_rejects_missing_pKa_for_weak_acid_mode(self) -> None:
        with self.assertRaises(TitrationError) as cm:
            titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, num_points=50)
        self.assertIn("pKa", str(cm.exception))

    def test_rejects_nan_pKa_for_weak_acid_mode(self) -> None:
        with self.assertRaises(TitrationError):
            titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=float("nan"), num_points=50)

    def test_rejects_invalid_mode_value(self) -> None:
        with self.assertRaises(TitrationError):
            titrate_curve(0.1, 0.025, 0.1, mode=99, num_points=50)  # type: ignore[arg-type]

    def test_strong_strong_accepts_nan_pKa(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, pKa=float("nan"), num_points=10)
        self.assertEqual(len(result.points), 11)

    def test_strong_strong_accepts_none_pKa(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=10)
        self.assertEqual(len(result.points), 11)


class TestTitrationPoint(unittest.TestCase):
    """Tests for the TitrationPoint data class."""

    def test_repr(self) -> None:
        pt = TitrationPoint(0.025, 7.0)
        self.assertIn("0.025", repr(pt))
        self.assertIn("7.0", repr(pt))

    def test_equality(self) -> None:
        pt1 = TitrationPoint(0.025, 7.0)
        pt2 = TitrationPoint(0.025, 7.0)
        pt3 = TitrationPoint(0.025, 7.1)
        self.assertEqual(pt1, pt2)
        self.assertNotEqual(pt1, pt3)

    def test_inequality_with_non_point(self) -> None:
        pt = TitrationPoint(0.025, 7.0)
        self.assertNotEqual(pt, "not a point")
        self.assertNotEqual(pt, 42)


class TestTitrationResult(unittest.TestCase):
    """Tests for the TitrationResult data class."""

    def test_default_factory(self) -> None:
        result = TitrationResult()
        self.assertEqual(result.points, [])
        self.assertEqual(result.equivalence_volume, 0.0)

    def test_populated_result(self) -> None:
        points = [TitrationPoint(0.0, 1.0), TitrationPoint(0.025, 7.0)]
        result = TitrationResult(points=points, equivalence_volume=0.025)
        self.assertEqual(len(result.points), 2)
        self.assertEqual(result.equivalence_volume, 0.025)


class TestDefaultMode(unittest.TestCase):
    """Tests that the default mode is strong-acid-strong-base."""

    def test_default_mode_is_strong_strong(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, num_points=10)
        self.assertTrue(_approx(result.points[0].ph, 1.0))


class TestDefaultNumPoints(unittest.TestCase):
    """Tests that the default num_points is 50."""

    def test_default_num_points_is_50(self) -> None:
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE)
        self.assertEqual(len(result.points), 51)


class TestCrossImplementationAgreement(unittest.TestCase):
    """Tests that Python results match the Go/C reference values."""

    def test_strong_strong_matches_go_reference(self) -> None:
        """Reference values from internal/calculators/solution.go TitrationCurve."""
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.STRONG_ACID_STRONG_BASE, num_points=50)
        # eq_vol = 0.1 * 0.025 / 0.1 = 0.025 L
        self.assertTrue(_approx(result.equivalence_volume, 0.025))
        # First point: vb=0, [H+] = 0.1, pH = 1.0
        self.assertTrue(_approx(result.points[0].ph, 1.0))
        # At i=25: vb = 0.025, pH = 7.0
        self.assertTrue(_approx(result.points[25].volume, 0.025))
        self.assertTrue(_approx(result.points[25].ph, 7.0))
        # At i=50: vb = 0.05, excess OH- = (0.1*0.05 - 0.1*0.025) / 0.075 = 0.0333...
        # pOH = -log10(0.0333) = 1.477, pH = 14 - 1.477 = 12.523
        last = result.points[-1]
        expected_ph = 14.0 - (-math.log10((0.1 * 0.05 - 0.1 * 0.025) / (0.025 + 0.05)))
        self.assertTrue(_approx(last.ph, expected_ph, 1e-9))

    def test_weak_strong_matches_go_reference(self) -> None:
        """Reference values from internal/calculators/solution.go TitrationCurve."""
        result = titrate_curve(0.1, 0.025, 0.1, TitrationMode.WEAK_ACID_STRONG_BASE, pKa=4.75, num_points=50)
        # Initial pH = 0.5 * (4.75 - log10(0.1)) = 0.5 * 5.75 = 2.875
        self.assertTrue(_approx(result.points[0].ph, 2.875))
        # At equivalence (i=25): pH = 0.5 * (14 + 4.75 - log10(0.1*0.025/0.05))
        # = 0.5 * (18.75 - log10(0.05)) = 0.5 * (18.75 + 1.301) = 0.5 * 20.051 = 10.026
        eq_ph = result.points[25].ph
        expected = 0.5 * (14.0 + 4.75 - math.log10(0.1 * 0.025 / (0.025 + 0.025)))
        self.assertTrue(_approx(eq_ph, expected, 1e-9))
        self.assertGreater(eq_ph, 7.0)


if __name__ == "__main__":
    unittest.main()
