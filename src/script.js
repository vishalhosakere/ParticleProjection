import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import galaxyVertexShader from './shaders/galaxy/vertex.glsl'
import galaxyFragmentShader from './shaders/galaxy/fragment.glsl'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Galaxy
 */
const parameters = {}
parameters.count = 400000
parameters.size = 5
parameters.radius = 5
parameters.branches = 3
parameters.spin = 1
parameters.randomness = 0.2
parameters.randomnessPower = 3
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'
parameters.timeScale = 1

let geometry = null
let material = null
let points = null

// Load model
const loader = new OBJLoader()
const tempPosition = new THREE.Vector3()
let sampler = null

const loaded = (obj) => {
    sampler = new MeshSurfaceSampler(obj.children[0]).build()
    /**
     * Generate the model
     */
    generatePixels()
}

const loadAndGenerate = () => {
    const model = loader.load('models/sword.obj', loaded)
}


const generatePixels = () => {
    if (points !== null) {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const finalPosition = new Float32Array(parameters.count * 3)
    const randomMove = new Float32Array(parameters.count * 3)


    for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3
        positions[i3] = (Math.random() - 0.5) * 10
        positions[i3 + 1] = (Math.random() - 0.5) * 10
        positions[i3 + 2] = 0

        sampler.sample(tempPosition)
        finalPosition[i3] = tempPosition.x / 5
        finalPosition[i3 + 1] = tempPosition.y / 5 - 3
        finalPosition[i3 + 2] = tempPosition.z / 5

        randomMove[i3] = (Math.random() - 0.5)
        randomMove[i3 + 1] = (Math.random() - 0.5)
        randomMove[i3 + 2] = (Math.random() - 0.5)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aFinalPosition', new THREE.BufferAttribute(finalPosition, 3))
    geometry.setAttribute('aRandomMove', new THREE.BufferAttribute(randomMove, 3))

    /**
     * Material
     */
    material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms:
        {
            uTime: { value: 0 },
            uSize: { value: parameters.size * renderer.getPixelRatio() },
            uMousePos: { value: new THREE.Vector3(-999, -999, 0) }
        },
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry, material)
    scene.add(points)
}

gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generatePixels)
gui.add(parameters, 'size').min(1).max(100).step(1).onFinishChange(generatePixels)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 3
camera.rotation.z = - Math.PI / 2
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

loadAndGenerate()


window.addEventListener('mousemove', (event) => {
    var mouseVector = new THREE.Vector3();
    mouseVector.z = 0.0;
    // var dir = new THREE.Vector3();
    var distance;

    mouseVector.x = 2 * event.clientX / window.innerWidth - 1;
    mouseVector.y = - 2 * event.clientY / window.innerHeight + 1;
    // mouseVector.z = 0.5;
    mouseVector.z = 0;


    mouseVector.unproject(camera);

    // mouseVector.normalize();

    mouseVector.sub(camera.position);
    mouseVector.normalize();
    distance = - camera.position.z / mouseVector.z;

    mouseVector.multiplyScalar(distance).add(camera.position);
    // mouseVector.applyEuler( 0, pointMesh.rotation.y, 0);
    material.uniforms.uMousePos.value = mouseVector;

    var centerX = window.innerWidth * 0.5;
    var centerY = window.innerHeight * 0.5;

    camera.position.y = (event.clientX - centerX) * 0.0001;
    camera.position.x = (event.clientY - centerY) * 0.0001;
})


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update material
    if (material)
        material.uniforms.uTime.value = elapsedTime

    // if (points)
    //     points.rotation.y = elapsedTime

    // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()