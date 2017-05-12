import * as THREE from 'three'
import Curve from './curve'
import Fire from './fire'

export default class Balloon {

  constructor (scene, loader) {
    this.scene = scene
    this.loader = loader

    this.balloon = undefined
    this.line = undefined
    this.handle = undefined
    this.rope = new THREE.Group()
    this.toIntersect = []
    this.flyingObjects = []
    this.fire = new Fire()

    this.load()
  }

  load () {
    this.loader.load(
      'assets/models/balloon/balloon3.json',
      (balloon) => {
        this.balloon = balloon
        this.balloon.children[0].geometry.computeFlatVertexNormals()
        this.balloon.position.set(0, 5, 0)
        this.scene.add(this.balloon)
        this.flyingObjects.push(this.balloon)

        this.createRope()
        this.createFire()
      }
    )
  }

  createRope () {
    const path = new Curve(10)
    const tube = new THREE.TubeGeometry(path, 30, 3, 8, true )
    const material = new THREE.MeshLambertMaterial( { color: 0x000000 } )
    const torus = new THREE.TorusGeometry(0.2, 0.05, 64, 32)

    this.line = new THREE.Mesh(tube, material)
    this.line.scale.setScalar(0.01)

    this.handle = new THREE.Mesh(torus, material)
    this.handle.scale.setScalar(0.5)
    this.handle.position.y = -0.1

    this.rope.add(this.line, this.handle)
    this.rope.position.set(0, 7, 15)

    this.scene.add(this.rope)
    this.toIntersect.push(this.line)
    this.toIntersect.push(this.handle)
    this.flyingObjects.push(this.rope)
  }

  createFire () {
    this.fire.init()
    this.fire.position.set(0.07, 2.3, -0.05)
    this.balloon.add(this.fire)
    // this.fire.position.set(0, 7.4, 0)
    // this.scene.add(this.fire)
    // this.flyingObjects.push(this.fire)
  }

  update (delta, elapsed, t) {
    this.fire && this.fire.update(delta, elapsed)
    for (let object of this.flyingObjects) {
      object.position.z = 20*Math.sin(t) + 0
      object.position.x = 20*Math.cos(t) + 0
    }
    this.rope.position.z = 20*Math.sin(t) -0.5

    // this.fall(delta)
  }

  flyHigher (delta) {
    // this.fire.scale.setScalar(2)
    this.fire.setLarge(true)
    for (let object of this.flyingObjects) {
      object.position.y += delta
    }
  }

  remove () {
    for (let object of this.flyingObjects) {
      scene.remove(object)
    }
  }

  fall (delta) {
    // this.fire.scale.setScalar(1)
    this.fire.setLarge(false)
    for (let object of this.flyingObjects) {
      object.position.y += delta * -0.2
    }
  }

  getFlyingObjects () {
    return this.flyingObjects
  }

  getRope () {
    return this.toIntersect
  }

}
