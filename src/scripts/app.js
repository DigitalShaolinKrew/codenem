import '../styles/app.scss'
require( './utils' )

const Mouse = { x: 0, y: 0, nX: 0, nY: 0, dir: 0, angle: 0 }
const Window = { w: window.innerWidth, h: window.innerHeight }
const ToRad = 0.0174532925199432957
const size = 20
const colors = [
  0xFFC9F6,
  0xFFDBC9,
  0xFFF3C9,
  0xC9FFF0,
  0xE9C9FF
]

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

class Sphere extends THREE.Object3D {
  constructor ( name, color ) {
    super()
    this.name = name
    this.isSliced = false
    this.geometry = new THREE.SphereGeometry( 1, 16, 16 )
    this.material = new THREE.MeshStandardMaterial( {
      color: color,
      roughness: 0.6,
      metalness: 0.4,
      side: THREE.DoubleSide
    } )
    this.initSlices()
  }

  initSlices () {
    const geom1 = new THREE.SphereGeometry( 1, 16, 16, Math.PI / 2, Math.PI )
    const geom2 = new THREE.SphereGeometry( 1, 16, 16, 3 * Math.PI / 2, Math.PI )
    this.slice1 = new THREE.Mesh( geom1, this.material )
    this.slice2 = new THREE.Mesh( geom2, this.material )
    this.slice1.scale.set( size, size, size )
    this.slice2.scale.set( size, size, size )
    // this.slice1.rotation.x = Math.PI / 2
    // this.slice2.rotation.x = Math.PI / 2
    this.add( this.slice1 )
    this.add( this.slice2 )
  }

  update () {
    // this.rotation.y += 0.01
    // this.slice1.rotation.y += 0.01
    // this.slice1.rotation.x -= 0.01
  }

  rotate ( angles ) {
    const angle = ( angles.y < 0 ) ? -angles.x : angles.x
    this.slice1.rotation.z = angle
    this.slice2.rotation.z = angle
  }
}

class Physics {
  constructor ( scene ) {
    this.bodys = []
    this.meshes = []

    this.scene = scene
    this.world = new OIMO.World( { info: true, worldscale: 100 } )
    this.world.gravity = new OIMO.Vec3( 0.5, -25, 0.5 )
    this.ground = this.world.add( { size: [ 1000, 10, 1000 ], pos: [ 0, -500, 0 ], rot: [ 0, 0, 0 ], world: this.world } )
  }

  addPlatform ( position ) {
    this.platform = this.world.add( { size: [ 1, 1, 1 ], pos: [ position.x + 1, -14, position.z ], rot: [ 0, 90, 0 ], world: this.world } )
    // this.addStaticBox( [ 10, 250, 10 ], [ position.x, -200, position.z ], [ 0, 0, 0 ] )
  }

  addShape ( mesh, direction ) {
    const width = mesh.scale.x
    const body = this.world.add( { type: [ 'sphere' ],
      size: [ width, width, width ],
      pos: [ mesh.position.x, mesh.position.y, mesh.position.z ],
      rot: [ 0, 0, mesh.rotation.z * 180 / Math.PI ],
      move: true,
      world: this.world
    } )
    console.log( 'bodyyyyyyyyyyyyyyyyyyy', body )
    this.bodys.push( body )
    this.meshes.push( mesh )
  }

  addStaticBox ( size, position, rotation ) {
    const geo = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry( 1, 1, 1 ) )
    var mesh = new THREE.Mesh( geo )
    mesh.scale.set( size[0], size[1], size[2] )
    mesh.position.set( position[0], position[1], position[2] )
    mesh.rotation.set( rotation[0] * ToRad, rotation[1] * ToRad, rotation[2] * ToRad )
    this.scene.add( mesh )
    mesh.castShadow = true
    mesh.receiveShadow = true
  }

  addForce ( mesh ) {
    console.log( 'ADD FORCE' )
    this.force = this.world.add( { type: 'box', size: [ 10 ], pos: [ mesh.position.x, 50, mesh.position.z ], move: true, world: this.world, density: 10 } )
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
    // if ( this.force ) {
    //   console.log( this.force.getPosition() )
    // }
  }
}

