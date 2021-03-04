import React, { RefObject, useCallback, useRef } from 'react';
import './App.css';
import Heightmap, { Quake } from './components/Heightmap';
import { useWorker } from 'react-hooks-worker';
import getQuakes from './helpers/quakes';

const terrainWorker = () =>
  new Worker('./workers/terrain.worker', { type: 'module' });


function App() {
  const { result, error }: { result: any; error: any } = useWorker(
    terrainWorker,
    null,
  ) as any;

  // const {loading, data, error: quakeError} = useQuakes();

  const heightmap: RefObject<Heightmap> = useRef(null);
  const onLoad = useCallback(async () => {
    const quakes = await getQuakes();
    console.log(quakes);
    
    if(heightmap.current)
      heightmap.current.drawQuakes(quakes);

  }, [])

  return (
    <div className="App">
      {/* <GeoViewer /> */}
      {!result && <progress />}
      {result && <Heightmap ref={heightmap} onLoad={onLoad} result={result} scaleFactor={5} />}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontFamily: 'monospace',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Reykjanesskaginn
        </div>
        <div style={{ fontFamily: 'monospace', color: 'white', fontSize: 12 }}>
          Hæðagögn frá Landmælingum Íslands
        </div>
      </div>
    </div>
  );
}

export default App;
