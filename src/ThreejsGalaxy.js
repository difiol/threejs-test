import React, { useEffect, useRef } from "react";
import * as THREE from 'three';
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import particleImage from './assets/particles/circle_05.png'

export default function ThreejsGalaxy() {

/*
	*** SETUP ***
 */
const scene = new THREE.Scene()

const textureLoader = new THREE.TextureLoader()
const particleTexture = textureLoader.load(particleImage)

console.log(particleTexture.image)

const gui = new dat.GUI() 
const galaxy = useRef(null)
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}
const parameters = {}  //Parameters for the Galaxy
parameters.count = 100000
parameters.size = 0.25
parameters.radius = 10
parameters.branches = 4
parameters.spin = 1  //Branch bending
parameters.randomness = 0.2  //Particles spreading
parameters.randomnessPower = 3  //To make the spreading exponential
parameters.insideColor = '#ff6030'  //Color for the closer particles
parameters.outsideColor = '#1b3984'  //Color for the more spreaded particles

let geometry = null
let material = null
let points = null



useEffect(() => {
const canvas = galaxy.current
/*
	*** OBJECTS ***
*/

/*
	*** GALAXY ***	
*/
const positions = new Float32Array(parameters.count * 3)  //3 values for each vertex
const colors = new Float32Array(parameters.count * 3)  //3 values for each vertex
/* Function Generator of the Galaxy */
const generateGalaxy = () =>{
	console.log("Generating Galaxy...")
	//If there is any galaxy already created we clear it
	if(points !== null){
		geometry.dispose()  //Free the memory of the geometry
		material.dispose()
		scene.remove(points)  //It is a relation between geometry and material, just remove it from the scene
	}

	geometry = new THREE.BufferGeometry()


	//Color classes
	const colorInside = new THREE.Color(parameters.insideColor)
	const colorOutside = new THREE.Color(parameters.outsideColor)
	
	for (let i = 0; i < parameters.count; i++){
		const i3 = i * 3
		//POSITION
		const radius = Math.random() * parameters.radius
		const spinAngle = radius * parameters.spin
		const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

		const randomX = (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1))
		const randomY = (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1))
		const randomZ = (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1))
		
		positions[i3 + 0] = Math.sin(branchAngle + spinAngle) * radius + randomX
		positions[i3 + 1] = (Math.random() - 0.5) + randomY
		positions[i3 + 2] = Math.cos(branchAngle + spinAngle) * radius + randomZ

		//COLOR
		const mixedColor = colorInside.clone()  //Create a new color from color inside and lerp (fusion) it with out side color
		mixedColor.lerp(colorOutside, radius / parameters.radius)  //Mix it with the outside color depending on how far the particle is
		colors[i3 + 0] = mixedColor.r
		colors[i3 + 1] = mixedColor.g
		colors[i3 + 2] = mixedColor.b
		
	}
	//Geometry
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

	//Material
	material = new THREE.PointsMaterial({
		size: parameters.size,
		sizeAttenuation: true,
		map: particleTexture,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		transparent: true
	})
	//Points
	points = new THREE.Points(geometry, material)
	scene.add(points)
	renderer.render(scene, camera)
}
//Add tweaks to GUI
gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.01).max(0.6).step(0.005).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

/*
	*** CAMERA ***
*/
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
const controls = new OrbitControls(camera, canvas)
camera.position.z = 10
camera.position.y = 10
camera.lookAt(scene.position)
controls.update()
scene.add(camera)

/*
	*** RENDERER ***
*/
const renderer = new THREE.WebGLRenderer({canvas})

renderer.setClearColor('#262837')
renderer.setSize(sizes.width, sizes.height)  //Resize the renderer


//Resize Renderer if the window's size is changed
window.addEventListener('resize', () => {
	//Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	
	//Update camera aspect ratio
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()
	
	//Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.render(scene, camera)
})
generateGalaxy()

/*
	*** ANIMATION ***
*/
const clock = new THREE.Clock()

const tick = () =>
{
	const elapsedTime = clock.elapsedTime
	//Update objects
	//points.rotation.y-=0.01

	renderer.render(scene, camera)
	//Call tick again on the next frame
	window.requestAnimationFrame(tick)
}
tick()

}, [galaxy])


	return(
		<div>
			<canvas ref={galaxy}></canvas>
		</div>
	);
}

