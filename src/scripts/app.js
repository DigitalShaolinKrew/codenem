import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }

class Sphere extends THREE.Object3D {
  constructor () {
    super()
    const loader = new THREE.TextureLoader()
    loader.load( 'rock.jpg', ( texture ) => {
      this.geometry = new THREE.PlaneGeometry( 81, 61, 512, 512 )
      console.log( texture )
      this.uniforms = {
        uTime: { value: 0 },
        uTransition: { value: 0 },
        uTexture: { type: 't', value: texture }
      }
      this.material = new THREE.ShaderMaterial( {
        uniforms: this.uniforms,
        fragmentShader: dom.select.one( '#sphereFragment' ).textContent,
        vertexShader: dom.select.one( '#sphereVertex' ).textContent,
        side: THREE.DoubleSide
      } )
      this.mesh = new THREE.Mesh( this.geometry, this.material )
      this.mesh.rotation.x = -Math.PI / 2
      this.add( this.mesh )
    } )
    this.update = this.update.bind( this )
  }
  update ( d, camera ) {
    // this.rotation.y += 0.005
    // this.rotation.z += 0.01
    if ( this.mesh ) {
      this.uniforms.uTime.value += d * 0.01
      const dist = camera.position.distanceTo( this.position )
      let scrollValue = dist / 350
      scrollValue = scrollValue < 0 ? 0 : scrollValue
      scrollValue = scrollValue > 1 ? 1 : scrollValue
      this.uniforms.uTransition.value = scrollValue
      this.scale.set( scrollValue * 3, scrollValue * 3, scrollValue * 3 )
      this.rotation.x = Math.abs( 1 - scrollValue ) * Math.PI / 1.8
    }
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 0.1, 1000 )
    this.camera.position.z = 400
    this.controls = new THREE.OrbitControls( this.camera )
    this.controls.minDistance = 1
    this.controls.maxDistance = 400
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
    this.sphere = new Sphere()
    this.scene.add( this.sphere )
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
    this.sphere.update( this.DELTA_TIME, this.camera )
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
