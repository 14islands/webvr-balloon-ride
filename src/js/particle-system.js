import * as THREE from 'three'
// import particlesVS from './shaders/particles-vs.glsl'
// import particlesFS from './shaders/particles-fs.glsl'

const WHITE = {
  mainColor: 0xeeeeee,
  mainEmissive: 0,
  secondaryColor: 0xffffff,
  secondaryEmissive: 0,
  detailColor: 0x999999,
  detailEmissive: 0
}

export default class ParticleSystem {
  constructor () {
    this.time = 0.0
    let triangles = 1
    let instances = 7000
    let geometry = new THREE.InstancedBufferGeometry()

    let vertices = new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    let unit = 0.055
    vertices.setXYZ(0, unit, -unit, 0)
    vertices.setXYZ(1, -unit, unit, 0)
    vertices.setXYZ(2, 0, 0, unit)
    geometry.addAttribute('position', vertices)

    let offsets = new THREE.InstancedBufferAttribute(new Float32Array(instances * 3), 3, 1)
    let dist = 180
    for (let i = 0, ul = offsets.count; i < ul; i++) {
      offsets.setXYZ(i, (Math.random() - 0.5) * dist, (Math.random() - 0.5) * dist, (Math.random() - 0.5) * dist)
    }
    geometry.addAttribute('offset', offsets)

    let colors = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1)

    let threeColor = new THREE.Color()
    for (let i = 0, ul = colors.count; i < ul; i++) {
      let c = threeColor.setHex(WHITE.mainColor)
      colors.setXYZW(i, c.r, c.g, c.b, 1)
    }
    geometry.addAttribute('color', colors)

    let timeOffsets = new THREE.InstancedBufferAttribute(new Float32Array(instances * 1), 1, 1)

    for (let i = 0, ul = timeOffsets.count; i < ul; i++) {
      timeOffsets.setX(i, Math.random())
    }
    geometry.addAttribute('timeOffset', timeOffsets)

    let vector = new THREE.Vector4()
    let orientationsStart = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1)
    for (let i = 0, ul = orientationsStart.count; i < ul; i++) {
      vector.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      vector.normalize()
      orientationsStart.setXYZW(i, vector.x, vector.y, vector.z, vector.w)
    }
    geometry.addAttribute('orientationStart', orientationsStart)

    let orientationsEnd = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1)
    for (let i = 0, ul = orientationsEnd.count; i < ul; i++) {
      vector.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      vector.normalize()
      orientationsEnd.setXYZW(i, vector.x, vector.y, vector.z, vector.w)
    }
    geometry.addAttribute('orientationEnd', orientationsEnd)

    let material = new THREE.RawShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        sineTime: { value: 1.0 }
      },
      vertexShader: `
        precision highp float;
        uniform float time;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        attribute vec3 position;
        attribute vec3 offset;
        attribute vec4 color;
        attribute vec4 orientationStart;
        attribute vec4 orientationEnd;
        attribute float timeOffset;
        varying vec4 vColor;
        varying float lifeProgress;

        void main(){

          vec3 vPosition = offset;

          lifeProgress = mod(time+timeOffset,1.0);

          vPosition = offset * lifeProgress + position;
          vec4 orientation = normalize(mix(orientationStart, orientationEnd, lifeProgress));
          vec3 vcV = cross(orientation.xyz, vPosition);
          //orientation.w *= time*5.0;
          vPosition = vcV * (2.0 * orientation.w) + (cross(orientation.xyz, vcV) * 2.0 + vPosition);
          vColor = color;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
        }
        `,
      fragmentShader: `
      precision highp float;
      uniform float time;
      varying vec4 vColor;
      varying float lifeProgress;

      void main() {
        float depth = gl_FragCoord.z / gl_FragCoord.w / 5.0;
        float opacity = clamp(0.2, 1.0, depth);
        vec4 color = vColor;
        color.a = sin(lifeProgress*100.0)*opacity;
        gl_FragColor = color;
      }
      `,
      side: THREE.DoubleSide,
      transparent: true
    })

    let mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    this.mesh = mesh
  }

  update (dt) {
    this.time += 0.0001
    /* if (this.time > 0.1) {
      this.time -= 0.1
    } */

    this.mesh.material.uniforms.time.value = Math.sin(this.time)
  }
}
