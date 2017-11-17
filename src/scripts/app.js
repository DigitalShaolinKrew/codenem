import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }

class Orange extends THREE.Object3D {
  constructor () {
    super()
    this.geometry = new THREE.PlaneBufferGeometry( 10, 10, 64, 64 )
    this.uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color( 0xF2654C ) },
      uColor2: { value: new THREE.Color( 0xE93C29 ) }
    }
    this.material = new THREE.ShaderMaterial( {
      uniforms: this.uniforms,
      vertexShader: dom.select.one( '#orangeVertex' ).textContent,
      fragmentShader: dom.select.one( '#orangeFragment' ).textContent,
      flatShading: THREE.FlatShading
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.add( this.mesh )
    this.update = this.update.bind( this )
  }
  update ( d ) {
    this.uniforms.uTime.value += d * 0.001
    this.rotation.y += d * 0.001
  }
}
class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    this.camera.position.z = 100
    this.controls = new THREE.TrackballControls( this.camera )
    this.controls.noZoom = true
    this.controls.noPan = true
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )

    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()

    this.bind()
    this.initMeshes()
  }
  bind () {
    [ 'update', 'resize' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMeshes () {
    this.orange = new Orange()
    this.scene.add( this.orange )
  }
  update () {
    this.controls.update()
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.orange.update( this.DELTA_TIME )
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
