# Skjálftasjá

Skoðaðu skjálftana á Reykjanesskaga í þrívídd!
Þrívíð staðsetning skjálfta er fengin frá Veðurstofunni og hæðagögn eru fengin frá landmælingum íslands.

<img width="737" alt="image" src="https://user-images.githubusercontent.com/3050355/110341748-97dcb780-8022-11eb-8d3a-37ebaecb434e.png">

## Upplýsingar

Þetta er algjört spagettíflippverkefni sem var unnið á nokkrum klukkustundum með React og Three.js.

Svona er verkefnið keyrt upp:

```
yarn
yarn start
```

Grunngögn fyrir hæðakort eru fengin frá landmælingum á GeoTIFF formatti.
Gögnin eru sköluð niður úr 25000x25000 í 2500x2500 með eftirfarandi skipun:

```
gdalwarp -ts 2500 2500 data/elevation_2.tif data/elevation_2.small.tif
```

