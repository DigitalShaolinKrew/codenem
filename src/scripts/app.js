import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }

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
    const baseShader = THREE.ShaderLib.phong
    const baseUniforms = THREE.UniformsUtils.clone( baseShader.uniforms )
    const bumpTexture = new THREE.TextureLoader().load( 'assets/heightmap.png' )
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping
    const bumpScale = 100.0
    this.customUniforms = THREE.UniformsUtils.merge( [
      baseUniforms,
      {
        bumpTexture: { type: 't', value: bumpTexture },
        bumpScale: { type: 'f', value: bumpScale }
      }
    ] )
    this.geometry = new THREE.PlaneGeometry( 1000, 1000, 120, 120 )
    console.log( dom.select.one( '#terrainVertexShader' ) )
    this.material = new THREE.ShaderMaterial(
      {
        uniforms: this.customUniforms,
        vertexShader: dom.select.one( '#terrainVertexShader' ).textContent,
        fragmentShader: dom.select.one( '#terrainFragmentShader' ).textContent,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        lights: true,
        fog: true
      } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = -100
    this.add( this.mesh )
  }
}
class Checkpoint extends THREE.Object3D {
  constructor () {
    super()

    this.geometry = new THREE.PlaneBufferGeometry( 100, 100 )
    this.uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uRadiusOuter: { value: 40 },
      uStrokeOuter: { value: 10 },
      uStrokeInner: { value: 0.5 },
      uShift: { value: 1 },
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
    this.add( this.mesh )
    // const tetra = new THREE.DodecahedronGeometry( 2, 0 )
    // const material = new THREE.MeshStandardMaterial( {
    //   color: 0xffffff,
    //   emissive: 0xff0000,
    //   metalness: 0.2,
    //   roughness: 0.4,
    //   flatShading: true
    // } )
    // const mesh = new THREE.Mesh( tetra, material )
    // const radius = ( this.uniforms.uRadiusOuter.value - this.uniforms.uStrokeOuter.value )
    // this.particules = []
    // for ( let i = 0; i < 10; i++ ) {
    //   const m = mesh.clone()
    //   const a = Math.random() * 2 * Math.PI
    //   const shift = 5 * Math.random()
    //   m.position.set(
    //     Math.cos( a ) * ( radius + shift ),
    //     Math.sin( a ) * ( radius + shift ),
    //     15 * Math.sin( shift )
    //   )
    //   m.end = {
    //     x: Math.cos( a ) * radius * 1.5,
    //     y: Math.sin( a ) * radius * 1.5
    //   }
    //   this.particules.push( m )
    //   this.add( m )
    // }
    this.resize = this.resize.bind( this )
    this.animate = this.animate.bind( this )
    dom.events.on( window, 'click', this.animate )
  }
  animate () {
    console.log( this.uniforms.uColor.value )
    // TweenMax.to( this.uniforms.uStrokeInner, 1, {
    //   value: 5,
    //   ease: Back.easeOut
    // } )
  }
  update ( d ) {
    this.uniforms.uTime.value += d * 0.005
  }
  resize () {
    this.uniforms.uResolution.value.x = Window.w
    this.uniforms.uResolution.value.y = Window.h
  }
}

class Kyogre extends THREE.Object3D {
  constructor () {
    super()
    const loader = new THREE.OBJLoader()
    loader.load( 'assets/kyogre.obj', ( obj ) => {
      this.object = obj
      this.mapTextures( ( texture, texture2 ) => {
        const mesh = this.object.children[0]
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
      const xDistance = Mouse.nX * 40 - this.position.x
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
    // this.scene.fog = 
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    this.camera.position.z = 100
    this.controls = new THREE.OrbitControls( this.camera )
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setClearColor( 0x222222 )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )

    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()

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
    this.scene.add( this.kyogre )
    this.scene.add( this.terrain )
    this.checkpoint = new Checkpoint()
    this.scene.add( this.checkpoint )
  }
  initLights () {
    const ambientLight = new THREE.AmbientLight( 0x999999 )
    this.scene.add( ambientLight )

    const light = new THREE.DirectionalLight( 0x00004f )
    light.position.set( 1, 1, 1 )
    this.scene.add( light )

    const light2 = new THREE.DirectionalLight( 0x00004f )
    light2.position.set( -1, -1, -1 )
    this.scene.add( light2 )
  }
  addHelpers () {
    const axisHelper = new THREE.AxisHelper( 10 )
    this.scene.add( axisHelper )
  }
  update () {
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.kyogre.update( this.DELTA_TIME )

    this.checkpoint.update( this.DELTA_TIME )
    this.renderer.render( this.scene, this.camera )
  }
  onClick () {
    this.kyogre.spinMove()
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
