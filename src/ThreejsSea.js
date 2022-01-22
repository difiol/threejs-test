import React, { Suspense, useRef } from "react";

import * as THREE from "three"
import {Canvas, extend, useFrame} from '@react-three/fiber'
import { shaderMaterial, OrbitControls } from '@react-three/drei'
import { Controls, useControl, withControls } from 'react-three-gui';
import glsl from "babel-plugin-glsl/macro"

/***
 * SEA PARAMETERS
 */
const parameters = {
    BigWavesElevation: 0.2,
    BigWavesFrequencyX: 1.2,
    BigWavesFrequencyY: 1.5,
    BigWavesSpeed: 0.5,
    
    SmallWavesElevation: 0.1,
    SmallWavesFrequency: 3,
    SmallWavesSpeed: 0.3,
    SmallWavesIterations: 4.0,
    
    DepthColor: '#186691',
    SurfaceColor: '#9bd8ff',
    ColorOffset: 0.25,
    ColorMultiplier: 3,
}

/**
 * SHADERS
 */
const WaterShaderMaterial = shaderMaterial(
    //Uniforms
    {
        uBigWavesElevation: parameters.BigWavesElevation,
        uBigWavesFrequency: new THREE.Vector2(parameters.BigWavesFrequencyX, parameters.BigWavesFrequencyX),
        uBigWavesSpeed: parameters.BigWavesSpeed,

        uSmallWavesElevation: parameters.SmallWavesElevation,
        uSmallWavesFrequency: parameters.SmallWavesFrequency,
        uSmallWavesSpeed: parameters.SmallWavesSpeed,
        uSmallWavesIterations: parameters.SmallWavesIterations,

        uDepthColor: new THREE.Color(parameters.DepthColor),
        uSurfaceColor: new THREE.Color(parameters.SurfaceColor),
        uColorOffset: parameters.ColorOffset,
        uColorMultiplier: parameters.ColorMultiplier,

        uTime: 0,
    },
    //VertexShader
    glsl`
        precision mediump float;

        uniform float uBigWavesElevation;  //How tall the waves get
        uniform vec2 uBigWavesFrequency;  //Frequency of the waves in the x and z axis
        uniform float uBigWavesSpeed;
        uniform float uTime;

        uniform float uSmallWavesElevation;
        uniform float uSmallWavesFrequency;
        uniform float uSmallWavesSpeed;
        uniform float uSmallWavesIterations;

        varying vec2 vUv;
        varying float vElevation;

        //	Classic Perlin 3D Noise 
        //	by Stefan Gustavson
        //
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

        float cnoise(vec3 P){
        vec3 Pi0 = floor(P); // Integer part for indexing
        vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
        }

        void main(){
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            //The elevation will determine the color
            float elevation = sin(modelPosition.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) 
                            * sin(modelPosition.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) 
                            * uBigWavesElevation;
            
            //Add more Perlin Noises with different frequency
            for(float i = 1.0; i <= uSmallWavesIterations; i++){
                elevation -= abs(cnoise(vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);  //Add 3D Perlin Noise

            }

            modelPosition.y += elevation;

            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;

            gl_Position = projectedPosition;

            vUv = uv;
            vElevation = elevation;
        }
    `,
    //Fragment Shader
    glsl`
        precision mediump float;
        uniform vec3 uDepthColor;
        uniform vec3 uSurfaceColor;
        uniform float uColorOffset;
        uniform float uColorMultiplier;

        uniform float uTime;

        varying vec2 vUv;
        varying float vElevation;
        
        void main(){
            float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
            vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);

            gl_FragColor = vec4(color, 1.0);
        }
    `
);

extend({ WaterShaderMaterial });  //Allows to use the Water Shader Material created as a Component

/**
 * ANIMATIONS
 */

