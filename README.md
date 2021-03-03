# Skjálftasjá

Grunngögn fyrir hæðakort eru fengin frá landmælingum á GeoTIFF formatti.
Gögnin eru sköluð niður úr 25000x25000 í 2500x2500 með eftirfarandi skipun:

```
gdalwarp -ts 2500 2500 data/elevation_2.tif data/elevation_2.small.tif
```

