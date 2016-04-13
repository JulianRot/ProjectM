
//------------------------------------------------------- VISIBILITY SETTINGS
var VS = {
	// DISPLAY PREVIEW MESH DURING POPULATION
	populationPreview : true,
	// DISPLAY FINAL GEOMETRY 
	finalVisibility : "ALL" // ALL, FRAME, OUTLINE, OPENING, JOINTS, FO
};

//------------------------------------------------------- GLOBAL PARAMETERS
var GP = {
	// GRAVITY
	gravity : new THREE.Vector3(0,-1,0),
	gravityMag : 0.05,

	// POPULATION RELATED
	birthcount : 0,
	maxBirthRate : 3,
	maxTetCount : 100,
	populationStrategy : "LOAD"
};

//------------------------------------------------------- ALL VARIABLE FOR AGENT CONTROL
var AC = {
	// CLOSE AGENTS
	ca_Radius: 500,
	// CREATE TET
	ct_minDist: 100,
	ct_maxDist: 400,
	ct_Mag: 10,
	// COHESION SEPARATION
	cs_cohRad:400,
	cs_sepRad:200,
	cs_cohMag:1.25,
	cs_sepMag:3.5,
	// LIMIT TO PLANES
	lp_Rad:100,
	lp_Mag:3.0,
	lp_PlaneMag:1.25,
	// CLOSEST TET
	clt_Mag:1.25,
	clt_maxRad:400,
	clt_minRad:200,
	// ENVIRONMENT
	ec_Rad: 200,
	ec_Mag: 0.25,
	// TET FORCES
	edgeLengthOpti: 2,
  edgeAngleOpti: 2,
  edgeFaceOpti: 0.75,
  viscosity : 0.35,
  avoidPenetration : 0,
  // MOVE
  m_treshold: 0.75,
  m_speedLimit:5.0,
  // POPULATION 
  distanceFactor : 0.9,
  createTet : true,
  p_fillTet : true,
  p_mergeAgents : true,
  p_mergeDistance : 3,
  p_FacesToUse : "UNLOCKED" // "FREE" || "UNLOCKED"
};

//------------------------------------------------------- ALL VARIABLE FOR TET AGENT CONTROL
var TC = {
	stableThreshold: 0.9,
	// EDGE OPTIMISATION
	eo_sepMag: 3.5,
	eo_cohMag: 1.25,
	apomixis : false,
	tetFilter : 2,
	growthDirection : new THREE.Vector3(0.5,-1,0),
	meiosis : false,
	growthStyle : "BRANCH" // BRANCH , CENTRAL
};

//------------------------------------------------------- FABRICATION SETUP
var FS = {
  unfoldingMethode : "GLOBAL", // LOCAL || GLOBAL
  unfoldingNormal : new THREE.Vector3(0,1,0),
  unfoldingTarget : new THREE.Vector3(0,0,0),
  unfoldingArrayX : 10,
  unfoldingScene : "scene",
  unfoldFrame : true,
  offsetX : new THREE.Vector3(500,0,0),
  count : 0,
};

//------------------------------------------------------- MORPHOSPACE
var morphospace = {
	minFaceAngle: 30,
	maxFaceAngle: 110,	

	minEdgeAngle: 45,
	maxEdgeAngle: 80,
	
	minEdgelength: 300,
	maxEdgelength: 400,

	bendingRad: 25,	
	matThickness: 1.0,

	openingOffset : 20,
	filletOffset : 20,
	jointOffset : 5,
	curveRes : 30
};

// var morphospace = {
// 	minFaceAngle: 30,
// 	maxFaceAngle: 110,	

// 	minEdgeAngle: 45,
// 	maxEdgeAngle: 80,
	
// 	minEdgelength: 350,
// 	maxEdgelength: 420,

// 	bendingRad: 27.5,	
// 	matThickness: 1.0,

// 	openingOffset : 40,
// 	filletOffset : 20,
// 	jointOffset : 5,
// 	curveRes : 30
// };

