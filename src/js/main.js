import * as THREE from 'three'
import query from './utils/query'
import World from './world'
import Flamingo from './flamingo'
import Balloon from './balloon'
import Controllers from './controllers'
import ParticleSystem from './particle-system'
import Button from './button'

// load shimmed plugins - access on THREE namespace
import _OBJLoader from 'OBJLoader'
import _VREffect from 'VREffect'

// Import WebVRManager npm module
import WebVRManager from 'webvr-boilerplate'

const clock = new THREE.Clock()

let scene, camera, HEIGHT, WIDTH, renderer, container
let vrEffect, vrManager, vrDisplay

const objectLoader = new THREE.ObjectLoader()
const OBJLoader = new THREE.OBJLoader()
const jsonLoader = new THREE.JSONLoader()
let body
let world, balloon
let viveControllers
let mixer
let t = 0
let particleSystem
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()
let objects = []
let intersected = []
let isMovingUp = false
let isGoingUp
let btnFly
let tempMatrix = new THREE.Matrix4()
let controlsEnabled = false

const updateObjects = []

const button = new Button()

function createScene () {
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth

  // Create the scene
  scene = new THREE.Scene()

  // Create the camera
  const aspectRatio = WIDTH / HEIGHT
  const fieldOfView = 60
  const nearPlane = 0.1
  const farPlane = 50
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  )

  body = new THREE.Object3D()
  body.add(camera)
  body.position.x = 0
  body.position.y = 5
  body.position.z = 0
  scene.add(body)

  // Create the renderer
  renderer = new THREE.WebGLRenderer({
    // Allow transparency to show the gradient background
    // we defined in the CSS
    alpha: true,
    // Activate the anti-aliasing this is less performant,
    // but, as our project is low-poly based, it should be fine :)
    antialias: true
  })

  renderer.setPixelRatio(window.devicePixelRatio)

  // Define the size of the renderer in this case,
  // it will fill the entire screen
  renderer.setSize(WIDTH, HEIGHT)

  // Enable shadow rendering
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Add the DOM element of the renderer to the
  // container we created in the HTML
  container = document.getElementById('world')
  container.appendChild(renderer.domElement)
}

function handleWindowResize () {
  // update height and width of the renderer and the camera
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth
  vrEffect.setSize(WIDTH, HEIGHT)
  renderer.setSize(WIDTH, HEIGHT)
  camera.aspect = WIDTH / HEIGHT
  camera.updateProjectionMatrix()
}

function createLights () {
  // A directional light shines from a specific direction.
  // It acts like the sun, that means that all the rays produced are parallel.
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.5)

  // Set the direction of the light
  shadowLight.position.set(1, 2, -1)
  shadowLight.position.normalize()

  // Allow shadow casting
  shadowLight.castShadow = true

  // define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -10
  shadowLight.shadow.camera.right = 10
  shadowLight.shadow.camera.top = 10
  shadowLight.shadow.camera.bottom = -10
  shadowLight.shadow.camera.near = -10
  shadowLight.shadow.camera.far = 10

  // debug light
  if (query.debug) {
    scene.add(new THREE.CameraHelper(shadowLight.shadow.camera))
  }

  // define the resolution of the shadow the higher the better,
  // but also the more expensive and less performant
  shadowLight.shadow.mapSize.width = 1024 * 2
  shadowLight.shadow.mapSize.height = 1024 * 2

  // an ambient light modifies the global color of a scene and makes the shadows softer
  const ambientLightPink = new THREE.AmbientLight(0xffdaf8, 0.2)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1)

  scene.add(shadowLight)
  scene.add(ambientLight)
}


function createParticles () {
  particleSystem = new ParticleSystem()
  particleSystem.mesh.position.y = -2
  scene.add(particleSystem.mesh)
}


function updateDayScene () {
  if (updateDayScene.done) return
  scene.fog = new THREE.FogExp2( 0xffffff, 0.035 )
  updateDayScene.done = true
}

function updateVRScene () {
  if (updateVRScene.done) return
  renderer.setClearColor(0xceefff, 1)
  scene.fog = new THREE.FogExp2( 0xceefff, 0.035 )
  updateVRScene.done = true
}

