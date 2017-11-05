import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }
const randomInRange = ( min, max ) => {
  return Math.random() * ( max - min ) + min
}

let SPEED = 0.5

class Loader {
  init () {
    const loader = dom.select.one( '.loader' )
    const progress = dom.select.one( '.loader__progress' )
    const progressBar = dom.select.one( '.loader__progress__bar' )
    this.tl = new TimelineMax( { delay: 0.3, onComplete: () => {
      loader.classList.add( 'loader--hidden' )
    } } )
    this.tl.to( progressBar, 0.5, { scaleX: 1, transformOrigin: '0% 50%' } )
    this.tl.to( progress, 0.2, { scaleX: 0, transformOrigin: '100% 50%' } )
    this.tl.to( loader, 0.3, { opacity: 0, ease: Sine.easeOut }, '+=0.2' )
  }
}

class Terrain extends THREE.Object3D {
  constructor () {
    super()
    this.geometry = new THREE.SphereGeometry( 500, 128, 128 )
    const loader = new THREE.ImageLoader()
    loader.load( 'assets/heightmap.png', ( img ) => {
      console.log( this.geometry.vertices )

      const canvas = document.createElement( 'canvas' )
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext( '2d' ).drawImage( img, 0, 0, img.width, img.height )
      for ( let i = 0, l = this.geometry.vertices.length; i < l; i++ ) {
        var dir = this.position2Dir( this.geometry.vertices[i] )
        var h = this.getH( dir, canvas )
        var vector = new THREE.Vector3()
        vector.set( this.geometry.vertices[i].x, this.geometry.vertices[i].y, this.geometry.vertices[i].z )
        vector.setLength( h )
        this.geometry.vertices[i].x = vector.x
        this.geometry.vertices[i].y = vector.y
        this.geometry.vertices[i].z = vector.z
      }
      this.geometry.computeFaceNormals()
      this.geometry.computeVertexNormals()
      this.material = new THREE.MeshPhongMaterial( { color: 0x000022 } )
      this.mesh = new THREE.Mesh( this.geometry, this.material )
      this.mesh.rotation.z = -Math.PI / 2
      this.mesh.position.y = -260
      this.mesh.position.z = -50
      this.add( this.mesh )
    } )
  }D

  getH ( dir, canvas ) {
    dir.az = 360 - dir.az + 180
    dir.az = dir.az % 360
    var x = Math.floor( canvas.width * dir.az / 360 )
    var y = Math.floor( canvas.height * ( dir.h + 90 ) / 180 )
    var pixelData = canvas.getContext( '2d' ).getImageData( x, y, 1, 1 ).data
    var h = 200 + pixelData[0] / 5
    return h
  }

  position2Dir ( position ) {
    let az = null
    let h = null

    const vector = new THREE.Vector3( position.x, position.y, position.z )
    const length = vector.length()

    const hd = Math.sqrt( Math.pow( position.x, 2 ) + Math.pow( position.z, 2 ) ) / length

    h = Math.atan( ( position.y / length ) / hd ) / Math.PI * 180
    h *= -1

    az = Math.atan( ( position.z / hd ) / ( position.x / hd ) )
    if ( position.x < 0 && position.z > 0 ) az = Math.PI + az
    if ( position.x < 0 && position.z < 0 ) az = Math.PI + az
    if ( position.x > 0 && position.z < 0 ) az = Math.PI * 2 + az

    az = az / Math.PI * 180

    if ( isNaN( az ) ) az = 0

    return {
      az: az,
      h: h
    }
  }

  update ( t ) {
    if ( this.mesh ) {
      this.mesh.rotation.x += 0.005
    }
  }
}
class Checkpoint extends THREE.Object3D {
  constructor ( index ) {
    super()
    this.INTERACTIVE = true
    this.resize = this.resize.bind( this )
    this.animate = this.animate.bind( this )
    this.reset = this.reset.bind( this )
    this.geometry = new THREE.PlaneBufferGeometry( 40, 40 )
    this.uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uRadiusOuter: { value: 15 },
      uStrokeOuter: { value: 6 },
      uStrokeInner: { value: 0.5 },
      uShift: { value: 1 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color( 0xffffff ) }
    }
    this.material = new THREE.ShaderMaterial( {
      uniforms: this.uniforms,
      vertexShader: dom.select.one( '#checkpointVertex' ).textContent,
      fragmentShader: dom.select.one( '#checkpointFragment' ).textContent,
      side: THREE.DoubleSide,
      transparent: true
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.name = `checkpoint-${index}`
    this.mesh.animate = this.animate
    this.add( this.mesh )
  }
  animate () {
    if ( !this.INTERACTIVE ) return
    this.INTERACTIVE = false
    const success = new THREE.Color( 0x00ff00 )
    const tl = new TimelineMax()
    tl.to( this.uniforms.uColor.value, 0.3, {
      r: success.r,
      g: success.g,
      b: success.b,
      ease: Sine.easeOut
    }, 0 )
    tl.to( this.scale, 0.3, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      ease: Expo.easeOut
    }, 0 )
    tl.to( this.uniforms.uOpacity, 0.3, {
      value: 0,
      ease: Expo.easeOut
    }, 0.1 )
  }
  reset () {
    this.INTERACTIVE = true
    this.uniforms.uColor.value = new THREE.Color( 0xffffff )
    this.uniforms.uOpacity.value = 1
    this.scale.set( 1, 1, 1 )
  }
  update ( d ) {
    this.uniforms.uTime.value += d * 0.005
    this.position.z += d * SPEED
  }
  resize () {
    this.uniforms.uResolution.value.x = Window.w
    this.uniforms.uResolution.value.y = Window.h
  }
}

