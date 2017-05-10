import * as THREE from 'three'
import Curve from './curve'
import Fire from './fire'

export default class World {

  constructor (scene, loader) {
    this.scene = scene
    this.loader = loader
    this.wings = undefined
    this.pivot = undefined

    this.load()
  }

  load () {
    this.loader.load(
      'assets/models/island/skyisland3.json',
      ( island ) => {
        for (let i = 0; i < island.children.length; i++) {
          if (island.children[i].material) {
            if (island.children[i].material.materials) {
              island.children[i].material.materials.forEach((mat) => {
                mat.side = THREE.DoubleSide;
              })
            }
            else {
              island.children[i].material.side = THREE.DoubleSide;
            }
          }
          if (island.children[i].geometry) {
            island.children[i].geometry.computeFlatVertexNormals()
          }
        }
        this.scene.add(island)
      }
    )

    this.loader.load(
      'assets/models/windmill/mill2.json',
      ( windmill ) => {
        for (let i = 0; i < windmill.children.length; i++) {
          if (windmill.children[i].material) {
            if (windmill.children[i].material.materials) {
              windmill.children[i].material.materials.forEach((mat) => {
                mat.side = THREE.DoubleSide;
              })
            }
          }
          if (windmill.children[i].geometry) {
            windmill.children[i].geometry.computeFlatVertexNormals()
          }
        }
        windmill.position.set(-5.5, 0, -4.8)
        this.scene.add(windmill)
      }
    )
    this.loader.load(
      'assets/models/windmill/wings4.json',
      ( wings ) => {
        this.wings = wings
        this.wings.position.set(-5.8, 3.5, -4.8)
        this.scene.add(this.wings)
        for (let i = 0; i < this.wings.children.length; i++) {
          if (this.wings.children[i].geometry) {
            this.wings.children[i].geometry.computeFlatVertexNormals()
          }
        }
      }
    )
  }

  update (delta, elapsed, t) {
    if(this.wings) this.wings.rotation.x += delta
  }

}