class Xp {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 45, Window.w / Window.h, 1, 5000 )
    this.camera.position.z = 500
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setSize( Window.w, Window.h )
    dom.select.one( '.app' ).appendChild( this.renderer.domElement )
    this.timer = dom.select.one( '.timer__second' )
    this.DELTA_TIME = 0
    this.LAST_TIME = Date.now()
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = 1000
    this.intersectables = []
    this.physics = new Physics( this.scene )
    this.sphereCount = 5
    this.spheres = []
    this.startTime = 0
    this.endTime = 0
    this.end = false
    this.bind()
    this.initLights()
    this.initMeshes()
  }
  bind () {
    [ 'update', 'resize', 'click' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  initMeshes () {
    for ( let i = 0; i < this.sphereCount; i++ ) {
      const s = new Sphere( 'sphere' + i, colors[i] )
      s.position.x = i * -75 + 150
      this.spheres.push( s )
      this.intersectables.push( s.slice1 )
      this.intersectables.push( s.slice2 )
      this.scene.add( s )
      this.physics.addPlatform( s.position )
    }
  }
  initLights () {
    const ambientLight = new THREE.AmbientLight( 0x666666 )
    this.scene.add( ambientLight )

    const light = new THREE.DirectionalLight( 0xDDDDDD )
    light.position.set( 100, 100, 100 )
    this.scene.add( light )
  }
  update () {
    // if ( this.raycasting ) {
    this.raycast()
    // }
    this.physics.update()
    for ( let i = 0; i < this.spheres.length; i++ ) {
      this.spheres[i].update()
    }
    if ( this.startTime && !this.end ) {
      this.endTime = Math.abs( ( this.LAST_TIME - this.startTime ) / 1000 )
      this.timer.innerHTML = this.endTime
    }
    this.endTime = this.LAST_TIME - this.startTime
    if ( this.sphereCount === 0 && !this.end ) {
      this.end = true
    }
    this.DELTA_TIME = Date.now() - this.LAST_TIME
    this.LAST_TIME = Date.now()
    this.renderer.render( this.scene, this.camera )
  }
  resize () {
    this.camera.aspect = Window.w / Window.h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( Window.w, Window.h )
  }

  raycast () {
    this.mouse = new THREE.Vector2()
    this.mouse.x = Mouse.nX
    this.mouse.y = Mouse.nY
    this.raycaster.setFromCamera( this.mouse, this.camera )
    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects( this.intersectables )
    if ( intersects.length > 0 ) {
      this.intersects = intersects
      // console.log( '%%%%%%%%%%%%%%%%%%%%%%% intersecting', intersects[0].object.parent.name )
    }
  }
  click ( angles ) {
    console.log( 'click' )
    if ( this.intersects.length > 0 && !this.intersects[0].object.parent.isSliced ) {
      const sphere = this.intersects[0].object.parent
      const index = this.intersectables.indexOf( sphere.children[0] )
      if ( index > -1 ) {
        this.intersectables.splice( index, 1 )
      }
      console.log( this.intersectables )
      sphere.isSliced = true
      if ( this.sphereCount === this.spheres.length ) {
        this.startTime = Date.now()
      }
      this.sphereCount--
      sphere.rotate( angles )
      this.physics.addShape( sphere.slice1, -1 )
      this.physics.addShape( sphere.slice2, 1 )
      this.physics.addForce( sphere.slice1 )
    }
  }
}

class App {
  constructor () {
    this.bind()
    this.addListeners()
    this.xp = new Xp()
  }
  bind () {
    [ 'onResize', 'onMouseMove', 'update', 'onClick', 'onRelease' ]
      .forEach( ( fn ) => this[ fn ] = this[ fn ].bind( this ) )
  }
  addListeners () {
    const wrapper = dom.select.one( '.app' )
    dom.events.on( window, 'resize', this.onResize )
    dom.events.on( wrapper, 'mousemove', this.onMouseMove )
    dom.events.on( wrapper, 'touchmove', this.onMouseMove )
    dom.events.on( wrapper, 'mousedown', this.onClick )
    dom.events.on( wrapper, 'touchstart', this.onClick )
    dom.events.on( wrapper, 'mouseup', this.onRelease )
    dom.events.on( wrapper, 'touchend', this.onRelease )
  }
  init () {
    this.loader = new Loader()
    this.loader.init()
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
  }
  onClick ( e ) {
    if ( !this.clicked ) {
      this.clicked = true
      this.mouse1 = {
        x: e.clientX,
        y: e.clientY
      }
      console.log( this.mouse1 )
    }
  }
  onRelease () {
    this.clicked = false
    this.mouse2 = Mouse
    const angles = this.getAngles( this.mouse1.x, this.mouse1.y, this.mouse2.x, this.mouse2.y )
    console.log( 'angle : ', angles )
    this.xp.click( angles )
  }
  update () {
    this.xp.update()
    raf( this.update )
  }
  getAngles ( x1, y1, x2, y2 ) {
    const distY = y2 - y1
    const distX = x2 - x1
    const dist = Math.sqrt( ( distY * distY ) + ( distX * distX ) )
    const valX = distX / dist
    const valY = distY / dist
    const aSineX = isNaN( Math.asin( valX ) ) ? 0 : Math.asin( valX )
    const aSineY = isNaN( Math.asin( valY ) ) ? 0 : Math.asin( valY )
    return { x: aSineX, y: aSineY }
  }
}

const ShaolinApp = new App()

dom.events.on( window, 'DOMContentLoaded', () => {
  ShaolinApp.init()
} )