function loop () {
  let delta = clock.getDelta()
  let elapsed = clock.getElapsedTime()
  t += 0.001

  for (let object of updateObjects) {
    object.update(delta, elapsed, t)
  }

  // particleSystem.update(delta)

  body.position.z = 20*Math.sin(t) + 0
  body.position.x = 20*Math.cos(t) + 0

  if (vrEffect.isPresenting === false) {
    updateDayScene()
    body.position.y += delta * -0.2
    balloon.fall(delta)
    particleSystem.update(delta)
    button.show()
  }

  if (vrEffect.isPresenting === true && controlsEnabled === true) {
    updateVRScene()
    particleSystem.update(delta)
    button.hide()

    if (viveControllers.isFlyingUp() === true) {
      isMovingUp = true
    } else if (viveControllers.isFlyingUp() === false) {
      isMovingUp = false
      balloon.fall(delta)
      body.position.y += delta * -0.2
    }

  }

  if (vrEffect.isPresenting === true && controlsEnabled === false) {
    updateVRScene()
    button.hide()
    scene.remove(particleSystem.mesh)
  }


  if (isMovingUp === true) {
    balloon.flyHigher(delta)
    body.position.y += delta
  }

  // Render the scene through the vrManager.
  vrManager.render(scene, camera, delta)

  // call the loop function again
  vrDisplay.requestAnimationFrame(loop)
}

function init () {

  // set up the scene, the camera and the renderer
  createScene()

  // add the lights
  createLights()

  world = new World(scene, objectLoader)
  balloon = new Balloon(scene, objectLoader)
  viveControllers = new Controllers(camera, body, OBJLoader, balloon.getRope())
  updateObjects.push(world, balloon, viveControllers)
  updateObjects.push(new Flamingo(scene, jsonLoader))

  //add objects
  createParticles()

  // // Apply VR headset positional data to camera.

  // Apply VR stereo rendering to renderer.
  vrEffect = new THREE.VREffect(renderer)
  vrEffect.setSize(window.innerWidth, window.innerHeight)

  // Create a VR vrManager helper to enter and exit VR mode.
  let params = {
    hideButton: false, // Default: false.
    isUndistorted: false // Default: false.
  }
  vrManager = new WebVRManager(renderer, vrEffect, params)

  btnFly = document.getElementById('js-btn-fly')

  addEventListeners()

  // CHECK IF GAMEPADS ALREADY CONNECTED - no event will fire
  if (navigator.getGamepads) {
    let hasController = false
    const gamepads = navigator.getGamepads()
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) hasController = true
    }
    if (hasController) initControllers()
    console.info('hasController?', hasController)
  } else {
    console.warn('no gamepad api')
  }

  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  setupStage()
}

function addEventListeners () {
  document.addEventListener('mousedown', onDocumentMouseDown, false)
  document.addEventListener('mouseup', stopMovingUp, false)
  // Listen to the screen: if the stuser resizes it
  // we have to update the camera and the renderer size
  window.addEventListener('resize', handleWindowResize, false)
  window.addEventListener('vrdisplaypresentchange', handleWindowResize, true)
  window.addEventListener('gamepadconnected', initControllers, false)
  window.addEventListener('gamepaddisconnected', disconnect, false)
  btnFly.addEventListener('mousedown', moveBalloonUp, false)
  btnFly.addEventListener('touchstart', moveBalloonUp, false)
  btnFly.addEventListener('touchend', stopMovingUp, false)
}

function initControllers (event) {
  controlsEnabled = true
  console.log('controllers initialized')
  viveControllers.init()
}

function disconnect () {
  console.log('gamepads disconnected')
}
// Add mouse events to test the balloon moving up
function onDocumentMouseDown (event) {
  event.preventDefault()

  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1
  mouse.y = -( event.clientY / renderer.domElement.clientHeight ) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  var intersects = raycaster.intersectObjects(balloon.getFlyingObjects(), true)

  if ( intersects.length > 0 ) {
      moveBalloonUp()
  }
}

function stopMovingUp (event) {
  event.preventDefault()
  isMovingUp = false
}

function moveBalloonUp () {
  isMovingUp = true
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage () {
  navigator.getVRDisplays().then((displays) => {
    if (displays.length > 0) {
      vrDisplay = displays[0]
      if (vrDisplay.stageParameters) {
        setStageDimensions(vrDisplay.stageParameters)
      }
      // start a loop that will update the objects' positions
      // and render the scene on each frame
      vrDisplay.requestAnimationFrame(loop)
    }
  })
}

function setStageDimensions (stage) {
  // Size the skybox according to the size of the actual stage.
  // var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
}

window.addEventListener('load', init, false)
