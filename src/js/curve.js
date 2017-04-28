import * as THREE from 'three'

export default class Curve extends THREE.Curve {
  constructor () {
    super()
  }

  getPoint (t) {
    var tx = 0
    var ty = t*200
    var tz = 0
    return new THREE.Vector3( tx, ty, tz ).multiplyScalar(1)
  }
}
