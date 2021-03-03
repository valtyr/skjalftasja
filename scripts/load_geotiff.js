const fs = require('fs');
const GeoTIFF = require('geotiff');


const getData = async (filename = './data/elevation_1.tif') => {
    const file = fs.readFileSync('./data/elevation_1.tif');
    const tiff = await GeoTIFF.fromFile(file);
    return tiff;
}
