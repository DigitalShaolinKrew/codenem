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

class Cube extends THREE.Object3D {
  constructor () {
    super()

    this.geometry = new THREE.SphereGeometry( 10, 16, 16 )
    this.material = new THREE.MeshStandardMaterial( {
      color: 0xff0000,
      flatShading: true,
      roughness: 0.5,
      metalness: 0.6
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.add( this.mesh )
  }
  update () {
    this.rotation.y += 0.01
    this.rotation.z += 0.01
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    this.camera.position.z = 100
    this.controls = new THREE.OrbitControls( this.camera )
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )

    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()

    this.bind()
    this.initLights()
    this.initMeshes()
  }
  bind () {
    [ 'update', 'resize' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMeshes () {
    this.cube = new Cube()
    this.scene.add( this.cube )
  }
  initLights () {
    const ambientLight = new THREE.AmbientLight( 0x111111 )
    this.scene.add( ambientLight )

    const light = new THREE.DirectionalLight( 0x4f4f4f )
    light.position.set( 1, 1, 1 )
    this.scene.add( light )

    const light2 = new THREE.DirectionalLight( 0x4f4f4f )
    light2.position.set( -1, -1, -1 )
    this.scene.add( light2 )
  }
  update () {
    this.cube.update()
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.renderer.render( this.scene, this.camera )
  }
  resize () {
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
    [ 'onResize', 'onMouseMove', 'update' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  addListeners () {
    dom.events.on( window, 'resize', this.onResize )
    dom.events.on( window, 'mousemove', this.onMouseMove )
  }
  init () {
    this.loader = new Loader()
    this.loader.init()
    this.update()
  }
  onResize () {
    Window.w = window.innerWidth
    Window.h = window.innerHeight
  }
  onMouseMove ( e ) {
    e.preventDefault()
    Mouse.x = e.clientX || Mouse.x
    Mouse.y = e.clientY || Mouse.y
    Mouse.nX = ( Mouse.x / Window.w ) * 2 - 1
    Mouse.nY = ( Mouse.y / Window.h ) * 2 + 1
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
