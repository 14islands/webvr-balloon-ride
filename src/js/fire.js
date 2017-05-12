import * as THREE from 'three'
import * as TweenMax from 'gsap'

const START_SIZE = 0.5
const LARGE_SIZE = 2

export default class Fire extends THREE.Object3D {
  constructor () {
    super()
    this.numParticles = 1000
    this.isLarge = false
    this.tweenedScale = START_SIZE
    this.scale.setScalar(this.tweenedScale)
    this.particleSize = this.getSmallSize()

    this.opts = {
      sparkLifecycle: 0.7,
      sparkStartSize: 10,
      sparkEndSize: 20,
      sparkDistanceScale: this.getSize(),

      flameMinHeight: 0.02,
      flameMaxHeight: 0.25,
      flamePeriod: 0.5,
      windStrength: 0.14,
      windFrequency: 0.5,

      color: 0xfcc648,
      endColor: 0xc0561c,

      opacity: 0.7,
      gravity: 0.2,

      // static - set at start
      baseWidth: 0.8 // angle - multiple of PI
    }

    var textureLoader = new THREE.TextureLoader()
    textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/126747/snowflake_16x16.png', (texture) => {
      this.texture = texture
      if (this.system) {
        this.system.material.uniforms.texture.value = texture
      }
    })
  }

  setLarge (large) {
    if (!this.isLarge && large) {
      TweenMax.killTweensOf(this)
      TweenMax.to(this, 1, {
        tweenedScale: LARGE_SIZE,
        particleSize: this.getLargeSize(),
        onUpdate: x => {
          this.scale.setScalar(this.tweenedScale)
        }
      })
    } else if (this.isLarge && !large) {
      TweenMax.killTweensOf(this)
      TweenMax.to(this, 1, {
        tweenedScale: START_SIZE,
        particleSize: this.getSmallSize(),
        onUpdate: x => {
          this.scale.setScalar(this.tweenedScale)
        }
      })
    }
    this.isLarge = large
  }

  getSize () {
    return this.particleSize
  }

  getSmallSize () {
    return window.innerHeight * 0.002 * window.devicePixelRatio
  }

  getLargeSize () {
    return window.innerHeight * 0.005 * window.devicePixelRatio
  }

  init () {
    // make sure gravity points in world Y
    // http://stackoverflow.com/questions/35641875/three-js-how-to-find-world-orientation-vector-of-objects-local-up-vector
    var v3 = new THREE.Vector3()
    v3.copy(this.up).applyQuaternion(this.getWorldQuaternion().inverse())

    const systemGeometry = new THREE.BufferGeometry()
    const systemMaterial = new THREE.ShaderMaterial({
      uniforms: {
        up: { type: 'v3', value: v3 },
        gravity: { type: 'f', value: this.opts.gravity },
        elapsedTime: { type: 'f', value: 0.0 },
        numParticles: { type: 'f', value: this.numParticles },
        color: { type: 'c', value: new THREE.Color(this.opts.color) },
        endColor: { type: 'c', value: new THREE.Color(this.opts.endColor) },
        flameMaxHeight: { type: 'f', value: this.opts.flameMaxHeight },
        flameMinHeight: { type: 'f', value: this.opts.flameMinHeight },
        flamePeriod: { type: 'f', value: this.opts.flamePeriod },
        windStrength: { type: 'f', value: this.opts.windStrength },
        windFrequency: { type: 'f', value: this.opts.windFrequency },
        sparkLifecycle: { type: 'f', value: this.opts.sparkLifecycle },
        sparkDistanceScale: { type: 'f', value: this.opts.sparkDistanceScale },
        sparkStartSize: { type: 'f', value: this.opts.sparkStartSize },
        sparkEndSize: { type: 'f', value: this.opts.sparkEndSize },
        opacity: { type: 'f', value: this.opts.opacity },
        texture: { type: 't', value: this.texture }
      },
      transparent: true,
      // depthWrite: false,
      depthTest: false,
      // NOTE: don't use additive blending for light backgrounds
      // http://answers.unity3d.com/questions/573717/particle-effects-against-light-backgrounds.html
      // blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float elapsedTime;
        uniform float numParticles;
        uniform float gravity;
        uniform vec3 up;
        uniform float sparkLifecycle;
        uniform float sparkDistanceScale;
        uniform float sparkStartSize;
        uniform float sparkEndSize;
        uniform float flameMaxHeight;
        uniform float flameMinHeight;
        uniform float flamePeriod;
        uniform float windStrength;
        uniform float windFrequency;
        attribute vec3 direction;
        attribute float uniqueness;
        attribute float particleIndex;
        #define PI 3.141592653589793238462643383279
        varying float vTime;
        void main( void ) {
          // unique duration
          float duration = sparkLifecycle + sparkLifecycle * uniqueness;
          // make time loop
          float particleOffset = (particleIndex / numParticles * duration);
          float time = mod(elapsedTime + particleOffset, duration);
          // store time as 0-1 for fragment shader
          vTime = time / duration;
          // apply "gravity" to fire
          vec3 vGravity = up * gravity * pow(vTime, 2.0);
          // move in direction based on elapsed time
          float flameHeight = mix(flameMinHeight, flameMaxHeight, uniqueness);
          vec3 vDistance = flameHeight * direction * vTime;
          // close flame at top (0.5 is fully closed)
          vDistance.xz *= cos(mix(0.0, PI * flamePeriod, vTime));
          // apply some random horizonal wind
          vec3 vWind = sin((elapsedTime + vTime * uniqueness) * windFrequency * uniqueness) * cross(up, direction) * windStrength * uniqueness * vTime;
          // add all forces to get final position for this frame
          vec3 pos = position + vDistance + vGravity + vWind;
          // Set size based on frame and distance
          vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
          gl_PointSize = mix(sparkStartSize, sparkEndSize, vTime);
          gl_PointSize = gl_PointSize * (sparkDistanceScale / length(mvPosition.xyz));
          // project position on screen
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 endColor;
        uniform float opacity;
        uniform sampler2D texture;
        varying float vTime;
        void main() {
          vec4 texColor = texture2D(texture, gl_PointCoord);
          vec4 startColor = vec4(color, opacity);
          vec4 endColor = vec4(endColor, 0.0);
          gl_FragColor = texColor * mix(startColor, endColor, vTime);
        }
      `
    })

    // all flames start at 0,0,0
    const positions = new Float32Array(this.numParticles * 3)
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = 0
    }

    const direction = new Float32Array(this.numParticles * 3)
    for (let i = 0; i < direction.length; i += 3) {
      const phi = this.randCenter(Math.PI * this.opts.baseWidth)
      const theta = this.randCenter(Math.PI)
      // create normal vector in random direction
      const sphereCoord = THREE.Spherical(1, phi, theta)

      const v = new THREE.Vector3()
      v.setFromSpherical(sphereCoord)
      direction[i] = v.x
      direction[i + 1] = v.y
      direction[i + 2] = v.z
    }

    // push some uniqueness - because entropy...
    const uniqueness = new Float32Array(this.numParticles)
    for (let i = 0; i < this.numParticles; i++) {
      uniqueness[i] = Math.random()
    }

    // remember particle index
    const particleIndex = new Float32Array(this.numParticles)
    for (let i = 0; i < this.numParticles; i++) {
      particleIndex[i] = i
    }

    systemGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    systemGeometry.addAttribute('direction', new THREE.BufferAttribute(direction, 3))
    systemGeometry.addAttribute('uniqueness', new THREE.BufferAttribute(uniqueness, 1))
    systemGeometry.addAttribute('particleIndex', new THREE.BufferAttribute(particleIndex, 1))

    systemGeometry.computeBoundingSphere()
    systemGeometry.computeBoundingBox()
    this.system = new THREE.Points(systemGeometry, systemMaterial)
    // this.system.position.x = 0.1
    // this.system.position.z = -0.1
    // this.geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0, 10, 0 ) );
    this.add(this.system)

    this.system.renderOrder = 2
  }

  update (delta, elapsed) {
    if (!this.system) return
    this.system.material.uniforms.elapsedTime.value = elapsed
    this.system.material.uniforms.sparkDistanceScale.value = this.getSize()

    var up = new THREE.Vector3()
    up.copy(this.up).applyQuaternion(this.getWorldQuaternion().inverse())
    this.system.material.uniforms.up.value = up
  }

  updateOne (opt) {
    this.system.material.uniforms[opt].value = this.opts[opt]
  }

  updateColor (opt) {
    this.system.material.uniforms[opt].value = new THREE.Color(this.opts[opt])
  }

  randCenter (v) {
    return (v * (Math.random() - 0.5))
  }
}
