import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }
const map = ( num, min1, max1, min2, max2 ) => {
  let num1 = ( num - min1 ) / ( max1 - min1 )
  let num2 = ( num1 * ( max2 - min2 ) ) + min2
  return num2
}

class RaycastPlane extends THREE.Object3D {
  constructor () {
    super()
    this.progress = 0
    this.geometry = new THREE.PlaneBufferGeometry( 200, 100, 16, 16 )
    this.uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 10 },
      uResolution: { value: new THREE.Vector2( Window.w, Window.h ) },
      uMouse: { value: new THREE.Vector2( 0.5, 0.5 ) },
      uColor: { value: new THREE.Color( 0x0032E8 ) }
    }
    this.material = new THREE.ShaderMaterial( {
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      vertexShader: dom.select.one( '#planeVertex' ).textContent,
      fragmentShader: dom.select.one( '#planeFragment' ).textContent
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.name = 'raycastPlane'
    this.add( this.mesh )
    this.update = this.update.bind( this )
    this.resize = this.resize.bind( this )
    dom.events.on( window, 'click', () => {
      const c = new THREE.Color( 0xffffff * Math.random() )
      TweenMax.to( this.uniforms.uColor.value, 1,
        {
          r: c.r,
          g: c.g,
          b: c.b,
          ease: Circ.easeOut
        }
      )
    } )
  }
  update ( d ) {
    this.uniforms.uTime.value += d * 0.001
  }
  resize () {
    this.uniforms.uResolution.value.x = Window.w
    this.uniforms.uResolution.value.y = Window.h
  }
  mouseMove ( mouse ) {
    this.uniforms.uMouse.value.x += ( map( -mouse.x, -1, 1, 0.1, 0.9 ) - this.uniforms.uMouse.value.x ) * 0.1
    this.uniforms.uMouse.value.y += ( map( -mouse.y, -1, 1, 0.1, 0.9 ) - this.uniforms.uMouse.value.y ) * 0.1
  }
}

class Trail extends THREE.Object3D {
  constructor () {
    super()
    this.points = 30
    this.next = new THREE.Vector3()
    this.vertices = new Float32Array( this.points * 3 )
    for ( let i = 0; i < this.vertices.length; i += 3 ) {
      this.vertices[ i ] = 0
      this.vertices[ i + 1 ] = 0
      this.vertices[ i + 2 ] = 0
    }
    this.resolution = new THREE.Vector2( Window.w, Window.h )
    this.material = new MeshLineMaterial( {
      color: new THREE.Color( 0xffffff ),
      lineWidth: 3,
      resolution: this.resolution
    } )
    this.line = new MeshLine()
    this.line.setGeometry( this.vertices, ( p ) => 1 - Math.sin( p ) )
    this.mesh = new THREE.Mesh( this.line.geometry, this.material )
    this.add( this.mesh )
    this.updatePoints = this.updatePoints.bind( this )
    this.resize = this.resize.bind( this )
  }
  updatePoints ( point ) {
    this.next.x += ( point.x - this.next.x ) * 0.15
    this.next.y += ( point.y - this.next.y ) * 0.15
    this.next.z += ( point.z - this.next.z ) * 0.15
    // Shift points
    for ( let i = 0; i < this.vertices.length; i += 3 ) {
      this.vertices[ i ] = this.vertices[ i + 3 ]
      this.vertices[ i + 1 ] = this.vertices[ i + 4 ]
      this.vertices[ i + 2 ] = this.vertices[ i + 5 ] + 10
    }
    // Add new point at the end
    this.vertices[ this.vertices.length - 1 ] = this.next.z
    this.vertices[ this.vertices.length - 2 ] = this.next.y
    this.vertices[ this.vertices.length - 3 ] = this.next.x
    this.line.setGeometry( this.vertices, ( p ) => 1 - Math.sin( p ) )
  }
  update () {
    this.rotation.y += 0.01
    this.rotation.z += 0.01
  }
  resize () {
    this.resolution.x = Window.w
    this.resolution.y = Window.h
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    this.camera.position.z = 100
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )

    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.rotateX = 0
    this.rotateY = 0

    this.bind()
    this.initLights()
    this.initMeshes()
  }
  bind () {
    [ 'mouseMove', 'update', 'resize' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMeshes () {
    this.trail = new Trail()
    this.raycastPlane = new RaycastPlane()
    this.scene.add( this.trail )
    this.scene.add( this.raycastPlane )
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
  mouseMove () {
    this.mouse.x = Mouse.nX
    this.mouse.y = Mouse.nY
    this.raycastPlane.mouseMove( this.mouse )
  }
  getWorldMousePosition () {
    const intersects = this.raycaster.intersectObject( this.raycastPlane.mesh )
    if ( intersects.length > 0 ) {
      let p = intersects[ 0 ].point
      this.trail.updatePoints( p )
    }
  }
  update () {
    this.raycaster.setFromCamera( this.mouse, this.camera )
    this.getWorldMousePosition()
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.raycastPlane.update( this.DELTA_TIME )
    this.renderer.render( this.scene, this.camera )
  }
  resize () {
    this.trail.resize()
    this.raycastPlane.resize()
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
    Mouse.nY = -( Mouse.y / Window.h ) * 2 + 1
    this.xp.mouseMove()
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