class Particles extends THREE.Object3D {
  constructor () {
    super()
    this.material = new THREE.SpriteMaterial( {
      map: new THREE.CanvasTexture( this.generateTexture() ),
      blending: THREE.AdditiveBlending
    } )
    this.array = []
    for ( let i = 0; i < 200; i++ ) {
      const particle = new THREE.Sprite( this.material )
      particle.scale.x = particle.scale.y = Math.random() * 1 + 0.1
      particle.position.set( ( Math.random() * 250 - 125 ), ( Math.random() * 250 - 125 ), ( Math.random() * 100 - 50 ) )
      this.array.push( particle )
      this.add( particle )
    }

    this.rotation.x = Math.PI / 2
  }

  generateTexture () {
    const canvas = document.createElement( 'canvas' )
    canvas.width = 16
    canvas.height = 16
    const context = canvas.getContext( '2d' )
    const gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 )
    gradient.addColorStop( 0, 'rgba(255,255,255,1)' )
    gradient.addColorStop( 0.2, 'rgba(0,255,255,1)' )
    gradient.addColorStop( 0.4, 'rgba(0,0,0,1)' )
    gradient.addColorStop( 1, 'rgba(0,0,0,1)' )
    context.fillStyle = gradient
    context.fillRect( 0, 0, canvas.width, canvas.height )
    return canvas
  }

  update ( delta ) {
    if ( this.array ) {
      for ( let i = 0; i < this.array.length; i++ ) {
        const particle = this.array[i]
        particle.position.x += ( Math.random() * 0.2 - 0.1 ) / i * Math.sin( delta / 2 ) * 3
        particle.position.z += ( ( Math.random() * 5 ) + 1 ) / i * Math.cos( delta / 2 ) * 3
        particle.position.y += ( ( Math.random() * 1 ) + 0.5 )

        if ( particle.position.y > 100 ) {
          // particle.position.x = -10
          particle.position.y = -150
          // particle.position.z = -10
        }

        if ( particle.position.z < -40 ) {
          // particle.position.x = -10
          particle.position.z = 20
          // particle.position.z = -10
        }
      }
    }
  }
}

