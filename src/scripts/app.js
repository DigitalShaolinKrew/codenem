import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }
const color = 0xffc300
const handWidth = 20
const handHeight = 10
let fingerLength = 15
const fingerWidth = 5
// const ToRad = 0.0174532925199432957

class Physics {
  constructor ( scene ) {
    this.bodys = []
    this.meshes = []

    this.scene = scene
    this.world = new OIMO.World( { info: true, worldscale: 100 } )
    this.world.gravity = new OIMO.Vec3( 0, -5, 0 )
    this.ground = this.world.add( { size: [ 1000, 10, 1000 ], pos: [ 0, -500, 0 ], rot: [ 0, 0, 0 ], world: this.world } )
  }

  addPlatform ( position ) {
    this.platform = this.world.add( { size: [ 1, 1, 1 ], pos: [ position.x + 1, -14, position.z ], rot: [ 0, 90, 0 ], world: this.world } )
    // this.addStaticBox( [ 10, 250, 10 ], [ position.x, -200, position.z ], [ 0, 0, 0 ] )
  }

  addPhysic ( mesh, type ) {
    const width = mesh.scale.x
    const body = this.world.add( { type: [ type ],
      size: [ width, width, width ],
      pos: [ mesh.position.x, mesh.position.y, mesh.position.z ],
      rot: [ 0, 0, mesh.rotation.z * 180 / Math.PI ],
      move: true,
      mass: Math.random() * 10 - 1,
      world: this.world
    } )
    // console.log( 'bodyyyyyyyyyyyyyyyyyyy', body )
    this.bodys.push( body )
    this.meshes.push( mesh )
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
        if ( mesh.position.y < -100 ) {
          mesh.position.x = Math.random() * 2 - 1
          mesh.position.z = Math.random() * 2 - 1
          mesh.position.y = Math.random() * 100 - 100
          body.resetPosition( mesh.position.x, mesh.position.y, mesh.position.z )
        }
      }
    }
    // if ( this.force ) {
    //   console.log( this.force.getPosition() )
    // }
  }
}

class Salts extends THREE.Group {
  constructor ( scene, position ) {
    super()
    this.scene = scene
    this.position.copy( position )
    this.position.z += 1
    this.position.y -= 15
    this.position.x -= 5
    this.physics = new Physics( this.scene )
    this.count = 100
    this.saltgrains = []
    for ( let i = 0; i < this.count; i++ ) {
      this.addGrain()
    }
  }

  addGrain () {
    const geo = new THREE.SphereGeometry( 1, 1, 1 )
    const mat = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } )
    const grain = new THREE.Mesh( geo, mat )
    grain.position.x = Math.random() * 1 - 0.5
    grain.position.z = Math.random() * 1 - 0.5
    grain.position.y = Math.random() * 50 - 50
    this.saltgrains.push( grain )
    this.add( grain )
    this.physics.addPhysic( grain, 'sphere' )
  }

  update () {
    this.physics.update()
  }
}

class Finger extends THREE.Group {
  constructor ( i ) {
    super()
    this.phalanges = new THREE.Object3D()
    this.length = fingerLength
    this.width = fingerWidth
    this.index = i

    switch ( i ) {
      case 0:
        this.initThumb()
        break
      case 1:
        this.initIndex()
        break
      case 2:
        this.initFuck()
        break
      case 3:
        this.initRing()
        break
      case 4:
        this.initPinky()
        break
    }
    console.log( i, this.length )
    const fingerZRot = Math.PI / 25
    const fingerZRot1 = Math.PI / 20
    this.fingerPos = [
      new THREE.Vector3( handWidth / 2, -handHeight / 2.5, this.length / 1.5 ), // THUMB
      new THREE.Vector3( handWidth / 4 + this.width / 2, this.width / 2 + 1, handHeight / 2 + this.length / 2 ), // INDES
      new THREE.Vector3( 0 + fingerWidth / 2, this.width / 2, handHeight / 2 + this.length / 2 ), // FUCK
      new THREE.Vector3( -handWidth / 4 + this.width / 2, this.width / 2, handHeight / 2 + this.length / 2 ), // RING
      new THREE.Vector3( -handWidth / 2 + this.width / 2, 0, handHeight / 2 + this.length / 2 ) // PINKY
    ]
    this.fingerRot = [
      new THREE.Euler( Math.PI / 8, Math.PI / 14, -Math.PI / 1.5 ), // THUMB
      new THREE.Euler( 0, fingerZRot, -fingerZRot ), // INDEX
      new THREE.Euler( -0.2, 0, fingerZRot1 ), // FUCK
      new THREE.Euler( -0.5, -fingerZRot, fingerZRot ), // RING
      new THREE.Euler( -1.2, -Math.PI / 10, Math.PI / 10 ) // PINKY
    ]

    this.geometry = new THREE.BoxGeometry( this.width, this.width, this.length )
    this.geometry2 = new THREE.BoxGeometry( this.width, this.width, this.length / 1.5 )
    this.material = new THREE.MeshPhongMaterial( {
      color: color
    } )
    this.createFinger()

    this.add( this.phalanges )
  }
  createFinger () {
    this.phalange1 = new THREE.Mesh( this.geometry, this.material )
    this.phalanges.add( this.phalange1 )

    this.phalange2 = new THREE.Object3D()
    const p2 = new THREE.Mesh( this.geometry2, this.material )
    p2.position.z = this.length / 4
    this.phalange2.add( p2 )

    this.phalange3 = new THREE.Object3D()
    const p3 = new THREE.Mesh( this.geometry2, this.material )
    p3.position.z = this.length / 2
    this.phalange3.add( p3 )

    this.phalange1.add( this.phalange2 )
    this.phalange2.add( this.phalange3 )
    this.phalange2.position.z = this.length / 2
    this.phalange2.rotation.x = this.p2xRot ? this.p2xRot : 1

    this.phalange1.position.copy( this.fingerPos[ this.index ] )

    if ( this.isThumb ) {
      this.phalange1.rotation.copy( this.fingerRot[ this.index ] )
    } else {
      this.phalanges.rotation.copy( this.fingerRot[ this.index ] )
    }

    if ( this.isIndex ) {
      this.updateMatrixWorld()
      this.phalanges.updateMatrixWorld()
      this.phalange1.updateMatrixWorld()
      this.saltPosition = new THREE.Vector3().setFromMatrixPosition( this.phalange2.matrixWorld )
    }
  }

