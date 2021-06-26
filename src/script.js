import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import * as dat from 'dat.gui'
import CANNON, { Vec3 } from 'cannon'
import CannonDebugRenderer from './CannonDebugRenderer'

import gsap from 'gsap'

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
 * Physicals
 */
const world = new CANNON.World()
world.gravity.set(0, - 9.82, 0)
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const bakedTexture = textureLoader.load('/models/Chair/chair-blue.jpg')
bakedTexture.flipY = false
/**
 * Baked Material
 */
const bakedMaterial = new THREE.MeshBasicMaterial({ 
    map: bakedTexture,
    // wireframe: true
})

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
// so the loader can use worker
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let chair = null
let chairBody = null
const scale = 0.01

// Physics material
const plasticMaterial = new CANNON.Material('plastic')

gltfLoader.load(
    '/models/Chair/chair-blue.glb',
    (gltf) => 
    {   
        gltf.scene.traverse((child) =>
        {
            child.material = bakedMaterial
        })

        gltf.scene.scale.set(scale, scale, scale)
        gltf.scene.position.set(0, 5, 0)
        chair = gltf.scene
        
        scene.add(chair)

    // Cannon.js body
    chairBody = new CANNON.Body({mass: 1})
    
    // Seat
    chairBody.addShape(
        new CANNON.Box(new CANNON.Vec3(50 * 0.5 * scale, 5 * 0.5 * scale, 45 * 0.5 * scale)), 
        new CANNON.Vec3(0, -0.135, 0,)
    )

    // Back
    chairBody.addShape(
        new CANNON.Box(new CANNON.Vec3(50 * 0.5 * scale, 90 * 0.5 * scale, 5 * 0.5 * scale)), 
        new CANNON.Vec3(0, -0.135, -0.25,)
    )

     // Front
     chairBody.addShape(
        new CANNON.Box(new CANNON.Vec3(50 * 0.5 * scale, 42.5 * 0.5 * scale, 5 * 0.5 * scale)), 
        new CANNON.Vec3(0, -0.375, 0.2,)
    )


    chairBody.position.y = 2
    chairBody.material = plasticMaterial
    //below the position needs to be the same as the three.js mesh position
    // body.position.copy(position)
    world.addBody(chairBody)
    }
)


/**
 * box
 */
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000})

const width = 1
const height = 1
const depth = 1
let position = {x: - 0.5, y: 1, z: 0}

// Three.js mesh
const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
mesh.scale.set(width, height, depth)
mesh.castShadow = true
// mesh.position.copy(position)
scene.add(mesh)

// Cannon.js body
const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(-0.5, 1, 0),
    shape: shape
})
body.position.copy(position)
world.addBody(body)


/**
 * Room
 */
const room = new THREE.Mesh(
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.MeshStandardMaterial({
        color: '#00ffff',
        metalness: 0,
        roughness: 0.5
    })
)
room.receiveShadow = true
room.material.side = THREE.BackSide
room.position.y = 5
// floor.rotation.x = - Math.PI * 0.5
scene.add(room)

// Cannon.js Room
const roomBody = new CANNON.Body()
roomBody.mass = 0

// First argument -> size. 2nd argument -> position
const floorShape = new CANNON.Box(new CANNON.Vec3(5 * 0.5, 0.01 * 0.5, 5 * 0.5))
roomBody.addShape(floorShape, new CANNON.Vec3(0, - 2.5, 0))

const wallShape1 = new CANNON.Box(new CANNON.Vec3(0.01 * 0.5, 5 * 0.5, 5 * 0.5))
roomBody.addShape(wallShape1, new CANNON.Vec3(- 2.5, 0, 0))

const wallShape2 = new CANNON.Box(new CANNON.Vec3(0.01 * 0.5, 5 * 0.5, 5 * 0.5))
roomBody.addShape(wallShape2, new CANNON.Vec3(2.5, 0, 0))

const roofBody = new CANNON.Box(new CANNON.Vec3(5 * 0.5, 0.01 * 0.5, 5 * 0.5))
roomBody.addShape(roofBody, new CANNON.Vec3(0, 2.5, 0))

world.addBody(roomBody)


/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()


/**
 * Lights
 */
// const ambientLight = new THREE.AmbientLight(0xffffff, 1)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
// directionalLight.castShadow = true
// directionalLight.shadow.mapSize.set(1024, 1024)
// directionalLight.shadow.camera.far = 15
// directionalLight.shadow.camera.left = - 7
// directionalLight.shadow.camera.top = 7
// directionalLight.shadow.camera.right = 7
// directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(5, 5, 5)
// scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
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
 * Mouse
 */
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => 
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1

})

window.addEventListener('click', () => 
{
    if(currentIntersect)
    {
        if(currentIntersect.object === chair.children[0])
        {
            console.log('clicked on chair');
            chairBody.position.y = 0.5
            chairBody.quaternion.set(0,0,0,1)

            
        }
    }
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0xffffff)


/**
 * Physics debugger
 */
const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

let currentIntersect = null

// gsap.to(body.quaternion.y, { rotation: 45, delay: 1, duration: 5, ease: 'elastic'})
// gsap.to(roomBody.position, { y: 1, delay: 1, duration: 10, ease: 'elastic'})
// console.log(roomBody.quaternion);
// roomBody.quaternion.y = 0.1
// roomBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI * 0.25)

const tick = () =>
{   
    // Time
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    world.step(1 / 60, deltaTime, 3)

     // Update chair physics 
    if(chair != null && chairBody != null)
    {   
        chair.position.copy(chairBody.position)
        chair.quaternion.copy(chairBody.quaternion)

        // Cast a ray
        raycaster.setFromCamera(mouse, camera)

        const objectsToIntersect = [mesh, chair.children[0]]
        const intersects = raycaster.intersectObjects(objectsToIntersect)

        // for(const object of objectsToIntersect)
        // {
        //     mesh.material.color.set('#ff0000')
        // }
        
        // for(const intersect of intersects)
        // {
        //     intersect.object.material.color.set('#0000ff')
        // }

        // Check mouse enter / leave
        if(intersects.length)
        {
            if(currentIntersect === null)
            {
                console.log('mouse entered');
            }

            currentIntersect = intersects[0]
        }
        else
        {
            if(currentIntersect)
            {
                console.log('mouse leave');
            }

            currentIntersect = null
        }
    }

    // Update room rotation
    roomBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI * 0.1 * elapsedTime)
   
    // console.log(Math.floor(elapsedTime)%7);
    room.position.copy(roomBody.position)
    room.quaternion.copy(roomBody.quaternion)   
 
    // Update box physics
    mesh.position.copy(body.position)
    mesh.quaternion.copy(body.quaternion)

    // Update mixer (animation)
    if(mixer != null)
    {
        mixer.update(deltaTime)
    }

    // Update physics debugger
    cannonDebugRenderer.update()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()