class Kyogre extends THREE.Object3D {
  constructor () {
    super()
    // const boudingsGeo = new THREE.BoxGeometry( 20, 20, 20 )
    // const boundingsMat = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } )
    // const boudingsMesh = new THREE.Mesh( boudingsGeo, boundingsMat )
    // this.add( boudingsMesh )
    const loader = new THREE.OBJLoader()
    loader.load( 'assets/kyogre.obj', ( obj ) => {
      this.object = obj
      this.mapTextures( ( texture, texture2 ) => {
        const mesh = this.object.children[0]
        mesh.name = 'kyogre'
        mesh.material[0].map = texture
        mesh.material[1].map = texture
        mesh.material[2].map = texture2
        mesh.material.needsUpdate = true
        console.log( mesh )
        this.object.children[0] = mesh
        this.object.rotation.x = Math.PI / 2 + Math.PI / 12
        this.object.rotation.z = Math.PI
        this.object.children[0].geometry.center()
        this.object.scale.set( 0.5, 0.5, 0.5 )
        this.add( this.object )
      } )
    } )
    const light = new THREE.PointLight( 0xff0000, 10, 100, 2 )
    this.add( light )

    this.bind()
  }
  bind () {
    [ 'spinMove', 'update' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  mapTextures ( callback ) {
    console.log( 'GETTING TEXTURE' )
    const loader = new THREE.TextureLoader()
    loader.load(
      'assets/textures/kyogre_0.jpg',
      ( texture ) => {
        loader.load(
          'assets/textures/kyogre_0_6.jpg',
          ( texture2 ) => {
            callback( texture, texture2 )
          },
          ( xhr ) => {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
          },
          ( xhr ) => {
            console.error( 'An error happened', xhr )
          }
        )
      },
      ( xhr ) => {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
      },
      ( xhr ) => {
        console.error( 'An error happened', xhr )
      }
    )
  }
  spinMove () {
    if ( !this.animating ) {
      console.log( 'spinning' )
      this.animating = true
      const direction = Mouse.nX > 0 ? -1 : 1
      TweenLite.to( this.object.rotation, 1.2, {
        y: '+=' + ( Math.PI * 2 * direction ),
        ease: Back.easeInOut.config( 1.15 ),
        onComplete: () => {
          this.animating = false
        }
      } )
    }
  }

  update ( delta ) {
    if ( this.object ) {
      // this.object.position.y = Math.sin( delta / 1000 ) * 10

      this.rotation.z = -Mouse.nX * 0.9
      this.rotation.x = Mouse.nY * 0.6
      const xDistance = Mouse.nX * 50 - this.position.x
      const yDistance = Mouse.nY * 40 - this.position.y
      const distance = Math.sqrt( xDistance * xDistance + yDistance * yDistance )
      if ( distance > 1 ) {
        this.position.x += xDistance * 0.1
        this.position.y += yDistance * 0.1
      }
    }
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog( 0x190254, 1, 300 )
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    // this.camera.position.z = 100
    this.camera.position.set( 0, 0, 100 )
    // this.camera.rotation.x = 5 * Math.PI / 180
    // this.camera.lookAt( new THREE.Vector3() )
    this.controls = new THREE.OrbitControls( this.camera )
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setClearColor( 0x190254 )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )

    this.READY = false
    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()

    this.CHECKPOINTS_COUNT = 5

    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = 100
    this.mouse = new THREE.Vector2()
    this.intersectables = []
    this.bind()
    this.initLights()
    this.initMeshes()
    this.addHelpers()
  }
  bind () {
    [ 'update', 'resize' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMeshes () {
    this.kyogre = new Kyogre()
    this.terrain = new Terrain()
    this.particles = new Particles()
    this.scene.add( this.kyogre )
    this.scene.add( this.terrain )
    this.checkpoints = []
    for ( let i = 0; i < this.CHECKPOINTS_COUNT; i++ ) {
      const checkpoint = new Checkpoint( i )
      checkpoint.position.set(
        randomInRange( -30, 30 ),
        randomInRange( -25, 25 ),
        -( 1000 + i * 500 )
      )
      this.checkpoints.push( checkpoint )
      this.scene.add( checkpoint )
      this.intersectables.push( checkpoint )
    }
    this.scene.add( this.particles )
  }
  initLights () {
    const light = new THREE.DirectionalLight( 0xffffff, 1.2 )
    light.position.set( 1, 1, 1 )
    this.scene.add( light )

    const light2 = new THREE.DirectionalLight( 0xffffff, 1.2 )
    light2.position.set( -1, -1, -1 )
    this.scene.add( light2 )
  }
  addHelpers () {
    const axisHelper = new THREE.AxisHelper( 10 )
    this.scene.add( axisHelper )
  }
  checkCollision () {
    const intersects = this.raycaster.intersectObjects( this.intersectables, true )
    for ( let i = 0; i < intersects.length; i++ ) {
      let intersect = intersects[ i ]
      if ( intersect ) intersect.object.animate()
    }
  }
  update () {
    this.mouse.x = Mouse.nX
    this.mouse.y = Mouse.nY
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.kyogre.update( this.DELTA_TIME )
    this.terrain.update()

    if ( this.READY ) {
      this.raycaster.setFromCamera( this.mouse, this.camera )
      for ( const checkpoint of this.checkpoints ) {
        if ( checkpoint.position.z > 200 ) {
          SPEED += 0.005
          checkpoint.reset()
          checkpoint.position.z = this.checkpoints[ this.CHECKPOINTS_COUNT - 1 ].position.z - 500
          this.checkpoints.push( this.checkpoints.shift() )
        }
        checkpoint.update( this.DELTA_TIME )
      }
      this.checkCollision()
    }
    this.particles.update( this.DELTA_TIME )
    this.renderer.render( this.scene, this.camera )
  }
  onClick () {
    this.kyogre.spinMove()
    this.READY = true
  }
  resize () {
    this.checkpoint.resize()
    this.camera.aspect = Window.w / Window.h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( Window.w, Window.h )
  }
}

class App {
  constructor () {
    this.bind()
    this.addListeners()
    this.xp = new Xp()
  }
  bind () {
    [ 'onResize', 'onMouseMove', 'update', 'onClick' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  addListeners () {
    dom.events.on( window, 'resize', this.onResize )
    dom.events.on( window, 'mousemove', this.onMouseMove )
    dom.events.on( window, 'click', this.onClick )
  }
  init () {
    this.loader = new Loader()
    this.loader.init()
    this.update()
  }
  onClick () {
    this.xp.onClick()
  }

  onResize () {
    Window.w = window.innerWidth
    Window.h = window.innerHeight
    this.xp.resize()
  }
  onMouseMove ( e ) {
    e.preventDefault()
    Mouse.x = e.clientX || Mouse.x
    Mouse.y = e.clientY || Mouse.y
    Mouse.nX = -1 + ( Mouse.x / Window.w ) * 2
    Mouse.nY = 1 - ( Mouse.y / Window.h ) * 2
  }
  update () {
    this.xp.update()
    raf( this.update )
  }
}

const ShaolinApp = new App()

dom.events.on( window, 'DOMContentLoaded', () => {
  ShaolinApp.init()
} )