  initThumb () {
    this.isThumb = true
    // this.rotation.z = -Math.PI / 2
    // this.rotation.y = Math.PI / 4
    this.length = fingerLength * 0.95
    this.width = fingerWidth * 1.1
    this.p2xRot = Math.PI / 3
  }

  initIndex () {
    this.isIndex = true
  }

  initFuck () {
    this.isFuck = true
    this.length = fingerLength * 1.1
    this.p2xRot = Math.PI / 3
  }

  initRing () {
    this.isRing = true
    this.p2xRot = Math.PI / 2
  }

  initPinky () {
    this.isPinky = true
    this.length = fingerLength * 0.9
    this.width = fingerWidth * 0.8
    this.p2xRot = Math.PI / 2
  }

  update ( t ) {
    if ( this.isThumb ) {
      this.phalanges.rotation.y = Math.sin( 0.02 * t ) / 16 + this.fingerRot[this.index].y
      this.phalanges.rotation.x = Math.sin( 0.025 * t ) / 10 + this.fingerRot[this.index].x
      // this.phalange2.rotation.x = Math.cos( 0.002 * t ) / 10 + Math.PI / 3
    }
    if ( this.isIndex ) {
      this.phalanges.rotation.x = Math.sin( 0.02 * t ) / 16
      this.phalange2.rotation.x = Math.cos( 0.02 * t ) / 10 + Math.PI / 3
    }
    if ( this.isFuck ) {
      this.phalanges.rotation.x = Math.cos( 0.015 * t ) / 16
      this.phalange2.rotation.x = Math.sin( 0.01 * t ) / 10 + Math.PI / 3
    }
    if ( this.isRing ) {
      this.phalanges.rotation.x = Math.cos( 0.01 * t ) / 16 + this.fingerRot[this.index].x
      this.phalange2.rotation.x = Math.sin( 0.009 * t ) / 16 + Math.PI / 4
    }
    if ( this.isPinky ) {
      this.phalanges.rotation.x = Math.cos( 0.009 * t ) / 32 + this.fingerRot[this.index].x
      this.phalange2.rotation.x = Math.sin( 0.001 * t ) / 32 + Math.PI / 4
    }
  }
}

class Hand extends THREE.Object3D {
  constructor () {
    super()
    this.geometry = new THREE.BoxGeometry( handWidth - 5, handHeight, handHeight )
    this.material = new THREE.MeshPhongMaterial( {
      color: color
    } )
    this.fingers = []
    for ( let i = 0; i < 5; i++ ) {
      const finger = new Finger( i )
      this.fingers.push( finger )
      this.add( finger )
    }
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.add( this.mesh )
  }
  update ( t ) {
    for ( let i in this.fingers ) {
      this.fingers[i].update( t )
    }
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 1000 )
    this.camera.position.z = 200
    this.controls = new THREE.OrbitControls( this.camera )
    this.controls.minDistance = 50
    this.controls.maxDistance = 500
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setClearColor( 0xdd1021 )
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
    this.hand = new Hand()
    this.scene.add( this.hand )
    this.salts = new Salts( this.scene, this.hand.fingers[1].saltPosition )
    this.scene.add( this.salts )
  }
  initLights () {
    const ambientLight = new THREE.AmbientLight( 0xBBBBBB )
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
    this.hand.update( this.LAST_TIME )
    this.renderer.render( this.scene, this.camera )
    this.salts.update()
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
