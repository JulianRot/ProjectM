//----------------------------------------------------------------------------- VARIABLES
// CLASSES
var myAgentSystem, 
    myEnvironment,  
    myPlane;

// LAYERS
var PREVIEW,
    WALL,
    CPLANES,
    ENVIRONMENT;

var SELECTABLE;

// UI attributes
var X = 5000,
    Y = 5000,
    Z = 5000;

// CAMERA ATRIBUTES
var VIEW_ANGLE = 35,
  ASPECT = 16/9,
  NEAR = 1,
  FAR = 1000000;

// CANVAS ELEMENTS
var domContainer,
  viewport,
  scene, 
  camera,
  dirLight1, 
  dirLight2, 
  hemiLight, 
  renderer, 
  stats;

// EVENTS
var bakeFlag = false;
var playFlag = false;

// POPULATION
var populationFlag = false;
var genCount = 0;
var iCounter = 0;
var genStep = 200;
var stoptime = 4000;

// SELECT ELEMENTS
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var intersectedObjs;
var refPlane;

var offset = new THREE.Vector3();
var objects = [];
var INTERSECTED, SELECTED;

var viewportH = 0, viewportW = 0;

// CONTROLS
var cameraCntrl,
    orientCntrl,
    transformCntrl;

//UI ELEMENTS
var outliner;

//----------------------------------------------------------------------------- LET IT RUN !!!
loadScene();
init();
animate();

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------- INIT
function init(){


  initProgram();
  initEvents();
  initClasses();

  initButtons();
  console.log(scene);
}// end init

//----------------------------------------------------------------------------- ANIMATE
function animate () {
  // ------------------------------------------------------ UI
  requestAnimationFrame( animate );  

  // UPDATE CONTROLS
  cameraCntrl.update();
  orientCntrl.update();
  transformCntrl.update();

  var v = new THREE.Vector3(0,0,1).applyQuaternion(refPlane.quaternion);
  // document.getElementById("OutlinerM").innerHTML = ( v.x +"<br> "+ v.y +"<br> "+ v.z );


  popGenCounter();
  // ------------------------------------------------------ RUN CLASSES
  myAgentSystem.run();
  myEnvironment.run();
  // ------------------------------------------------------ RENDER
  render();
  stats.update();

  // ------------------------------------------------------ TIMER
  timer();
}// end animate

// ---------------------------------------------------------------------------- RENDER
function render() {
  // renderer.autoClear = true;
  // renderer.clear();
  // renderer.clearDepth();
  // renderer.shadowMap.cullFace = THREE.CullFaceBack;

  renderer.render( scene, camera );
  //
}// end render

