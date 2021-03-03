import React from 'react';
import logo from './logo.svg';
import './App.css';
import GeoViewer from './components/GeoViewer';
import Heightmap from './components/Heightmap';
import { useWorker } from 'react-hooks-worker';

const terrainWorker = () =>
  new Worker('./workers/terrain.worker', { type: 'module' });

function App() {
  const { result, error }: { result: any; error: any } = useWorker(
    terrainWorker,
    null,
  ) as any;

  return (
    <div className="App">
      {/* <GeoViewer /> */}
      {!result && <progress />}
      {result && <Heightmap result={result} />}
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
