import React, { Component } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export type WorkerResult = [
  any,
  { width: number; height: number },
  d3.ContourMultiPolygon[],
  [number, number],
  {
    bbox: number[];
    pixelWidth: number;
    pixelHeight: number;
    bboxWidth: number;
    bboxHeight: number;
  },
];

function lineString(points: number[][], color: string) {
  const material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 10,
    blending: THREE.AdditiveBlending,
  });
  const geometry = new THREE.Geometry();
  points.forEach((p) => {
    geometry.vertices.push(new THREE.Vector3(...p));
  });

  return new THREE.Line(geometry, material);
}

const squareProjection: (shape: {
  width: number;
  height: number;
}) => [
  { width: number; height: number },
  ([x, y]: [number, number]) => [number, number],
] = ({ width, height }: { width: number; height: number }) => {
  const ratio = height / width;

  return [
    { width: height, height },
    ([x, y]: [number, number]) => [x * ratio - height / 2, y - height / 2],
  ];
};

class Heightmap extends Component<{
  result: WorkerResult;
}> {
  mount = React.createRef<HTMLDivElement>();
  disposables: any[] = [];
  running = true;

  componentDidMount() {
    const { result } = this.props;
    const [data, shape, polygons, range, cf] = result;
    const [newShape, projection] = squareProjection(shape);

    // Create scene
    var scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    // Create camera
    var camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    // Create renderer
    var renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.current!.appendChild(renderer.domElement);

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.3;

    // Create functions used for contour plotting
    const heightScale = (d: number) =>
      (30 * (d - range[0])) / (range[1] - range[0]);
    const color = (d: number) =>
      d3.interpolateViridis((d - range[0]) / (range[1] - range[0]));

    // Create line strings
    const contourLineStrings = (() => {
      const lines: THREE.Line<THREE.Geometry, THREE.LineBasicMaterial>[] = [];
      polygons.forEach((polygon) => {
        // Set color based on elevation
        const lineColor = color(polygon.value);
        // 2D to 3D: be carefull about right-handed / lef-handed system
        polygon.coordinates.forEach((rings) => {
          rings.forEach((points) => {
            const points3 = points.map((coords) => {
              const [x, y] = projection([coords[0], coords[1]]);
              return [x, y, heightScale(polygon.value)];
            });
            lines.push(lineString(points3, lineColor));
          });
        });
      });
      return lines;
    })();

    const group = new THREE.Group();
    contourLineStrings.forEach((l) => group.add(l));

    const axesHelper = new THREE.AxesHelper(100);

    group.scale.set(0.005, 0.005, 0.005);

    scene.add(group);
    scene.add(axesHelper);

    const light = new THREE.PointLight(0xff0000, 1, 100);
    light.position.set(50, 50, 50);
    scene.add(light);

    const animate = () => {
      if (this.running) requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    };
    animate();

    this.disposables.push(
      camera,
      light,
      scene,
      ...contourLineStrings,
      group,
      controls,
      renderer,
    );
  }

  componentWillUnmount() {
    this.running = false;
    this.disposables.forEach((d) => d.dispose && d.dispose());
  }

  render() {
    return <div className="canvas" ref={this.mount} />;
  }
}

export default Heightmap;