//------------------------------------------------------- COLORS
var mc = {
  myBlack:    new THREE.Color("rgb(5,5,5)"),
  myWhite:    new THREE.Color("rgb(253,253,253)"),

  myGreyB:     new THREE.Color("rgb(240,240,240)"),
  myGrey:     new THREE.Color("rgb(180,180,180)"),
  myGreyM:     new THREE.Color("rgb(120,120,120)"),
  myGreyD:     new THREE.Color("rgb(60,60,60)"),

  myGreen:    new THREE.Color("rgb(179,204,87)"),
  myGreenD:   new THREE.Color("rgb(126,163,57)"),
  myGreenB:   new THREE.Color("rgb(214,233,122)"),

  myBlueB:      new THREE.Color("rgb(74,175,205)"),
  myBlueD:    new THREE.Color("rgb(0,92,129)"),
  
  myPurpleD:    new THREE.Color("rgb(102,0,102)"),
  myPurpleB:    new THREE.Color("rgb(204,0,204)"),

  myRed:      new THREE.Color("rgb(226,77,53)"),
  myRedD:     new THREE.Color("rgb(191,42,43)"),
  myRedB:     new THREE.Color("rgb(255,121,87)")
};

//------------------------------------------------------- MATERIAL LIBRARY
var ml = {
	// MESH MATERIAL
	solid_redD : new THREE.MeshBasicMaterial( { color: mc.myRedD } ),
	solid_redB : new THREE.MeshBasicMaterial( { color: mc.myRedB } ),
	solid_white : new THREE.MeshBasicMaterial( { color: mc.myWhite } ),
	solid_greyB : new THREE.MeshBasicMaterial( { color: mc.myGreyB } ),

	// MESH WIRE MATERIAL
	wire_redD : new THREE.MeshBasicMaterial( { color: mc.myRedD, wireframe : true } ),
	wire_redB : new THREE.MeshBasicMaterial( { color: mc.myRedB, wireframe : true } ),
	wire_greenD : new THREE.MeshBasicMaterial( { color: mc.myGreenD, wireframe : true } ),
	wire_greenB : new THREE.MeshBasicMaterial( { color: mc.myGreenB, wireframe : true } ),
	wire_blueD : new THREE.MeshBasicMaterial( { color: mc.myBlueD, wireframe : true } ),
	wire_blueB : new THREE.MeshBasicMaterial( { color: mc.myBlueB, wireframe : true } ),
	wire_purpB : new THREE.MeshBasicMaterial( { color: mc.myPurpleB, wireframe : true } ),
	wire_purpD : new THREE.MeshBasicMaterial( { color: mc.myPurpleD, wireframe : true } ),
	wire_greyM : new THREE.MeshBasicMaterial( { color: mc.myGreyM, wireframe : true } ),
	wire_greyB : new THREE.MeshBasicMaterial( { color: mc.myGreyB, wireframe : true } ),
	wire_grey : new THREE.MeshBasicMaterial( { color: mc.myGrey, wireframe : true } ),

	// LINE MATERIAL
	line_grey : new THREE.LineBasicMaterial( { color : mc.myGrey, linewidth  : 1 } ),
	line_greyB : new THREE.LineBasicMaterial( { color : mc.myGreyB, linewidth  : 1 } ),
	line_greyD : new THREE.LineBasicMaterial( { color : mc.myGreyD, linewidth  : 1 } ),
	line_blueD : new THREE.LineBasicMaterial( { color : mc.myBlueD, linewidth  : 1 } ),
	line_blueB : new THREE.LineBasicMaterial( { color : mc.myBlueB, linewidth  : 1 } ),
	line_red : new THREE.LineBasicMaterial( { color : mc.myRed, linewidth  : 1 } ),

	// POINTS MATERIAL
	points_50_greyD :  new THREE.PointsMaterial( {color: mc.myGreyD, size: 50, sizeAttenuation: true} ),
	points_10_blueD :  new THREE.PointsMaterial( {color: mc.myBlueD, size: 10, sizeAttenuation: true} ),
	points_10_blueB :  new THREE.PointsMaterial( {color: mc.myBlueB, size: 10, sizeAttenuation: true} ),
	points_10_purpD :  new THREE.PointsMaterial( {color: mc.myPurpleD, size: 10, sizeAttenuation: true} ),
	points_10_greenD :  new THREE.PointsMaterial( {color: mc.myGreenD, size: 10, sizeAttenuation: true} ),
	points_40_redB :  new THREE.PointsMaterial( {color: mc.myRedB, size: 40, sizeAttenuation: true} ),
	points_Envi :  new THREE.PointsMaterial( {color: mc.myRedD, size: 35, sizeAttenuation: true} ),
};