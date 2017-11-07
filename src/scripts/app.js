import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }

class Plane extends THREE.Object3D {
  constructor () {
    super()
    this.geometry = new THREE.PlaneBufferGeometry( 100, 100, 16, 16 )
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor1: { value: new THREE.Color( 0xE563E5 ) },
      uColor2: { value: new THREE.Color( 0x2AEBEC ) }
    }
    this.material = new THREE.ShaderMaterial( {
      uniforms: this.uniforms,
      vertexShader: dom.select.one( '#cloudVertex' ).textContent,
      fragmentShader: dom.select.one( '#cloudFragment' ).textContent
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.add( this.mesh )
    this.resize()
    this.update = this.update.bind( this )
    this.resize = this.resize.bind( this )
  }
  update ( d ) {
    this.uniforms.uTime.value += d * 0.001
  }
  resize () {
    this.uniforms.uResolution.value.x = Window.w
    this.uniforms.uResolution.value.y = Window.h
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    this.camera.position.z = 50
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
    this.plane = new Plane()
    this.scene.add( this.plane )
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
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.plane.update( this.DELTA_TIME )
    this.renderer.render( this.scene, this.camera )
  }
  resize () {
    this.camera.aspect = Window.w / Window.h
    this.camera.updateProjectionMatrix()
    this.plane.resize()
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
    this.update()
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
