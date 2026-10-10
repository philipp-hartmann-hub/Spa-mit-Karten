# Bevölkerungsraster (GHSL)

Die JSON-Dateien in diesem Ordner werden aus dem **GHSL GHS-POP**-Raster erzeugt
(aktuellstes Epoch, 30 Arcsec, WGS84).

## Download

Produktseite / Daten: [GHSL – Global Human Settlement Layer](https://ghsl.jrc.ec.europa.eu/download.php)
(GHS-POP, 30 arc-seconds, WGS84).

## Lizenz

**CC BY 4.0** — Attribution: **European Commission, Joint Research Centre (JRC)**.

In der App: „Bevölkerung: GHSL, European Commission JRC (CC BY 4.0)“.

## Build

```bash
python scripts/build_population_grid.py /pfad/zu/GHS_POP_….tif
# optional: --countries DE,FR,IT
```

Benötigt: `rasterio`, `numpy`, `shapely` (siehe `scripts/requirements-pop.txt`).

Ausgaben:

- `{iso_a2}.json` — `[lon, lat, pop]` je Land
- `world.json` — 0.5°-Weltgrid
- `index.json` — Gesamtbevölkerung je ISO-A2
