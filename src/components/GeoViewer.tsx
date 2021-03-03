import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, MeshProps, GeometryNode, useUpdate, extend, useThree, Object3DNode } from 'react-three-fiber'
import { BufferGeometry, Mesh, PlaneGeometry, AxesHelper, LineBasicMaterial, Geometry, AdditiveBlending, Vector3, Color, PlaneBufferGeometry } from 'three';
import { useWorker } from 'react-hooks-worker';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AnyPtrRecord } from 'dns';
import * as d3 from 'd3';

const createWorker = () => new Worker('../workers/terrain.worker', { type: 'module' });

extend({ OrbitControls })
declare global {
    namespace JSX {
        interface IntrinsicElements {
            orbitControls: Object3DNode<OrbitControls, typeof OrbitControls>
        }
    }
}
interface OrbitRef {
    obj: {
        update: Function;
    };
}

const Box: React.FunctionComponent<MeshProps> = ({ position }) => {
    // This reference will give us direct access to the mesh
    const mesh = useRef<Mesh>();

    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)

    // Rotate mesh every frame, this is outside of React without overhead
    useFrame(() => {
        mesh.current!.rotation.x = mesh.current!.rotation.y += 0.01

    })

    return (
        <mesh
            position={position}
            ref={mesh}
            scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
            onClick={(event) => setActive(!active)}
            onPointerOver={(event) => setHover(true)}
            onPointerOut={(event) => setHover(false)}>
            <boxBufferGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
        </mesh>
    )
}

const ContourRing: FunctionComponent<{ points: number[][], height: number, color: string }> = ({ points, height, color }) => {

    const mesh = useUpdate<Mesh<Geometry>>(({ geometry }) => {
        const mappedPoints: [number, number, number][] = points.map(([x, y]) => [y - 0.5, x - 0.5, height])
        mappedPoints.forEach(point => {
            geometry.vertices.push(new Vector3(...point));
        });

        // const material = new THREE.LineBasicMaterial({color: color, blending: THREE.AdditiveBlending});
        // const geometry = new THREE.Geometry();
    }, []);

    return <mesh ref={mesh} visible>
        <lineBasicMaterial color={color} blending={AdditiveBlending} />
        {/* <meshPhongMaterial
            attach="material"
            color={"#333333"}
            shininess={3}
            flatShading
        /> */}
        {/* <planeBufferGeometry attach="geometry" args={[0, 0]} /> */}
        <planeGeometry attach="geometry" args={[1, 1, 1]} />
    </mesh>

}

const ContourLevel: FunctionComponent<{ polygon: d3.ContourMultiPolygon, colorGenerator: (value: number) => string }> = ({ polygon, colorGenerator }) => {
    return <group>
        {polygon.coordinates.map(rings => rings.map(ring => <ContourRing points={ring} height={polygon.value} color={colorGenerator(polygon.value)} />))}
    </group>
}

const Terrain: FunctionComponent<{ result: [any, { width: number, height: number }, d3.ContourMultiPolygon[], [number, number]] }> = ({ result }) => {
    const [data, image, contours, range] = result;

    // const mesh = useUpdate<Mesh>(({ geometry }) => {
    //     if (!result) return;

    //     let pos = (geometry as PlaneBufferGeometry).getAttribute("position");
    //     for (var i = 0; i < (geometry as PlaneBufferGeometry).attributes.position.count; i++) {
    //         (geometry as PlaneBufferGeometry).attributes.position.setZ(i, data[i] * 0.05);
    //     }
    // }, []);


    // return <mesh visible ref={mesh} scale={[0.005, 0.005, 0.005]}>
    //     <planeBufferGeometry attach="geometry" args={[image.width, image.height, image.width - 1, image.height - 1]} />
    //     {/* <meshPhongMaterial
    //         attach="material"
    //         color={"hotpink"}
    //         shininess={3}
    //         flatShading
    //     /> */}
    //     <meshPhongMaterial
    //         attach="material"
    //         color={"#333333"}
    //         shininess={3}
    //         flatShading
    //     /></mesh>

    return <group>
        {contours.map(polygon => <ContourLevel polygon={polygon} colorGenerator={d => d3.interpolateViridis((d - range[0]) / (range[1] - range[0]))} />)}
    </group>
}

const Scene: FunctionComponent<{ result: [any, { width: number, height: number }, any, any] }> = ({ result }) => {
    const ref = useRef<OrbitRef>(null);
    const {
        camera,
        gl: { domElement }
    } = useThree()

    useFrame(() => {
        if (ref && ref.current && ref.current.obj) {
            ref.current.obj.update();
        }
    });



    return (
        <>
            <ambientLight />
            <pointLight position={[20, 20, 10]} />
            <primitive object={new AxesHelper(10)} />
            <Terrain result={result} />
            <orbitControls
                ref={ref} args={[camera, domElement]} />
        </>
    )
}

export default () => {
    const { result, error }: { result: any, error: any } = useWorker(createWorker, null) as any;


    return <Canvas pixelRatio={window.devicePixelRatio} style={{ width: '100vw', height: '100vh' }}>
        {result && <Scene result={result} />}
    </Canvas>
};