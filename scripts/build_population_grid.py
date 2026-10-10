#!/usr/bin/env python3
"""
Aggregiert GHSL GHS-POP (30 arcsec, WGS84) zu public/popgrid/*.json.

Lizenz der Quelldaten: CC BY 4.0, European Commission JRC.
Download: https://ghsl.jrc.ec.europa.eu/download.php

Usage:
  python scripts/build_population_grid.py /path/to/GHS_POP.tif
  python scripts/build_population_grid.py /path/to/GHS_POP.tif --countries DE,FR,BR
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

try:
    import numpy as np
    import rasterio
    from shapely.geometry import Point, shape
    from shapely.strtree import STRtree
except ImportError as e:
    print("Install deps: pip install -r scripts/requirements-pop.txt", file=sys.stderr)
    raise SystemExit(1) from e


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "popgrid"
COUNTRIES_TOPO = ROOT / "public" / "countries-110m.json"


def load_countries():
    """Lädt Länder aus TopoJSON via topojson-Client wäre ideal; hier GeoJSON-Export erwarten wir optional.
    Fallback: countries-110m als TopoJSON — nutze einfache Feature-Liste wenn vorhanden als GeoJSON.
    """
    # Prefer a geojson sidecar if present; else instruct user.
    geo = ROOT / "public" / "countries-110m.geojson"
    if not geo.exists():
        print(
            "Hinweis: Bitte countries-110m.geojson bereitstellen oder TopoJSON vorher konvertieren.\n"
            "Minimal-Pfad: Features mit properties.iso_a2 / id und geometry.",
            file=sys.stderr,
        )
        # Try reading topojson loosely: not fully supported without topojson lib.
        raise SystemExit("countries-110m.geojson fehlt — bitte einmalig exportieren.")

    data = json.loads(geo.read_text(encoding="utf-8"))
    feats = []
    for f in data["features"]:
        geom = shape(f["geometry"])
        props = f.get("properties") or {}
        a2 = props.get("iso_a2") or props.get("ISO_A2") or props.get("a2")
        if not a2 or a2 == "-99":
            continue
        feats.append({"a2": a2.upper(), "geom": geom, "area": geom.area})
    return feats


def cell_size_for_area(area_deg2: float) -> float:
    # grobe Heuristik → Ziel ~3000 Punkte
    if area_deg2 > 80:
        return 0.25
    if area_deg2 > 8:
        return 0.1
    return 0.05


def assign_country(lon: float, lat: float, tree: STRtree, geoms: list, a2s: list) -> str | None:
    pt = Point(lon, lat)
    idx = tree.nearest(pt)
    geom = geoms[idx]
    if geom.contains(pt) or geom.intersects(pt.buffer(0.15)):
        return a2s[idx]
    # Küste: nächstes Land
    return a2s[idx]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("raster", type=Path, help="Pfad zum GHS-POP GeoTIFF")
    ap.add_argument("--countries", type=str, default="", help="Komma-getrennte ISO-A2 Liste")
    args = ap.parse_args()

    allow = {c.strip().upper() for c in args.countries.split(",") if c.strip()} or None
    feats = load_countries()
    if allow:
        feats = [f for f in feats if f["a2"] in allow]

    geoms = [f["geom"] for f in feats]
    a2s = [f["a2"] for f in feats]
    tree = STRtree(geoms)

    buckets: dict[str, list[list[float]]] = defaultdict(list)
    world: list[list[float]] = []
    totals: dict[str, float] = defaultdict(float)

    with rasterio.open(args.raster) as ds:
        # Grob: Fensterweise lesen wäre besser; hier vereinfachte Block-Aggregation
        data = ds.read(1, masked=True)
        transform = ds.transform
        h, w = data.shape
        # Downsample step ~0.25° at equator ≈ 30arcsec * 30
        step = max(1, int(round(0.25 / (abs(transform.a)))))
        for row in range(0, h, step):
            for col in range(0, w, step):
                block = data[row : row + step, col : col + step]
                pop = float(np.nansum(block))
                if pop < 1:
                    continue
                r = row + step / 2
                c = col + step / 2
                lon, lat = rasterio.transform.xy(transform, r, c)
                a2 = assign_country(lon, lat, tree, geoms, a2s)
                if not a2:
                    continue
                if allow and a2 not in allow:
                    continue
                buckets[a2].append([round(lon, 4), round(lat, 4), int(round(pop))])
                totals[a2] += pop
                # world 0.5°
                wlon = round(lon * 2) / 2
                wlat = round(lat * 2) / 2
                world.append([wlon, wlat, int(round(pop))])

    OUT.mkdir(parents=True, exist_ok=True)

    # world: aggregate duplicates
    wmap: dict[tuple[float, float], float] = defaultdict(float)
    for lon, lat, pop in world:
        wmap[(lon, lat)] += pop
    world_out = [[lon, lat, int(round(pop))] for (lon, lat), pop in wmap.items() if pop >= 1]
    (OUT / "world.json").write_text(json.dumps(world_out), encoding="utf-8")

    index = {a2: int(round(v)) for a2, v in sorted(totals.items())}
    (OUT / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")

    for a2, pts in buckets.items():
        # optional decimate to ~3000
        if len(pts) > 3000:
            stride = math.ceil(len(pts) / 3000)
            pts = pts[::stride]
        (OUT / f"{a2}.json").write_text(json.dumps(pts), encoding="utf-8")

    print(f"Wrote {len(buckets)} country grids + world + index → {OUT}")


if __name__ == "__main__":
    main()
