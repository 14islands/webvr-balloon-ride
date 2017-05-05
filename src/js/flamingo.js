import * as THREE from 'three'

export default class Flamingo {

  constructor (scene, loader) {
    this.scene = scene
    this.loader = loader

    this.flamingo = undefined
    this.mesh = undefined
    this.mixer = undefined
    this.animationClip = undefined
    this.animationAction = undefined

    this.load()
  }

  load () {
    this.loader.load(
      'assets/models/flamingo/flamingo.js',
      (geometry, materials) => {
        this.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
          vertexColors: THREE.FaceColors,
          morphTargets: true
        }))
        this.mesh.scale.setScalar(0.01)
        this.mesh.castShadow = true

        this.flamingo = new THREE.Object3D()
        this.flamingo.add(this.mesh)
        this.flamingo.position.y = 5
        this.flamingo.position.z = -30
        this.scene.add(this.flamingo)

        this.initAnimation(geometry)
      }
    )
  }

  initAnimation (geometry) {
    this.mixer = new THREE.AnimationMixer(this.mesh)
    this.animationClip = THREE.AnimationClip.CreateFromMorphTargetSequence('fly', geometry.morphTargets, 60)
    this.animationAction = this.mixer.clipAction(this.animationClip).setDuration(1).play()
  }

  update (delta, elapsed, t) {
    if (!this.mixer) {
      return
    }
    this.mixer.update(delta)
    this.flamingo.position.z += delta

    if (this.flamingo.position.z >= 50) {
      this.flamingo.position.z = -30
    }


    // this.flamingo.rotation.y += delta * -0.05
    // this.flamingo.position.z = 10*Math.sin(this.t) + 0
    // this.flamingo.position.x = 10*Math.cos(this.t) + 0
  }
}