// ---------------------------------------------------------------------------- INIT PROGRAM
function initProgram(){

  // ---------------------------------- GET DOM ELEMENTS
  outliner = document.getElementById( 'Outliner');
  domContainer = document.getElementById( 'domContainer' );
  viewport = document.getElementById( 'Viewport');

  // ---------------------------------- RENDERER
  renderer = new THREE.WebGLRenderer( {antialias:true} );
  renderer.setPixelRatio( window.devicePixelRatio );
  // renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setSize( viewport.offsetWidth, viewport.offsetHeight );
  renderer.setClearColor( mc.myWhite );

  console.log(viewport);

  domContainer.appendChild( renderer.domElement );

  // ---------------------------------- SCENE + CAMERA
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE,viewport.offsetWidth / viewport.offsetHeight, NEAR, FAR );
  camera.position.x = X*3;
  camera.position.y = Y*1.25;
  camera.position.z = Z*0.5;
  camera.lookAt(new THREE.Vector3(X/2,Y/2,Z/2));
  scene.add(camera);
  
  // ---------------------------------- LIGHT
  hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
  hemiLight.color.setHSL( 1.59, 1, 0.95 );
  hemiLight.groundColor.setHSL( 0.16, 0.67, 1 );
  hemiLight.position.set( 0, Y, 0 );
  scene.add( hemiLight );

  dirLight1 = new THREE.DirectionalLight( mc.myWhite, 1 );
  dirLight1.color = ( mc.myWhite );
  dirLight1.position.set( X*0.5, Y*0.8, Z );
  dirLight1.castShadow = true;
  scene.add( dirLight1 );

  dirLight2 = new THREE.DirectionalLight( mc.myWhite, 1);
  dirLight2.color = ( mc.myWhite );
  dirLight2.position.set( X*0.5, Y*0.8, -Z );
  dirLight2.castShadow = true;
  scene.add( dirLight2 );



  // ---------------------------------- INIT LAYER OBJECTS
  WALL = new THREE.Object3D();
  WALL.name = "WALL";
  scene.add(WALL);

  PREVIEW = new THREE.Object3D();
  PREVIEW.name = "PREVIEW";
  scene.add(PREVIEW);

  ENVIRONMENT = new THREE.Object3D();
  ENVIRONMENT.name = "ENVIRONMENT";
  scene.add(ENVIRONMENT);

  CPLANES = new THREE.Object3D();
  CPLANES.name = "CPLANES";
  scene.add(CPLANES);

  // ---------------------------------- GUI
  spaceCube();
  initGUI();

  // ---------------------------------- HELPER OBJECTS
  // REFRENCE PLANE FOR DRAG OBJECTS
  refPlane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry( 5000, 5000, 8, 8),
  new THREE.MeshBasicMaterial( {color: 0xfffff ,visible : true, transparent: true, opacity: 0.2})
  );
  refPlane.material.side = THREE.DoubleSide;
  // scene.add(refPlane);

  // ---------------------------------- CONTROLS
  cameraCntrl = new THREE.TrackballControls( camera, renderer.domElement );
  orientCntrl = new THREE.DeviceOrientationControls( refPlane );

  transformCntrl = new THREE.TransformControls( camera, renderer.domElement);
  transformCntrl.size = 0.5;
  transformCntrl.renderOrder = 10;
  transformCntrl.attach(refPlane);
  scene.add(transformCntrl);
  // console.log(transformCntrl);

}// end initProgram

// ---------------------------------------------------------------------------- INIT CLASSES
function initClasses(){

  myEnvironment = new Environment();

  var o1 = new THREE.Vector3(X/2,100,Z/2);
  var n1 = new THREE.Vector3(0,1,0);
  myPlane1 = new cPlane(o1,n1.setLength(1));
  // myPlane1.sizeX = 1250;
  // myPlane1.sizeY = 500;
  myPlane1.sizeX = 2500;
  myPlane1.sizeY = 500;
  myPlane1.usage = "Bottom-Plane";
  myPlane1.init();

  var o2 = new THREE.Vector3(X/2,1500,Z/2);
  // var n2 = new THREE.Vector3(0.0,-1,0.0);
  var n2 = new THREE.Vector3(0.2,-1,0.3);
  myPlane2 = new cPlane(o2,n2.setLength(1));
  // myPlane2.sizeX = 1250;
  // myPlane2.sizeY = 500;
  myPlane2.sizeX = 2500;
  myPlane2.sizeY = 500;
  myPlane2.usage = "Top-Plane";
  myPlane2.init();

  var o3 = new THREE.Vector3(X/2+600,200,Z/2 + 1600);
  var n3 = new THREE.Vector3(0,0.5,-1);
  myPlane3 = new cPlane(o3,n3.setLength(1));
  myPlane3.sizeX = 800;
  myPlane3.sizeY = 400;
  myPlane3.init();

  var o4 = new THREE.Vector3(X/2-600,1500,Z/2 - 1000);
  var n4 = new THREE.Vector3(0,-0.5,1);
  myPlane4 = new cPlane(o4,n4.setLength(1));
  myPlane4.sizeX = 800;
  myPlane4.sizeY = 400;
  myPlane4.init();

  myEnvironment.addCPlane(myPlane1);
  myEnvironment.addCPlane(myPlane2);
  myEnvironment.attractorPlanes.push(myPlane3);
  myEnvironment.attractorPlanes.push(myPlane4);

  myAgentSystem = new AgentSystem();
  myAgentSystem.init( myEnvironment );
  myAgentSystem.cPlanes.push(
    myPlane1,
    myPlane2
    );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  domContainer.appendChild( stats.domElement );

  // spaceCube();
}// end initClasses

// ---------------------------------------------------------------------------- POP GEN COUNTER
function popGenCounter(){
  if (iCounter % genStep == 0 && genCount < 500){
    populationFlag = true;
    genCount++;
  }
  else{
    populationFlag = false;
  }
  iCounter++;
}// end popGenCounter