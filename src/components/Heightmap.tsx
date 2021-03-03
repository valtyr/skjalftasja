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

    console.log(cf);

    const [newShape, projection] = squareProjection(shape);

    // const ctop = (lat: number, lon: number) => {
    //   const widthPct = (lon - cf.bbox[0]) / cf.bboxWidth;
    //   const heightPct = (lat - cf.bbox[3]) / cf.bboxHeight;
    //   const xPx = Math.floor(cf.pixelWidth * widthPct);
    //   const yPx = Math.floor(cf.pixelHeight * (1 - heightPct));

    //   const [x, y] = projection([xPx, yPx]);

    //   return [x - newShape.width / 2, y - newShape.height / 2];
    // };

    const ctop = (lat: number, lon: number) => {
      const [xmin, ymin, xmax, ymax] = cf.bbox;
      const x0 = ((lon - xmin) / (xmax - xmin)) * shape.width;
      const y0 = (1 - (lat - ymin) / (ymax - ymin)) * shape.height;

      const [x, y] = projection([x0, y0]);
      return [x - newShape.width / 2, y - newShape.height / 2];
    };

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    var renderer = new THREE.WebGLRenderer();
    const controls = new OrbitControls(camera, renderer.domElement);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    this.mount.current!.appendChild(renderer.domElement);

    const heightScale = (d: number) =>
      (30 * (d - range[0])) / (range[1] - range[0]);
    const color = (d: number) =>
      d3.interpolateViridis((d - range[0]) / (range[1] - range[0]));

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
              return [y, x, heightScale(polygon.value)];
            });
            lines.push(lineString(points3, lineColor));
          });
        });
      });
      return lines;
    })();

    scene.background = new THREE.Color('black');
    const group = new THREE.Group();

    const coords = ctop(64.142308, -21.938487);

    const sphereGroup = new THREE.Group();
    const sphereGeom = new THREE.SphereGeometry(100, 32, 32);
    const sphereMaterial = new THREE.MeshNormalMaterial();
    const sphere = new THREE.Mesh(sphereGeom, sphereMaterial);
    sphere.position.set(coords[1], coords[0], 0);
    sphereGroup.add(sphere);

    group.add(sphereGroup);

    const size = newShape.width;
    const divisions = Math.floor(newShape.width / 10);

    const gridHelper = new THREE.GridHelper(size, divisions);
    const axesHelper = new THREE.AxesHelper(100);
    gridHelper.rotateZ(-Math.PI / 2);
    // gridHelper.rotateY(-Math.PI / 2);
    gridHelper.rotateX(-Math.PI / 2);
    group.add(gridHelper);
    group.add(axesHelper);

    group.scale.set(0.005, 0.005, 0.005);
    group.rotateZ(-Math.PI / 2);
    group.rotateY(-Math.PI / 2);

    controls.enableDamping = true;
    controls.dampingFactor = 0.3;

    // group.translateZ(-100);
    // group.translateY(-4);
    // group.translateX(-3);

    contourLineStrings.forEach((l) => group.add(l));
    scene.add(group);

    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    const light = new THREE.PointLight(0xff0000, 1, 100);
    light.position.set(50, 50, 50);
    scene.add(light);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshNormalMaterial();
    var cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    camera.position.z = 5;
    const animate = () => {
      if (this.running) requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    };
    animate();

    this.disposables.push(
      camera,
      cube,
      material,
      geometry,
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
