import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'

import { vertexShader } from "./shader/vertex";
import { fragmentShader } from "./shader/fragment";
import { Vector2 } from "three";

import Stats from 'stats.js';

export default function ThreejsGalaxyAnimated(props) {
  const revealText = props.revealText;

  /*
   *** SETUP ***
   */
  const scene = new THREE.Scene();

  //const gui = new dat.GUI();
  const galaxyCanvas = useRef(null);
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const parameters = {}; //Parameters for the Galaxy
  parameters.count = 1000000;
  parameters.size = 100.0;
  parameters.radius = 11;
  parameters.branches = 8;
  parameters.spin = -0.2; //Branch bending
  parameters.randomness = 2; //Particles spreading
  parameters.randomnessPower = 3.5; //To make the spreading exponential
  parameters.insideColor = "#ff6030"; //Color for the closer particles
  parameters.outsideColor = "#1b3984"; //Color for the more spreaded particles

  let geometry = null;
  let material = null;
  let points = null;

  /***
   * 	*** FOG ***
   */
  const fogColor = new THREE.Color("black");
  scene.background = fogColor;
  scene.fog = new THREE.Fog(fogColor, 2, 30);

  useEffect(() => {
    const canvas = galaxyCanvas.current;

    /*
     *** GALAXY ***
     */
    const positions = new Float32Array(parameters.count * 3); //3 values for each vertex
    const colors = new Float32Array(parameters.count * 3); //3 values for each vertex
    const scales = new Float32Array(parameters.count * 1); //1 value for each point
    const randomness = new Float32Array(parameters.count * 3); //3 values for each point

    /* Function Generator of the Galaxy */
    const generateGalaxy = () => {
      console.log("Generating Galaxy...");
      //If there is any galaxy already created we clear it
      if (points !== null) {
        geometry.dispose(); //Free the memory of the geometry
        material.dispose();
        scene.remove(points); //It is a relation between geometry and material, just remove it from the scene
      }

      geometry = new THREE.BufferGeometry();

      //Color classes
      const colorInside = new THREE.Color(parameters.insideColor);
      const colorOutside = new THREE.Color(parameters.outsideColor);

      for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;
        //POSITION
        const radius = Math.random() * parameters.radius;
        const spinAngle = radius * parameters.spin;
        const branchAngle =
          ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

        const randomX =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness;
        const randomY =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness;
        const randomZ =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness;

        randomness[i3 + 0] = randomX;
        randomness[i3 + 1] = randomY;
        randomness[i3 + 2] = randomZ;

        positions[i3 + 0] = Math.sin(branchAngle + spinAngle) * radius;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.cos(branchAngle + spinAngle) * radius;

        //COLOR
        const mixedColor = colorInside.clone(); //Create a new color from color inside and lerp (fusion) it with out side color
        mixedColor.lerp(colorOutside, (radius / parameters.radius) * 1.2); //Mix it with the outside color depending on how far the particle is
        colors[i3 + 0] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        //SCALE
        scales[i] = Math.random();
      }
      //Geometry
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
      geometry.setAttribute(
        "aRandomness",
        new THREE.BufferAttribute(randomness, 3)
      );

      //Material
      material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        fog: true,
        uniforms: {
          uSize: { value: parameters.size * renderer.getPixelRatio() }, //Get the pixel ratio to fix it
          uTime: { value: 0 },

          fogColor: { value: scene.fog.color },
          fogNear: { value: scene.fog.near },
          fogFar: { value: scene.fog.far },
        },
        vertexShader,
        fragmentShader,
      });

      //Points
      points = new THREE.Points(geometry, material);
      scene.add(points);
      //renderer.render(scene, camera);
    };

    /*
     *** CAMERA ***
     */
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
    camera.add(new THREE.PointLight(0xffffff));
    //const controls = new OrbitControls(camera, canvas);
    camera.position.y = 50;
    camera.position.z = -1;
    camera.lookAt(scene.position);
    camera.far = scene.fog.near;
    //controls.update();
    scene.add(camera);

    /*
     *** RENDERER ***
     */
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height); //Resize the renderer

    //Resize Renderer if the window's size is changed
    window.addEventListener("resize", () => {
      //Update sizes
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      //Update camera aspect ratio
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      //Update renderer
      renderer.setSize(sizes.width, sizes.height);

      //Update composer
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      composer.setSize(sizes.width, sizes.height)
    });

    generateGalaxy(); //Calls the function to generate the galaxy

    /***
     *** POSTPROCESSING ***
     */
    //Render Target
     const renderTarget = new THREE.WebGLRenderTarget(
      800,
      600,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.sRGBEncoding  //Really important to avoid the color get darker after applying many Passes
      }
    )

    const composer = new EffectComposer(renderer, renderTarget);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(sizes.width, sizes.height);

    const renderPass = new RenderPass(scene, camera);  //Similar to the renderer
    composer.addPass(renderPass);  //Add the Render Pass to the Effect Composer

    const unrealBloomPass = new UnrealBloomPass();
    unrealBloomPass.resolution = new Vector2(sizes.width, sizes.height);
    unrealBloomPass.strength = 1.5;  //Strength of the glow
    unrealBloomPass.radius = 0.4;  //Length of brightness spread
    unrealBloomPass.threshold = 0.90;  //At what luminosity the glow starts
    composer.addPass(unrealBloomPass);

    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms.amount.value = 0.0;
    composer.addPass(rgbShiftPass);

    

    /*** Add tweaks to GUI ***/
    // gui
    //   .add(parameters, "count")
    //   .min(100)
    //   .max(1000000)
    //   .step(100)
    //   .onFinishChange(generateGalaxy);
    // gui
    //   .add(material.uniforms.uSize, "value")
    //   .min(10)
    //   .max(50)
    //   .step(0.5)
    //   .name("size");
    // gui
    //   .add(parameters, "radius")
    //   .min(0.01)
    //   .max(20)
    //   .step(0.01)
    //   .onFinishChange(generateGalaxy);
    // gui
    //   .add(parameters, "branches")
    //   .min(2)
    //   .max(20)
    //   .step(1)
    //   .onFinishChange(generateGalaxy);
    // gui
    //   .add(parameters, "spin")
    //   .min(-5)
    //   .max(5)
    //   .step(0.001)
    //   .onFinishChange(generateGalaxy);
    // gui
    //   .add(parameters, "randomness")
    //   .min(0)
    //   .max(2)
    //   .step(0.001)
    //   .onFinishChange(generateGalaxy);
    // gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
    // gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

    /***
     * MOUSE INTERACTION
     */
    let mouseX = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event) => {
      //Cuando se mueva el raton se cambia el valor de mouseX y mouseY
      mouseX = event.clientX - windowHalfX;
    };

    document.addEventListener("mousemove", onDocumentMouseMove);

    /***
     *  MONITORING
     */
     const stats = new Stats();
     stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );

    /*
     *** ANIMATION ***
     */
    const clock = new THREE.Clock();
    let zTime = 0;

    const tick = () => {
      stats.begin();

      const elapsedTime = clock.getElapsedTime();

      //Update Particle Shader
      material.uniforms.uTime.value = elapsedTime;
      if (material.uniforms.uSize.value > 60)
        material.uniforms.uSize.value -= 0.2;

      //Update Camera position
      const t = elapsedTime / 100;
      const a = -10;
      const v = Math.sqrt(50000 ^ (2 + 2 * a * t));
      if (camera.position.y > 25) {
        camera.position.y = 50 - v * t + 0.5 * a * t * t;
      }

      if (camera.position.y < 35 && camera.position.z > -4) {
        zTime += 1 / 20000;
        const vZ = Math.sqrt(50000 ^ (2 + 2 * a * zTime));
        camera.position.z = (-1 - vZ * zTime + 0.5 * -a * zTime * zTime)
        revealText();
      }

      //Update Pass
      rgbShiftPass.uniforms.amount.value = 0.01 * (Math.cos(elapsedTime * 2 * Math.PI) + 1)/2;

      camera.position.x = mouseX * 0.001; //X position according to the mouse
      //Render
      //renderer.render(scene, camera);
      composer.render();

      //Call tick again on the next frame
      window.requestAnimationFrame(tick);

      stats.end();
    };
    tick();
  }, [galaxyCanvas]);

  return (
    <div>
      <canvas ref={galaxyCanvas}></canvas>
    </div>
  );
}
