import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }
class BigBranch extends THREE.Object3D {
  constructor ( x, y, z, length, angle ) {
    super()
    this.x = x
    this.y = y
    this.z = z
    this.length = length
    this.angle = angle
    this.radius = 3

    this.createBranch( 0, -300, 0, 200, 90 * ( Math.PI / 180 ) )
  }

  drawBranch ( pointY, pointX, radius, length ) {
    const direction = new THREE.Vector3().subVectors( pointY, pointX )
    const orientation = new THREE.Matrix4()
    orientation.lookAt( pointX, pointY, new THREE.Object3D().up )
    orientation.multiply( new THREE.Matrix4().set( 1, 0, 0, 0,
      0, 0, 1, 0,
      0, -1, 0, 0,
      0, 0, 0, 1 ) )
    const edgeGeometry = new THREE.CylinderGeometry( radius, radius * 0.999, direction.length(), length, 1 )
    const edge = new THREE.Mesh( edgeGeometry,
      new THREE.MeshBasicMaterial( { color: 0xFFFFFF } ) )

    edge.applyMatrix( orientation )
    const pos = new THREE.Vector3().addVectors( pointX, direction.multiplyScalar( 0.5 ) )
    edge.position.set( pos.x, pos.y, pos.z )
    return edge
  }

  createBranch ( x = this.x, y = this.y, z = this.z, length = this.length, angle = this.angle ) {
    const newx = x + Math.cos( angle ) * length
    const newy = y + Math.sin( angle ) * length
    const newz = z - Math.sin( angle ) * ( Math.random() * ( -60 - 60 ) + 60 )
    const branch = this.drawBranch( new THREE.Vector3( x, y, z ), new THREE.Vector3( newx, newy, newz ), this.radius, length )
    this.add( branch )
    this.radius *= 0.985
    if ( length > 30 ) {
      const rand = Math.ceil( ( Math.random() * 5 - 1 ) + 1 )
      for ( let i = 0; i < rand; i++ ) {
        length = length * ( Math.random() * ( 0.9 - 0.6 ) + 0.6 )
        if ( i % 2 ) {
          angle = angle + ( Math.random() * ( -50 - 20 ) + 20 ) * ( Math.PI / 180 )
        } else {
          angle = angle - ( Math.random() * ( -50 - 20 ) + 20 ) * ( Math.PI / 180 )
        }
        if ( i % 3 ) angle = angle - ( Math.random() * ( 20 - 17 ) + 17 ) * ( Math.PI / 180 )
        this.createBranch( newx, newy, newz, length, angle )
      }
    }
  }
}
class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog( 0x000000, 1, 2600 )
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 10000 )
    this.camera.position.z = 1500
    this.controls = new THREE.OrbitControls( this.camera )
    this.controls.minDistance = 800
    this.controls.maxDistance = 2000
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setClearColor( 0x000000, 1 )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )

    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()

    this.bind()
    // this.initLights()
    this.initMeshes()
  }
  bind () {
    [ 'update', 'resize' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMeshes () {
    for ( let i = 0; i < 4; i++ ) {
      const tree = new BigBranch()
      tree.rotation.set( 0, i * Math.PI / 2, 0 )
      this.scene.add( tree )
    }
  }

  clearScene () {
    while ( this.scene.children.length > 0 ) {
      this.scene.remove( this.scene.children[0] )
    }
  }

  initLights () {
    const light = new THREE.PointLight( 0xff0000, 1, 100, 2 )
    light.position.set( 0, 0, 0 )
    this.scene.add( light )
  }
  update () {
    // this.cube.update()
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
    [ 'onResize', 'onMouseMove', 'update', 'refresh' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  addListeners () {
    dom.events.on( window, 'resize', this.onResize )
    dom.events.on( window, 'mousemove', this.onMouseMove )
    dom.events.on( dom.select.one( '#refresh' ), 'click', this.refresh )
  }
  init () {
    this.update()
  }

  refresh () {
    this.xp.clearScene()
    this.xp.initMeshes()
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
