import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }
class Physics {
  constructor ( scene ) {
    this.bodys = []
    this.meshes = []
    this.config = [
      1, // The density of the shape.
      0.4, // The coefficient of friction of the shape.
      0.2, // The coefficient of restitution of the shape.
      1, // The bits of the collision groups to which the shape belongs.
      0xffffffff // The bits of the collision groups with which the shape collides.
    ]
    this.world = new OIMO.World( { info: true, worldscale: 100 } )
    this.world.gravity = new OIMO.Vec3( 0, -10, 0 )
    this.ground = this.world.add( { size: [ 500, 10, 500 ], pos: [ 0, 0, 0 ], rot: [ 0, 0, 0 ], config: this.config } )
    this.groundMesh = new THREE.Mesh( new THREE.PlaneGeometry( 500, 500 ), new THREE.MeshPhongMaterial( {
      color: 0xFFFFFF,
      dithering: true
    } ) )
    this.groundMesh.rotation.set( -Math.PI / 2, 0, 0 )
    this.groundMesh.receiveShadow = true
    this.groundMesh.position.set( 0, 5, 0 )
    scene.add( this.groundMesh )
  }

  addPhysic ( mesh, type ) {
    const body = this.world.add( { type: [ type ],
      size: [ mesh.scale.x, mesh.scale.y, mesh.scale.z ],
      pos: [ mesh.position.x, mesh.position.y, mesh.position.z ],
      rot: [ mesh.rotation.x * 180 / Math.PI, mesh.rotation.y * 180 / Math.PI, mesh.rotation.z * 180 / Math.PI ],
      move: true,
      mass: 1,
      config: this.config
    } )
    this.bodys.push( body )
    this.meshes.push( mesh )
  }

  remove ( index ) {
    this.world.removeRigidBody( this.bodys[index] )
    this.bodys.splice( index, 1 )
    this.meshes.splice( index, 1 )
  }

  update () {
    if ( this.world == null ) return

    this.world.step()

    let i = this.bodys.length
    let body, mesh
    while ( i-- ) {
      body = this.bodys[i]
      mesh = this.meshes[i]
      if ( !body.sleeping ) {
        mesh.position.copy( body.getPosition() )
        mesh.quaternion.copy( body.getQuaternion() )
      }
    }
  }
}

class Camera extends THREE.Object3D {
  constructor () {
    super()
    this.geometry = new THREE.BoxGeometry( 1, 1, 1 )
    this.position.set( Math.random() * 2 - 1, 230, Math.random() * 2 - 1 )
    this.material = new THREE.MeshStandardMaterial( {
      color: 0xff0000,
      flatShading: true,
      roughness: 0.5,
      metalness: 0.6,
      dithering: true
    } )
    this.scale.set( 16, 10, 5 )
    this.rotation.set( Math.random() * 2 - 1, Math.random() * 2 - 1, 1.5 )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.add( this.mesh )
  }
  update () {
    // this.rotation.y += 0.01
    // this.rotation.z += 0.01
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 5000 )
    this.camera.position.z = 200
    this.camera.position.y = 200
    this.controls = new THREE.OrbitControls( this.camera )
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.gammaInput = true
    this.renderer.gammaOutput = true
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )
    this.physics = new Physics( this.scene )
    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()
    this.objects = []
    this.bind()
    this.initLights()
    this.initMesh()
  }
  bind () {
    [ 'update', 'resize' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMesh () {
    this.cam = new Camera()
    if ( this.objects.length === 30 ) {
      this.physics.remove( 0 )
      this.scene.remove( this.objects[0] )
      this.objects.splice( 0, 1 )
    }
    this.physics.addPhysic( this.cam, 'box' )
    this.objects.push( this.cam )
    this.scene.add( this.cam )
  }
  initLights () {
    // const ambientLight = new THREE.AmbientLight( 0x111111 )
    // this.scene.add( ambientLight )

    const spotLight = new THREE.SpotLight( 0xffffff, 1 )
    spotLight.position.set( 0, 300, 100 )
    // spotLight.angle = Math.PI / 4
    spotLight.penumbra = 0.05
    spotLight.decay = 2
    spotLight.distance = 1000
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    spotLight.shadow.camera.near = 100
    spotLight.shadow.camera.far = 400
    spotLight.shadow.camera.fov = 30
    this.scene.add( spotLight )
  }
  update () {
    this.physics.update()
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
    [ 'onResize', 'onMouseMove', 'update', 'onClick' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  addListeners () {
    dom.events.on( window, 'resize', this.onResize )
    dom.events.on( window, 'mousemove', this.onMouseMove )
    dom.events.on( dom.select.one( '.app' ), 'click', this.onClick )
  }
  init () {
    this.update()
  }
  onResize () {
    Window.w = window.innerWidth
    Window.h = window.innerHeight
    this.xp.resize()
  }
  onClick () {
    this.xp.initMesh()
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
