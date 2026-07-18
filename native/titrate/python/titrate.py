"""Titration curve calculator.

Computes pH vs titrant volume data points for two titration modes:
  - Strong acid + strong base
  - Weak acid + strong base (Henderson-Hasselbalch in the buffer region)

This module uses only the Python standard library (math, dataclasses,
enum, typing). It mirrors the algorithm in internal/calculators/solution.go
(TitrationCurve) so results are numerically compatible with the Go and C
reference implementations.

Example:
    from titrate import titrate_curve, TitrationMode
    result = titrate_curve(
        analyte_concentration=0.1,
        analyte_volume=0.025,
        titrant_concentration=0.1,
        mode=TitrationMode.STRONG_ACID_STRONG_BASE,
        num_points=50,
    )
    print(result.equivalence_volume)  # 0.025 L
    for point in result.points:
        print(f"  V={point.volume:.4f} L  pH={point.ph:.4f}")
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import IntEnum
from typing import List, Optional


class TitrationMode(IntEnum):
    """Titration mode selector."""

    STRONG_ACID_STRONG_BASE = 0
    WEAK_ACID_STRONG_BASE = 1


class TitrationError(Exception):
    """Raised when a titration calculation fails."""


class TitrationPoint:
    """A single point on the titration curve."""

    __slots__ = ("volume", "ph")

    def __init__(self, volume: float, ph: float) -> None:
        self.volume = volume
        self.ph = ph

    def __repr__(self) -> str:
        return "TitrationPoint(volume={!r}, ph={!r})".format(self.volume, self.ph)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TitrationPoint):
            return NotImplemented
        return self.volume == other.volume and self.ph == other.ph


@dataclass
class TitrationResult:
    """Result of a titration curve calculation."""

    points: List[TitrationPoint] = field(default_factory=list)
    equivalence_volume: float = 0.0


def _clamp_ph(ph: float) -> float:
    """Clamp pH to the valid [0, 14] range."""
    if ph < 0.0:
        return 0.0
    if ph > 14.0:
        return 14.0
    return ph


def titrate_curve(
    analyte_concentration: float,
    analyte_volume: float,
    titrant_concentration: float,
    mode: TitrationMode = TitrationMode.STRONG_ACID_STRONG_BASE,
    pKa: Optional[float] = None,
    num_points: int = 50,
) -> TitrationResult:
    """Compute the titration curve.

    Args:
        analyte_concentration: Molarity of the analyte (mol/L), must be > 0.
        analyte_volume: Initial volume of the analyte (L), must be > 0.
        titrant_concentration: Molarity of the titrant (mol/L), must be > 0.
        mode: Titration mode. Defaults to strong-acid-strong-base.
        pKa: Acid dissociation constant. Required for weak-acid mode;
            ignored for strong-acid mode.
        num_points: Number of intervals along the x-axis; the result
            contains num_points + 1 samples. Must be > 0.

    Returns:
        A TitrationResult containing the equivalence volume and curve points.

    Raises:
        TitrationError: If any input is invalid.
    """
    ca = float(analyte_concentration)
    va = float(analyte_volume)
    ct = float(titrant_concentration)
    n = int(num_points)

    if not (ca > 0.0):
        raise TitrationError("analyte_concentration must be positive")
    if not (va > 0.0):
        raise TitrationError("analyte_volume must be positive")
    if not (ct > 0.0):
        raise TitrationError("titrant_concentration must be positive")
    if n <= 0:
        raise TitrationError("num_points must be greater than 0")
    if not isinstance(mode, TitrationMode):
        raise TitrationError("invalid mode: {!r}".format(mode))
    if mode == TitrationMode.WEAK_ACID_STRONG_BASE:
        if pKa is None:
            raise TitrationError("pKa is required for weak-acid-strong-base mode")
        pka_val = float(pKa)
        if math.isnan(pka_val):
            raise TitrationError("pKa must not be NaN")
    else:
        pka_val = float("nan")

    equivalence_volume = ca * va / ct
    points: List[TitrationPoint] = []

    i = 0
    while i <= n:
        vb = equivalence_volume * float(i) / float(n) * 2.0
        total_vol = va + vb
        if total_vol == 0.0:
            i += 1
            continue
        ph: float
        produced = True

        if mode == TitrationMode.STRONG_ACID_STRONG_BASE:
            moles_h = ca * va - ct * vb
            if moles_h > 0.0:
                ph = -math.log10(moles_h / total_vol)
            elif moles_h < 0.0:
                moles_oh = -moles_h
                pOH = -math.log10(moles_oh / total_vol)
                ph = 14.0 - pOH
            else:
                ph = 7.0
        else:
            fraction = ct * vb / (ca * va)
            if fraction <= 0.001:
                ph = 0.5 * (pka_val - math.log10(ca))
            elif 0.999 <= fraction <= 1.001:
                ph = 0.5 * (14.0 + pka_val - math.log10(ca * va / total_vol))
            elif fraction > 1.001:
                excess_oh = (ct * vb - ca * va) / total_vol
                pOH = -math.log10(excess_oh)
                ph = 14.0 - pOH
            else:
                moles_ha = ca * va - ct * vb
                moles_a = ct * vb
                if moles_ha <= 0.0 or moles_a <= 0.0:
                    produced = False
                else:
                    ph = pka_val + math.log10(moles_a / moles_ha)

        if not produced:
            i += 1
            continue
        ph = _clamp_ph(ph)
        points.append(TitrationPoint(vb, ph))
        i += 1

    return TitrationResult(points=points, equivalence_volume=equivalence_volume)


__all__ = [
    "TitrationMode",
    "TitrationError",
    "TitrationPoint",
    "TitrationResult",
    "titrate_curve",
]
