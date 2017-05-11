import * as THREE from 'three'
import _VRControls from 'VRControls'
import _ViveController from 'ViveController'
import _OBJLoader from 'OBJLoader'

export default class Controllers {

  constructor (camera, body, loader, rope) {
    this.body = body
    this.camera = camera
    this.loader = loader

    this.textureLoader = new THREE.TextureLoader()
    this.raycaster = new THREE.Raycaster()

    this.viveController1 = undefined
    this.viveController2 = undefined

    this.vrControls = new THREE.VRControls(this.camera)
    this.vrControls.standing = true
    this.tempMatrix = new THREE.Matrix4()

    this.intersected = []
    this.rope = rope
    this.isMovingUp = false

    this.loadViveControllerModels = this.loadViveControllerModels.bind(this)
    this.onTriggerDown = this.onTriggerDown.bind(this)
    this.onTriggerUp = this.onTriggerUp.bind(this)
    this.isFlyingUp = this.isFlyingUp.bind(this)

    // this.init()

  }

  loadViveControllerModels () {
    this.loader.setPath('assets/models/vive-controller/')
    this.loader.load('vr_controller_vive_1_5.obj', (object) => {
      console.log('loaded controller OBJ')

      this.textureLoader.setPath('assets/models/vive-controller/')

      let controller = object.children[0]
      controller.material.map = this.textureLoader.load('onepointfive_texture.png')
      controller.material.specularMap = this.textureLoader.load('onepointfive_spec.png')

      this.viveController1.add(object.clone())
      this.viveController2.add(object.clone())
    })
  }

  init () {

    this.viveController1 = new THREE.ViveController(0)
    this.viveController1.standingMatrix = this.vrControls.getStandingMatrix()
    this.viveController1.addEventListener('triggerdown', this.onTriggerDown)
    this.viveController1.addEventListener('triggerup', this.onTriggerUp)
    this.body.add(this.viveController1)

    this.viveController2 = new THREE.ViveController(1)
    this.viveController2.standingMatrix = this.vrControls.getStandingMatrix()
    this.viveController2.addEventListener('triggerdown', this.onTriggerDown)
    this.viveController2.addEventListener('triggerup', this.onTriggerUp)
    this.body.add(this.viveController2)

    this.loadViveControllerModels()

  // showControllerGuideRays()
  }

  update (delta, elapsed, t) {
    this.vrControls.update(delta)
    this.cleanIntersected()
    if (this.viveController1) {
      this.viveController1.update()
      this.intersectObjects( this.viveController1 )
    }
    if (this.viveController2) {
      this.viveController2.update()
      this.intersectObjects( this.viveController2 )
    }
  }

  onTriggerDown( event ) {
    var controller = event.target
    var intersections = this.getIntersections( controller )
    if ( intersections.length > 0 ) {
      this.isMovingUp = true
    }
  }

  isFlyingUp () {
    return this.isMovingUp
  }

  onTriggerUp( event ) {
    this.isMovingUp = false
  }

  getIntersections( controller ) {
    this.tempMatrix.identity().extractRotation( controller.matrixWorld )
    this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld )
    this.raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( this.tempMatrix )
    return this.raycaster.intersectObjects( this.rope )
  }

  intersectObjects( controller ) {
    // Do not highlight when already selected
    if ( controller.userData.selected !== undefined ) return
    var intersections = this.getIntersections( controller )
    if ( intersections.length > 0 ) {
      var intersection = intersections[ 0 ]
      var object = intersection.object
      object.material.emissive.r = 1
      this.intersected.push( object )
    }
  }

  cleanIntersected() {
    while ( this.intersected.length ) {
      var object = this.intersected.pop()
      object.material.emissive.r = 0
    }
  }

}
