import * as GeoTIFF from 'geotiff';
import * as THREE from 'three';
import * as d3 from 'd3';

// import { exposeWorker } from 'react-hooks-worker';

const terrain = async () => {
    const rawTiff = await GeoTIFF.fromUrl('/merged.small.wgs84.tif');
    const tifImage = await rawTiff.getImage();
    const shape = {
        width: tifImage.getWidth(),
        height: tifImage.getHeight()
    };
    const data = await tifImage.readRasters({ interleave: true });

    const interval = 10;
    const elevRange = d3.extent(data);
    const thresh = d3.range(Math.round(elevRange[0] / interval) * interval, elevRange[1], interval)
    const contours = d3.contours()
        .size([shape.width, shape.height])
        .thresholds(thresh)(data);

    const bbox = tifImage.getBoundingBox();
    const pixelWidth = tifImage.getWidth();
    const pixelHeight = tifImage.getHeight();
    const bboxWidth = bbox[ 2 ] - bbox[ 0 ];
    const bboxHeight = bbox[ 3 ] - bbox[ 1 ];

    const coordinateFactors = {bbox, pixelWidth, pixelHeight, bboxWidth, bboxHeight};

    // const coordinates = (lat, lon) => {
    //     const widthPct = ( lon - bbox[ 0 ] ) / bboxWidth;
    //     const heightPct = ( lat - bbox[ 1 ] ) / bboxHeight;
    //     const xPx = Math.floor( pixelWidth * widthPct );
    //     const yPx = Math.floor( pixelHeight * ( 1 - heightPct ) );

    //     return [xPx, yPx];
    // }
    

    return [data, shape, contours, elevRange, coordinateFactors];
};

/* eslint-disable-next-line no-restricted-globals */
self.onmessage = async () => {
    const data = await terrain();
    /* eslint-disable-next-line no-restricted-globals */
    self.postMessage(data);
}

// exposeWorker(terrain);