//To animate using the useFrame have to be in a different function than the Scene
const Water = () => {

    //The clock starts when the scen has been rendered
    const ref = useRef();
    useFrame(({clock}) => (ref.current.uTime = clock.getElapsedTime()));  //Sets the uTime with the elapsed time value

    return(
        <mesh rotation={[-45, 0, 45]}>
            <planeBufferGeometry args={[20, 20, 512, 512]} />
            <waterShaderMaterial 
            uBigWavesElevation={parameters.BigWavesElevation}
            uBigWavesFrequency={new THREE.Vector2(parameters.BigWavesFrequencyX, parameters.BigWavesFrequencyY)}
            uBigWavesSpeed={parameters.BigWavesSpeed}
            uSmallWavesElevation={parameters.SmallWavesElevation}
            uSmallWavesFrequency={parameters.SmallWavesFrequency}
            uSmallWavesIterations={parameters.SmallWavesIterations}
            uSmallWavesSpeed={parameters.SmallWavesSpeed}
            uColorOffset={parameters.ColorOffset}
            uColorMultiplier={parameters.ColorMultiplier}
            uDepthColor={parameters.DepthColor}
            uSurfaceColor={parameters.SurfaceColor}
            ref={ref}
            />
        </mesh>
    );
};

/**
 * GUI
 */
function WaterGui() {
    //BIG WAVES
    parameters.BigWavesElevation = useControl('Elevation', { type: 'number', spring: false, min: 0.1, max: 1.0, value: parameters.BigWavesElevation, group: "Big Waves"});
    parameters.BigWavesFrequencyX = useControl('Frequency X', { type: 'number', spring: false, min: 1, max: 5, value: parameters.BigWavesFrequencyX, group: "Big Waves"});
    parameters.BigWavesFrequencyY = useControl('Frequency Y', { type: 'number', spring: false, min: 1, max: 5, value: parameters.BigWavesFrequencyY, group: "Big Waves"});
    parameters.BigWavesSpeed = useControl('Speed', { type: 'number', spring: false, min: 0.1, max: 5.0, value: parameters.BigWavesSpeed, group: "Big Waves" });
    //SMALL WAVES
    parameters.SmallWavesElevation = useControl('Elevation', { type: 'number', spring: false, min: 0.05, max: 0.5, value: parameters.SmallWavesElevation, group: "Small Waves"});
    parameters.SmallWavesFrequency = useControl('Frequency', { type: 'number', spring: false, min: 1, max: 5, value: parameters.SmallWavesFrequency, group: "Small Waves"});
    parameters.SmallWavesSpeed = useControl('Speed', { type: 'number', spring: false, min: 0.05, max: 1, value: parameters.SmallWavesSpeed, group: "Small Waves"});
    parameters.SmallWavesIterations = useControl('Iterations', { type: 'number', spring: false, min: 1, max: 10, value: parameters.SmallWavesIterations, group: "Small Waves"});
    //COLOR
    parameters.ColorOffset = useControl('Offset', { type: 'number', spring: false, min: 0, max: 1, value: parameters.ColorOffset, group: "Color"});
    parameters.ColorMultiplier = useControl('Multiplier', { type: 'number', spring: false, min: 0.1, max: 5, value: parameters.ColorMultiplier, group: "Color"});
    parameters.DepthColor = useControl("Depth Color", { type: 'color', spring: false, value: parameters.DepthColor, group: "Color"});
    parameters.SurfaceColor = useControl("Surface Color", { type: 'color', spring: false, value: parameters.SurfaceColor, group: "Color"});

   return(
       <Water />
   );
  }

/**
 * SCENE
 */
const MiCanvas = withControls(Canvas)
const Scene = () => {
    return (
    <div style={{ width: "100vw", height: "100vh" }}>
        
        <MiCanvas camera={{ fov: 8, position: [0, 0, 15] }}>
            <color attach="background" args={"darkblue"} />
            <Suspense fallback={null}>
                <WaterGui/>
            </Suspense>
            <OrbitControls
            maxAzimuthAngle={Math.PI / 8}
            maxPolarAngle={7.5 * Math.PI / 12}
            minAzimuthAngle={-Math.PI / 8}
            minPolarAngle={-Math.PI / 2}
            minDistance={5}
            maxDistance={20}
            />
        </MiCanvas>
    </div>
    )
}

const ThreejsSea = () => {
    return(
        <Controls.Provider>
            <Scene/>
            {/* <Controls/> */}
        </Controls.Provider>
    )
}

export default ThreejsSea