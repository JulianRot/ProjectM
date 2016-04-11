TetAgent = function (_agents) {

	this.ID;
	this.agents = _agents;
	this.faceVertexIndex =  [
														[0,1,2],
												    [1,2,3],
												  	[0,2,3],
												    [0,1,3]
   												];

  this.occupiedFaces = [];
  // TETS CAN HAVE DIFFERENT MORPHOSPACES
  this.ms = morphospace;

  //SAME ORDER AS FACES
  this.neighbours = [0, 0, 0, 0];
 
  // STATES AND THRESHOLDS
  this.stable = true;
  this.stableSteer = [0,0,0];
  this.lifeTime = 0;

  this.previewObj = null;

  // CONNECTED POLY AGENT
  this.poly = null;

  // FABRICATION GEOMETRY
	this.fg = {
		// NESTED ARRAYS; ACCORDINGLY TO FACES
		// FRAME : [ FACE1: [P1,P2,P3]; FACE2: [P1,P2,P3]; ...]
		frame : [],
		outline : [],
		opening : [],
		joints : [],

		normals : [],
		faceVertIdx : [],

		frameGeo : null,
		outlineGeo : null,
		openingGeo : null,
		jointsGeo : null,

		// NESTED ARRAYS; ACCORDINGLY TO UNFOLDING GROUPS
		facePairs : [],
		faceGroups : [],
		facePairLevels : [],
		faceGroupLevels : [],

		stripes : [],
	};

	// UNFOLDED GEOMETRY
	this.ug = {
		stripes : []
	};
}

TetAgent.prototype = {

	constructor : TetAgent,

  //------------------------------------------------------- GET INIT
  init : function(){

  	// REGISTER NEIGHBOUR
  	var na = [], fvi = [], sna, sfvi, string;
  	for (var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++) {
  		
  		var tempTet = myAgentSystem.tetAgents[i]
  		
  		// SEARCH FOR SHARED NEIGHBOUR AGENTS
  		na = [];
  		fvi = [];
  		for (var j = 0, jl = this.agents.length; j < jl; j++) {
  			var idx = tempTet.agents.indexOf(this.agents[j]);
  			if( idx != -1){
  				na.push( idx );
  				fvi.push( j );
  			}
  		}

  		// CHECK IF NEIGHBOUR
  		if ( na.length == 3) {

  			na.sort( function(a,b){return a - b;} );
  			sna = na.toString();
  			sfvi = fvi.toString();

  			for (var k = 0, kl = this.faceVertexIndex.length; k < kl; k++) {
  				string = this.faceVertexIndex[k].toString();

  				// REGISTER AS NEIGHBOUR
  				if (sna == string && tempTet.neighbours.indexOf(this) == -1) {
  					tempTet.occupiedFaces.push(k);
  					tempTet.neighbours[k] = this;
  				}
  				// REGISTER NEIGHBOUR
  				if (sfvi == string && this.neighbours.indexOf(tempTet) == -1) {
  					this.occupiedFaces.push(k);
  					this.neighbours[k] = tempTet;
  				}
  			}
  		}
  	}

  	// CREATE ID
  	this.ID = this.getCheckSum();

  	// REGISTER IN AGENTSYSTEM
  	if (myAgentSystem.tetAgents.indexOf( this ) == -1) {
	  	myAgentSystem.tetAgents.push(this);
	  	myAgentSystem.tetAgentsCheckSum.push( this.ID );
  	}

  	// REGISTER ISTSELF IN ALL ITS AGENTS
  	for (var i = 0, il = this.agents.length; i < il; i++) {
  		if (this.agents[i].connectedTet.indexOf(this) == -1) {
  			this.agents[i].connectedTet.push(this);
  		}
  	}

  	// SET STABLE VALUE TO ANY VALUE TO AVOID DELETION IN FIRST ITERATION
  	this.stableSteer = [999,999,999];

  	// DISPLAY PREVIEW
  	if (this.previewObj == null 
  		&& VS.populationPreview == true) {
  		this.displayPreview();
  	}

  },// end init

  //------------------------------------------------------- GET INIT
  run : function(){
  	// CHECK IF TET-AGENT IS STABLE
  	this.isStable();
  	this.lifeTime++;

  	// // CONDITION & ACTION
  	// if (this.occupiedFaces.length == 1 && this.poly == null) {
  	// 	if (this.neighbours[ this.occupiedFaces[0] ].poly == null) {
  	// 		var newPoly = new PolyAgent();
  	// 		newPoly.addTetAgent( this );
  	// 		newPoly.addTetAgent( this.neighbours[ this.occupiedFaces[0] ] );
  	// 		newPoly.init();
  	// 		// console.log(newPoly);
  	// 	}
  	// }

  	// CONDITION & ACTION
  	if (this.occupiedFaces.length == 1 && this.poly == null) {
  		for (var i = 0, il = this.occupiedFaces.length; i < il; i++) {
  			var normal = this.getFaceNormal(this.occupiedFaces[i]);
  			var angle = degrees( normal.angleTo( new THREE.Vector3(0,1,0 ) ) );

  			if (this.neighbours[ this.occupiedFaces[0] ].poly == null && (angle <= 75 || angle >=180-75  ) ) {
	  			var newPoly = new PolyAgent();
	  			newPoly.addTetAgent( this );
	  			newPoly.addTetAgent( this.neighbours[ this.occupiedFaces[0] ] );
	  			newPoly.init();
	  			break;
	  		}
  		}
  	}

  	// POPULATION METHODS
  	this.apomixis();
  	this.meiosis();

  	// UPDATE PREVIEW
		if (this.previewObj !== null) {
			this.previewObj.geometry.verticesNeedUpdate = true;
			// normalsByCentre( this.previewObj.geometry );
			// this.previewObj.geometry.normalsNeedUpdate = true;
		}

		// UPDATE RELATIONS TO OTHER TET-AGENTS
  	this.init();
  },// end run

  //------------------------------------------------------- APOMIXIS
  apomixis : function(){
  	// ASEXUAL REPRODUTCTION BY USING JUST ONE TET-AGENT
  	// CONDITION

  	// console.log( this.stable, this.occupiedFaces.length <= TC.tetFilter, birthcount < maxBirthRate );
  	// console.log( TC.apomixis );
  	if ( 			this.stable == true 
  				&& 	(this.occupiedFaces.length <= TC.tetFilter || GP.birthcount == 0)
  				&& 	GP.birthcount < GP.maxBirthRate
  				&& 	TC.apomixis == true) {

  		// GET UNOCCUPIED FACES
  		// var fid = this.getFreeFaceIdx();
  		var fid = this.getBestFreeFaceIDX();

  		if ( fid != null ) {
	  		// GET FACE AGENTS & FACE CENTRE & FACE NORMAL
	  		var fa = this.getFaceAgents( fid );
	  		var fc = this.getFaceCentre( fid );
	  		var fn = this.getFaceNormal( fid );

	  		var pvec1 = myEnvironment.bottomPlane.plane.orthoPoint(fc);
		  	var pvec2 = myEnvironment.topPlane.plane.orthoPoint(fc);
		  	var pvec = (pvec1.length() < pvec2.length()) ? pvec1 : pvec2;


	  		// CONSIDRE PREFERED GROWTH DIRECTION
	  		if ( (fn.dot(TC.growthDirection) >= 0 || myAgentSystem.tetAgents.length <= 2 || GP.birthcount == 0)
	  					&& (pvec.length() > this.ms.minEdgelength * 0.5) ) {

		  		// POP NEW AGENT & NEW TET AGENT
		  		var location = fc.add( fn.multiplyScalar(this.ms.minEdgelength * 0.1) );
		  		var ag = myAgentSystem.popOne(location);
		  		fa.push(ag);
		  		var tag = new TetAgent( fa );
		  		tag.ms = this.ms;
		  		tag.init();

		  		tag.edgeOptimisation(ag);
		  		tag.edgeAngleOptimisation(ag);
		  		tag.faceAngleOptimisation(ag);
		  		GP.birthcount++;

		  		var cnt = tag.getCentre();
		  		pvec1 = myEnvironment.bottomPlane.plane.orthoPoint(cnt);
		  		pvec2 = myEnvironment.topPlane.plane.orthoPoint(cnt);
		  		pvec = (pvec1.length() < pvec2.length()) ? pvec1 : pvec2;

		  		if (pvec.length() > this.ms.minEdgelength * 1 && pvec.length() < this.ms.maxEdgelength) {
		  			tag.apomixis();
		  		}

		  	}
	  	}
  	}
  },// end apomixis

  //------------------------------------------------------- MEIOSIS
  meiosis : function(){

  	// SUBDEVIDE TET AGENT
  	if ( 			this.stable == true 
			&& 	this.occupiedFaces.length <= 4
			&& 	TC.meiosis == true) {

  		var fid = this.getBestFreeFaceIDX();

  		if ( fid != null) {
  			// GET FACE AGENTS & FACE CENTRE & FACE NORMAL
	  		var fa = this.getFaceAgents( fid );
	  		var fc = this.getFaceCentre( fid );
	  		var fn = this.getFaceNormal( fid );

	  		var connectedFaces = [];
	  		for (var i = 0; i < this.occupiedFaces.length; i++) {
	  			var tempFa = this.neighbours[ this.occupiedFaces[i] ].getFaceFromSharedPoints(fa);
	  			if ( tempFa != null ) {
	  				connectedFaces.push( tempFa );
	  			}
	  		}

	  		if (connectedFaces.length != 0 ) {

	  			var tempfc = new THREE.Vector3().copy( connectedFaces[0][0].loc );

	  			// GET SHARED POINTS
	  			var sharedAIdx = [];
	  			for (var i = 0; i < fa.length; i++) {
	  				if( connectedFaces[0].indexOf[fa[i]] != -1) sharedAIdx.push(i);
	  			}

	  			var loc1 = fc.add( fn.setLength(this.ms.minEdgelength * 0.1) );
	  			var loc2 = tempfc.add( fn.setLength(this.ms.minEdgelength * 0.1) );

	  			var ag1 = myAgentSystem.popOne(loc1);
	  			var ag2 = myAgentSystem.popOne(loc2);

	  			fa.push(ag1);
	  			connectedFaces[0].push(ag2);
	  			var third = [ fa[sharedAIdx[0]], fa[sharedAIdx[1]], ag1, ag2 ];


	  			var tag1 = new TetAgent( fa ); tag1.ms = this.ms; tag1.init();
	  			var tag2 = new TetAgent( connectedFaces[0] ); tag2.ms = this.ms; tag2.init();
	  			var tag3 = new TetAgent( third ); tag3.ms = this.ms; tag3.init();

	  			tag1.stableSteer = [999,999,999];
	  			tag2.stableSteer = [999,999,999];
	  			tag3.stableSteer = [999,999,999];
	  		}

  		}
  	}
  },// end mitosis

  //------------------------------------------------------- GET CENTRE
	getCentre : function(){
		var cntr = 	new THREE.Vector3(0,0,0).add(this.agents[0].loc)
																				.add(this.agents[1].loc)
																				.add(this.agents[2].loc)
																				.add(this.agents[3].loc)
																				.divideScalar(4);

		return cntr;
	},// end getCentre

  //------------------------------------------------------- GET CHECKSUM
	getCheckSum : function(){
		var cs = 0;
		cs += this.agents[0].ID;
		cs += this.agents[1].ID;
		cs += this.agents[2].ID;
		cs += this.agents[3].ID;
		return cs;
	},// end getCheckSum

  //------------------------------------------------------- GET FACES
	getFaces : function(){
		var faces = []

		for (var i = 0, il = this.faceVertexIndex.length; i < il; i++) {
			var f = new THREE.Face3( 	this.faceVertexIndex[i][0],
																this.faceVertexIndex[i][1],
																this.faceVertexIndex[i][2]
																);
			faces.push( f );
		}

		return faces;
	},// end getFaces

	//------------------------------------------------------- GET FACES AGENTS
	getFaceAgents : function( idx ){
		var a = [];

		a.push( this.agents[this.faceVertexIndex[ idx ][0]] );
		a.push( this.agents[this.faceVertexIndex[ idx ][1]] );
		a.push( this.agents[this.faceVertexIndex[ idx ][2]] );
		// console.log(a);
		return a;
	},// end getFaceAgents

	//------------------------------------------------------- GET FACES ANGLES
	getFaceAngles : function(){
		// ANGLE 0 : BTW F0 & F1
		// ANGLE 1 : BTW F1 & F2
		// ANGLE 2 : BTW F2 & F3
		// ANGLE 3 : BTW F3 & F0

		var normals = this.getFaceNormals();
		normals.push(normals[0]);

		var angles = [];
		for (var i = 0, il = normals.length - 1; i < il; i++) {
			
			var angle = normals[i].angleTo( normals[i+1] );
			angle = 180 - degrees(angle);
			angles.push( angle );
		}

		return angles;
	},// end getFaceAngles

	//------------------------------------------------------- CHECK USEFULLNES
	isUsefull : function(){
		var angles = this.getFaceAngles();
		var usefull = true;

		// console.log(angles);

		for (var i = 0, il = angles.length; i < il; i++) {
			if(angles[i] > this.ms.maxFaceAngle) usefull = false;
			// break;
		}

		return usefull;
	},// end checkUsefullness

	//------------------------------------------------------- CHECK IF STABLE
	isStable : function(){
		this.stable = true;

		for (var i = 0, il = this.stableSteer.length; i < il; i++) {
			if (this.stableSteer[i] > TC.stableThreshold) this.stable = false;
			break;
		}

		return this.stable;
	},// end isStable

	//------------------------------------------------------- CHECK IF A POINT IS INSIDE
	isPointInside : function( point ){
		var fid = this.getClosestFaceIdx( point );
		var fc = this.getFaceCentre( fid );
		var fn = this.getFaceNormal( fid );
		var inside = false;
		var vec = new THREE.Vector3().subVectors( point, fc);
		var dotFC = vec.dot(fn);

		if ( dotFC < -0.01 ) {
			inside = true;
			console.log("inside");
		}

		return [inside, fn];
	},//end isPointInside

	//------------------------------------------------------- GET LOCKED FACES
	getLockedFacesIdx : function(){

		var freeFacesIdx = this.getFreeFaceIdx();
		var normals = this.getFaceNormals();
		var g = new THREE.Vector3(0,-1,0);
		var lockedFaceIdx = [];

		for (var i = 0, il = freeFacesIdx.length; i < il; i++) {
			if( g.dot( normals[ freeFacesIdx[i] ] ) < 0){
				lockedFaceIdx.push( freeFacesIdx[i] );
			}
		}

		return lockedFaceIdx
	},// end getLockedFaces

	//------------------------------------------------------- GET UNLOCKED FACES
	getUnlockedFacesIdx : function( _plane ){

		var freeFacesIdx = this.getFreeFaceIdx();
		var normals = this.getFaceNormals();
		var g = new THREE.Vector3(0,-1,0);
		var unlockedFaceIdx = [];
		var plane = (_plane === undefined) ? myEnvironment.bottomPlane.plane : _plane;

		var center, dist;
		for (var i = 0, il = freeFacesIdx.length; i < il; i++) {
			// CHECK IF IN THE CORRECT DIRECTION
			if( g.dot( normals[ freeFacesIdx[i] ] ) > 0){

				center = this.getFaceCentre( [ freeFacesIdx[i] ] );
				dist = plane.distanceToPoint( center );

				// CHECK IF CLOSE TO PLANE
				if (dist > this.ms.minEdgelength * 0.5) {
					unlockedFaceIdx.push( freeFacesIdx[i] );
				}
			}
		}

		return unlockedFaceIdx
	},// end getLockedFaces

	//------------------------------------------------------- CHECK USEFULLNES
	removeTet : function(){

		var idx;
		// REMOVE FROM AGENTS
		for (var i = 0, il = this.agents.length; i < il; i++) {
			idx = this.agents[i].connectedTet.indexOf(this);
			this.agents[i].connectedTet.splice(idx,1);
		}

		// REMOVE FROM NEIGHBOURS
		for (var i = 0, il = this.neighbours.length; i < il; i++) {

			if (this.neighbours[i] != 0) {
				idx = this.neighbours[i].neighbours.indexOf(this);
				this.neighbours[i].neighbours[idx] = 0;

				idx = this.neighbours[i].occupiedFaces.indexOf(idx);
				this.neighbours[i].occupiedFaces.splice(idx,1);
			}
		}
		// REMOVE FROM POLY / REMOVE POLY
		if (this.poly != null) {

			for (var i = 0, il = this.poly.tetAgents.length; i < il; i++) {
				if(this.poly.tetAgents[i] != this){
					this.poly.tetAgents[i].poly = null;
				}
			}

			idx = myAgentSystem.polyAgents.indexOf(this.poly);
			(idx != -1) ? myAgentSystem.polyAgents.splice(idx,1) : null;

			this.poly = null;
		}
	},// end removeTet

	//------------------------------------------------------- CHECK USEFULLNES
	getFaceFromSharedPoints : function( faceAgents ){
		var faceIdx = null;
		var myFA, count;

		for (var i = 0; i < 4; i++) {
			count = 0;
			myFA = this.getFaceAgents(i);

			for (var j = 0; j < faceAgents.length; j++) {
				( myFA.indexOf(faceAgents[j]) != -1) ? count++ : null;
			}

			if (count == 2) {
				faceIdx = i;
				break;
			}
		}

		if (faceIdx != null && this.occupiedFaces.indexOf(faceIdx) != -1) {
			faceIdx = null;
		}
		else faceIdx = this.getFaceAgents( faceIdx );

		return faceIdx;
	},// end getFaceFromSharedPoints

	//------------------------------------------------------- GET FACE NORMALS
	getFaceNormals : function(){
		var faceNormals = []

		var c = this.getCentre();

		for (var i = 0, il = this.faceVertexIndex.length; i < il; i++) {
			var p = new THREE.Plane().setFromCoplanarPoints(
				this.agents[this.faceVertexIndex[i][0]].loc,
				this.agents[this.faceVertexIndex[i][1]].loc,
				this.agents[this.faceVertexIndex[i][2]].loc
				);
			
			var n = p.orthoPoint( c );

			if ( n.dot(p.normal) <= 0) { n.copy(p.normal); }

	    else{ n.copy(p.normal).negate(); }

			faceNormals.push( n );
		}

		return faceNormals;
	},// end getFaceNormals

	//------------------------------------------------------- GET ONE FACE NORMAL
	getFaceNormal : function( idx ){
		
		var c = this.getCentre();

		var p = new THREE.Plane().setFromCoplanarPoints(
			this.agents[this.faceVertexIndex[ idx ][0]].loc,
			this.agents[this.faceVertexIndex[ idx ][1]].loc,
			this.agents[this.faceVertexIndex[ idx ][2]].loc
		);
			
		var n = p.orthoPoint( c );

		if ( n.dot(p.normal) <= 0) { n.copy(p.normal); }

    	else{ n.copy(p.normal).negate(); }

		return n;
	},// end getFaceNormal

  //------------------------------------------------------- GET FACE CENTRE
	getFaceCentres : function(){

		var centres = []

		for (var i = 0, il = this.faceVertexIndex.length; i < il; i++) {
			var c = new THREE.Vector3(0,0,0).add( this.agents[this.faceVertexIndex[i][0]].loc)
																			.add( this.agents[this.faceVertexIndex[i][1]].loc)
																			.add( this.agents[this.faceVertexIndex[i][2]].loc)
																			.divideScalar(3);

			centres.push( c );
		}

		return centres;
	},// end getFaceCentres

	//------------------------------------------------------- GET ONE FACE CENTRE
	getFaceCentre : function( idx ){

		var c = new THREE.Vector3(0,0,0).add( this.agents[this.faceVertexIndex[ idx ][0]].loc)
																		.add( this.agents[this.faceVertexIndex[ idx ][1]].loc)
																		.add( this.agents[this.faceVertexIndex[ idx ][2]].loc)
																		.divideScalar(3);

		return c;
	},// end getFaceCentre
  
  //------------------------------------------------------- GET CLOSEST FACE INDEX
	getClosestFaceIdx : function( point ){

		var min = 99999999;
		var closestIdx, dist;
		var faceCentres = this.getFaceCentres();

		for (var i = 0, il = faceCentres.length; i < il; i++) {
			dist = point.distanceTo(faceCentres[i]);

			if ( dist < min ) {
				min = dist;
				closestIdx = i;
			}
		}

		return closestIdx;
	},// end getClosestFaceID
	
  //------------------------------------------------------- GET CLOSEST FACE INDEX
	getClosestFreeFaceIdx : function( point ){

		var min = 99999999;
		var closestIdx, dist;
		var freeFaces = this.getFreeFaceIdx();
		var centr;

		for (var i = 0, il = freeFaces.length; i < il; i++) {
			centr = this.getFaceCentre( freeFaces[i] );
			dist = point.distanceTo(centr);

			if ( dist < min ) {
				min = dist;
				closestIdx = freeFaces[i];
			}
		}

		return closestIdx;
	},// end getClosestFaceID

  //------------------------------------------------------- GET BEST FREE FACE IDX TO ENVIRONMENT
	getBestFreeFaceIDX : function(){
		// GET FACE WITH THE BEST ORIENTATION TO ENVIRONMENT

		// GET FREE FACES
		var fid = this.getFreeFaceIdx();
		// GET FREE FACE CENTERS & NORMALS
		var fc = [];
		var fn = [];
		for (var i = 0, il = fid.length; i < il; i++) {
			fc.push( this.getFaceCentre( fid[i] ) );
			fn.push( this.getFaceNormal( fid[i] ) );
		}

		// GET BEST ENVIRONMENT POINT
		var bestFreeFaceIDX = null;
		var mindist = 999999; 
		var vec = new THREE.Vector3();
		for (var i = 0; i < fid.length; i++) {
			var pt = myEnvironment.getBestPointToOrientation(fc[i], fn[i], this.ms.minEdgelength * 0.2);
			
			if ( pt != null) {

				vec.subVectors(pt, fc[i]);
				var dist = vec.length();
				if ( dist < mindist) {

					mindist = dist;
					bestFreeFaceIDX = fid[i];
				}
			}
		}

		return bestFreeFaceIDX;
	},// end getBestFreeFaceIDX

  //------------------------------------------------------- GET GEOMETRY
	getGeometry : function(){
		var geometry = new THREE.Geometry();
		var faces = this.getFaces();

		geometry.vertices.push(
			new THREE.Vector3().copy( this.agents[0].loc ),
			new THREE.Vector3().copy( this.agents[1].loc ),
			new THREE.Vector3().copy( this.agents[2].loc ),
			new THREE.Vector3().copy( this.agents[3].loc )
			);

		geometry.faces.push(
			faces[0],
			faces[1],
			faces[2],
			faces[3]
			);

		normalsByCentre( geometry );
		return geometry;
	},// end getGeometry

  //------------------------------------------------------- DISPLAY PREVIEW
	displayPreview : function(){
		var geometry = new THREE.Geometry();
		var faces = this.getFaces();

		geometry.vertices.push(
			this.agents[0].loc ,
			this.agents[1].loc ,
			this.agents[2].loc ,
			this.agents[3].loc 
			);

		geometry.faces.push(
			faces[0],
			faces[1],
			faces[2],
			faces[3]
			);

		this.previewObj = new THREE.Mesh( geometry, ml.wire_greyM );
		this.previewObj.renderOrder = 3;
		PREVIEW.add(this.previewObj);
	},// end displayPreview

	//------------------------------------------------------- GET NOT OCCUPIED FACE IDX
	getFreeFaceIdx : function(){
		var f = [];

		for (var i = 0, il = this.faceVertexIndex.length; i < il; i++) {
			if ( !(this.occupiedFaces.includes(i)) ){
				f.push(i);
			}
		}


		return f;
	},// end getFreeFaceIdx

	//------------------------------------------------------- GET FACE DISTANCE TO POINT
	getFaceDistToPoint : function(faceIdx, point){
		var d;

		var c = getFaceCentre( faceIdx );
		c.distanceTo( point );

		return d;
	},// end getFaceDistToPoint

	//------------------------------------------------------- GET CONNECTED EDGES TO POINT
	getConnectedEdges : function( PointIdx ){
		var edges = [];

		for (var i = 0, il = this.agents.length; i < il, i != PointIdx; i++) {
			var v = new THREE.Vector3().subVectors(
				this.agents[i].loc,
				this.agents[PointIdx].loc );

			edges.push(v)
		}

		return edges;
	},// end getConnectedEdges

	//------------------------------------------------------- GET CONNECTED EDGES TO POINT
	checkMinMaxEdgeLength : function( PointIdx ){
		
		var edges = this.getConnectedEdges( PointIdx );
		var len;
		var bool = true
		for (var i = 0, il = edges.length; i < il; i++) {
			len = edges[i].length();
			if ( len < morphospace.minEdgelength * 0.3 || len > morphospace.maxEdgelength) {
				bool = false;
			}
		}

		return bool;
	},// end getConnectedEdges

	//------------------------------------------------------- -------------------------
	//------------------------------------------------------- FOR AGENT BEHAVIOR
	//------------------------------------------------------- ( SELF OPTIMISATION )
	//------------------------------------------------------- -------------------------
	//------------------------------------------------------- EDGE LENGHT
	setMorphospace : function(){
		// GET WEIGHT VALUE FROM ENVIRONMENT
	},// end setMorphospace
	
	//------------------------------------------------------- EDGE LENGHT OPTIMISATION
	edgeOptimisation : function( agent ){
		var steer = new THREE.Vector3(0,0,0), vec = new THREE.Vector3(), dist, count = 0;

		for (var i = 0, il = this.agents.length; i < il; i++) {
			// CHECK IF IT IS NOT ME
			if (agent.ID != this.agents[i].ID){
				vec.subVectors(this.agents[i].loc, agent.loc);
				dist = vec.length();

				// SEPARATION
				if ( dist < this.ms.minEdgelength ) {
					vec.negate().setLength( this.ms.minEdgelength - dist );
					vec.multiplyScalar( TC.eo_sepMag );
					steer.add(vec);
					count++;
				}

				//COHESION
				else if ( dist > this.ms.maxEdgelength ) {
					vec.setLength( dist - this.ms.maxEdgelength );
					vec.multiplyScalar( TC.eo_cohMag );
					steer.add(vec);
					count++;
				}
			}
		}

		if (count != 0) {
			steer.divideScalar( count );
		}

		this.stableSteer[0] = steer.length();

		return steer;
	},// end edgeOptimisation
	
	//------------------------------------------------------- EDGE ANGLE OPTIMISATION
	edgeAngleOptimisation : function( agent ){
		var steer = new THREE.Vector3(0,0,0), 
				vec1 = new THREE.Vector3(),
				vec2 = new THREE.Vector3(), 
				angle, count = 0;

		var ags = this.agents.slice();
		ags.splice( ags.indexOf(agent), 1 ); // REMOVE AGENT FROM LIST
		ags.push(ags[1]); // ADD FIRST TO END OF ARRAY AGAIN

		for (var i = 0, il = this.agents.length - 1; i < il; i++) {
			vec1.subVectors(this.agents[i].loc, agent.loc);
			vec2.subVectors(this.agents[i+1].loc, agent.loc);
			angle = degrees(vec1.angleTo(vec2));

			// SMALLER THAN MINIMAL ANGLE
			if ( angle < this.ms.minEdgeAngle ) {
				vec1.add(vec2).limit( this.ms.minEdgeAngle - angle);
				steer.add(vec1);
				count++;
			}

			// BIGGER THAN MAXIMAL ANGLE
			else if ( angle > this.ms.maxEdgeAngle ) {
				vec1.add(vec2).limit( angle - this.ms.maxEdgeAngle );
				vec1.negate();
				steer.add(vec1);
				count++;
			}
		}

		if (count != 0) {
			steer.divideScalar( count );
		}

		this.stableSteer[1] = steer.length();

		return steer;
	},// end edgeAngleOptimisation

	//------------------------------------------------------- FACE ANGLE OPTIMISATION
	faceAngleOptimisation : function( agent ){
	   var 	v1 = new THREE.Vector3(),
		      v2 = new THREE.Vector3(),
		      v3 = new THREE.Vector3(),
		      vp = new THREE.Vector3(),
		      n = new THREE.Vector3(),
		      steer = new THREE.Vector3(0,0,0),
		      angle;

			var ags = this.agents.slice();
			ags.splice( ags.indexOf(agent), 1 ); // REMOVE AGENT FROM LIST

	    v1.subVectors(ags[0].loc, agent.loc);
	    v2.subVectors(ags[1].loc, agent.loc);
	    v3.subVectors(ags[2].loc, agent.loc);
	    vp.copy(v3);
	    
	    n.crossVectors(v1,v2);
	    n.setLength(1);

	    vp.projectOnPlane( n );
	    angle = degrees( vp.angleTo(v3) );

	    if (angle < this.ms.minFaceAngle) {
	      steer.add( n.multiplyScalar(this.ms.minFaceAngle - angle) );
	    }
	    else if (angle > this.ms.maxFaceAngle) {
	      steer.add( n.multiplyScalar(angle - this.ms.maxFaceAngle) );
	    }

			this.stableSteer[2] = steer.length();

	    return steer;
	},// end edgeAngleOptimisation

	//------------------------------------------------------- -------------------------
	//------------------------------------------------------- FOR FABRICATION
	//------------------------------------------------------- -------------------------
	getFabricationGeometry : function(){

		// FABRICATION GEOMETRY
		this.fg.faceVertIdx = this.faceVertexIndex;
		this.fg.normals = this.getFaceNormals();
		
		// GET UNFOLDING GROUP INFORMATION
		this.fg.facePairs = this.getFaceNeighbours( this.fg.faceVertIdx );
		this.fg.faceGroups = this.getFaceGroups();

		var tempfacePairs = this.getFaceNeighbours( this.fg.faceVertIdx );
		this.fg.facePairLevels = this.getFaceLevels( this.fg.faceGroups, tempfacePairs);

		// GET FRAME AND OUTLINE POINTS
		this.fg.frame = this.getFramePoints( this.fg.faceVertIdx );
		this.fg.outline = this.getOutlinePoints();
		this.fg.opening = this.getOpeningPoints();
		this.fg.joints = this.getJointPoints();
		
		// DISPLAY
		this.fg.frameGeo = this.createGeometry(this.fg.frame, this.fg.normals);
		this.fg.outlineGeo = this.createGeometry(this.fg.outline, this.fg.normals);
		this.fg.openingGeo = this.createGeometry(this.fg.opening, this.fg.normals);
		this.fg.jointsGeo = this.createGeometry(this.fg.joints, this.fg.normals, false);
	},// end forFabrication

	//------------------------------------------------------- GET FACE NEIGHBOURS
	getFaceGroups : function(){
		var facegroup1 = [0, 1, 2];
	  var facegroup2 = [3, 2, 0];
	  var facegroup3 = [1, 3, 2];
	  var faceGroups = [ facegroup1, facegroup2, facegroup3 ];

	  return faceGroups;
	},// end getFaceGroups
	
	//------------------------------------------------------- DISPLAY FABRICATION GEOMETRY
	displayFabGeo : function( selector ){

		var info = this.getOutlineInfo();

		// FRAME
		if (this.fg.frameGeo != null && ( selector == "FRAME" || selector == "ALL" || selector == "FO") ) {
			var material = (selector == "FRAME") ? ml.wire_blueD : ml.wire_grey;
			var frameMesh = new THREE.Mesh(this.fg.frameGeo, material);
			frameMesh.renderOrder = 2;
			frameMesh.userData = info;
			WALL.add(frameMesh);
		}

		// OUTLINE
		if (this.fg.outlineGeo != null && ( selector == "OUTLINE" || selector == "ALL" || selector == "FO") ) {
			var outlineMesh = new THREE.Mesh(this.fg.outlineGeo, ml.wire_blueD);
			outlineMesh.renderOrder = 2;
			outlineMesh.userData = info;
			WALL.add(outlineMesh);
		}

		// OPENING
		if (this.fg.openingGeo != null && ( selector == "OPENING" || selector == "ALL" ) ) {
			var openingMesh = new THREE.Mesh(this.fg.openingGeo, ml.wire_blueD);
			openingMesh.renderOrder = 2;
			openingMesh.userData = info;
			WALL.add(openingMesh);
		}

		// Joints
		if (this.fg.jointsGeo != null && ( selector == "JOINTS" || selector == "ALL" ) ) {
			var jointsMesh = new THREE.Points(this.fg.jointsGeo, ml.points_10_blueD);
			jointsMesh.renderOrder = 2;
			jointsMesh.userData = info;
			WALL.add(jointsMesh);
		}
	},// end displayFabGeo

	//------------------------------------------------------- GET OUTLINE POINTS
	getOutlinePoints : function(){

		// GET A COPY OF FRAME POINTS
		var offsetPoints = this.getFramePoints( this.fg.faceVertIdx );

		// MAKE OFFSET ( ACTS ON COPY OF FRAMEPOINTS )
		for (var i = 0, il = this.fg.facePairs.length; i < il; i++) {
			this.makeBendingOffset( this.fg.facePairs[i], this.fg.facePairLevels[i], offsetPoints);
		}

		return offsetPoints;
	},// end getOutlinePoints

	//------------------------------------------------------- GET OPENING POINTS
	getOpeningPoints : function( _outlinePts ){
		
		// GET A COPY OF FRAME POINTS
		var openingPts = (_outlinePts === undefined) ? this.getOutlinePoints() : _outlinePts;

		// MAKE OFFSET ( ACTS ON OPENING POINTS )
		for (var i = 0, il = openingPts.length; i < il; i++) {
			this.makeOffset( openingPts[i] );
		}

		return openingPts;
	},// end getOpeningPoints

	//------------------------------------------------------- GET JOINT POINTS
	getJointPoints : function( _outlinePts ){
		var outline = (_outlinePts === undefined) ? this.getOutlinePoints() : _outlinePts;

		// GET A COPY OF FRAME POINTS
		// var outline = this.getOutlinePoints();
		var offsetDistance = this.ms.jointOffset;

		var jointPoints = [];
		// MAKE OFFSET ( ACTS ON OPENING POINTS )
		for (var i = 0, il = outline.length; i < il; i++) {
			this.makeOffset( outline[i], offsetDistance);
			jointPoints.push( this.makeJoints( outline[i] ) );
		}

		// console.log(jointPoints);
		return jointPoints;
	},// end getJointPoints
	
	//------------------------------------------------------- GET FABRICATION LOCATIONS
	getFramePoints : function( faceVertexIndex ){
		var fabLocs = [];

		for (var i = 0; i < faceVertexIndex.length; i++) {
			var face = [];
			for (var j = 0; j < faceVertexIndex[i].length; j++) {
				var loc = new THREE.Vector3().copy( this.agents[faceVertexIndex[i][j]].loc );
				face.push(loc);
			}
			fabLocs.push(face);
		}

		return fabLocs;
	},// end getFramePoints

	//------------------------------------------------------- GET FACE NEIGHBOURS
	getFaceNeighbours : function( faceVertexIndex ){
		var faceNeighboursIdx = [];
		var checkArray = [];

		var a, b, idx, count, check;
		for (var i = 0, il = faceVertexIndex.length; i < il; i++) {
			
			a = faceVertexIndex[i];
			
			for (var j = 0; j < il, j != i; j++) {
				
				b = faceVertexIndex[j];
				count = 0;
				for (var k = 0, kl = a.length; k < kl; k++) {
					
					idx = faceVertexIndex[i][k];
					if(b.indexOf(idx) != -1) count++;

				}

				if(count == 2){
					var pair = [i,j];
					pair.sort( function(a,b){return a - b;} );
					check = pair.slice().toString();
					if ( checkArray.indexOf(check) == -1 ) {
						checkArray.push(check);
						faceNeighboursIdx.push(pair);
					}
				}
			}
		}

		return faceNeighboursIdx;
	},// end getFaceNeighbours

	//------------------------------------------------------- GET FACE LEVELS
	getFaceLevels : function( groups, faceNeighbours ){

		pairs = faceNeighbours;
		strPairs = [];
		pairs.forEach( function(x) { strPairs.push( x.toString() ) ;});
		// console.log(strPairs);

		// var flat = [];
		var counts = {};
		var facePairLevels = [];
		// var strfacePairLevels = [];
		// var nnn = [];

		// FOR EACH GROUP
		for (var i = 0; i < groups.length; i++) {
			// GET LEVEL PER FACE
			var array = [];
			groups[i].forEach(function(x) { counts[x] = (counts[x] || 0)+1; array.push( counts[x] );});
			// flat.push(array);
			this.fg.faceGroupLevels.push(array);

			// SORT TO 2-FACE-PAIRS
			var pairLevels = [];
			for (var j = 1, jl = groups[i].length; j < jl; j++) {
				
				var np;
				
				// SORT FACE BY FACE-IDX
				if ( groups[i][0] < groups[i][j]) {
					np = [ groups[i][0], groups[i][j] ];
					pairLevels = [ array[0], array[j] ];
				}
				else{
					np = [ groups[i][j], groups[i][0] ];
					pairLevels = [ array[j], array[0] ];
				}
				
				var str = np.toString();

				var idx = strPairs.indexOf( str );
				// nnn[idx] = np;
				facePairLevels[idx] = ( pairLevels );
			}
		}
		
		return facePairLevels;
	},// end getFaceLevels

	//------------------------------------------------------- GET SHARED POINTS OF FACE PAIR
	getSharedPointsIdx : function( facePair, faceVertexIndex){
		
		var f0 = faceVertexIndex[facePair[0]];
		var f1 = faceVertexIndex[facePair[1]];

		var sp0 = [];
		var sp1 = [];

		// ADD SHARED POINTS
		for (var i = 0; i < f0.length; i++) {
			if( f1.indexOf(f0[i]) != -1) {
				sp0.push(i);
				sp1.push(f1.indexOf(f0[i]));
			}
		}
		var sharedPoints = [sp0, sp1];
		return sharedPoints;
	},// end getSharedPointsIdx

	//------------------------------------------------------- GET OPPOSITE POINTS OF FACE PAIR
	getOppositePointsIdx : function( facePair, faceVertexIndex ){
		
		var f0 = faceVertexIndex[facePair[0]];
		var f1 = faceVertexIndex[facePair[1]];

		var sp0;
		var sp1;

		// ADD SHARED POINTS
		for (var i = 0; i < f0.length; i++) {
			if( f1.indexOf(f0[i]) == -1) {
				sp0 = i;
			}
		}

		for (var i = 0; i < f1.length; i++) {
			if( f0.indexOf(f1[i]) == -1) {
				sp1 = i;
			}
		}
		var oppositePoints = [sp0, sp1];
		return oppositePoints;
	},// end getSharedPointsIdx

	//------------------------------------------------------- MAKE BENDING OFFSET	
	makeBendingOffset : function( facePair,facePairLevels, framePoints){
		// GET BENDING RADIUS AND MATERIAL THICKNESS
		var r = this.ms.bendingRad; 	
		var mt = this.ms.matThickness;
		// GET NORMALS AND ANGLE
		var n0 = this.fg.normals[facePair[0]];
		var n1 = this.fg.normals[facePair[1]];
		var angle = Math.PI - n0.angleTo(n1);
		// if (positiveEdge == false) angle = n0.angleTo(n1);
		
		// GET OFFSET FROM EDGE TO BENDING TANGENT
		var b = Math.abs(r / Math.tan( angle * 0.5 ));
		// GET VERTICES OF FACES
		var sharedPointsIdx = this.getSharedPointsIdx( facePair, this.fg.faceVertIdx );
		var oppositPointsIdx = this.getOppositePointsIdx( facePair, this.fg.faceVertIdx );
		// REVERSE FACEPAIRLEVES FOR FOR-LOOP 
		var fpl = facePairLevels.slice();
		fpl.reverse();

		// TEST NEGATIVE OR POSITIVE EDGE
		var o0 = framePoints[ facePair[0] ][ oppositPointsIdx[0] ];
		var o1 = framePoints[ facePair[1] ][ oppositPointsIdx[1] ];
		var oo = new THREE.Vector3().subVectors(o1, o0);
		var positiveEdge = true;
		if (n0.dot(oo) > 0) positiveEdge = false;

		// APPLY NEGATIVE OR POSITIVE EDGE TO ANGLE


		var p0, p1, beta, bFL, o, v = new THREE.Vector3(), 
			vop0 = new THREE.Vector3(),
			vop1 = new THREE.Vector3();
		
		// LOOP THROUGH THE 2 FACES OF FACE PAIR		
		for (var i = 0; i < sharedPointsIdx.length; i++) {
			// CONSIDER FACE LEVELS
			bFL = b + Math.abs( (mt * fpl[i]) / Math.sin(angle) );
			// OPPOSITE POINT
			o = framePoints[ facePair[i] ][ oppositPointsIdx[i] ];
			// DO OFFSET
			// SIDE 0
			p0 = framePoints[ facePair[i] ][ sharedPointsIdx[i][0] ];
			p1 = framePoints[ facePair[i] ][ sharedPointsIdx[i][1] ];
			vop0.subVectors( o, p0 );
			v.subVectors(p1,p0);												
			beta = v.angleTo( vop0 );
			// vop0.setLength( Math.abs(b / Math.sin(beta)) );
			vop0.setLength( Math.abs(bFL / Math.sin(beta)) );

			// SIDE 1
			p0 = framePoints[ facePair[i] ][ sharedPointsIdx[i][0] ];
			p1 = framePoints[ facePair[i] ][ sharedPointsIdx[i][1] ];
			vop1.subVectors( o, p1 );	
			v.negate()												
			beta = v.angleTo( vop1 );
			// vop1.setLength( Math.abs(b / Math.sin(beta)) );
			vop1.setLength( Math.abs(bFL / Math.sin(beta)) );
			
			p0.add(vop0);
			p1.add(vop1);
		}
	},// end makeBendingOffset

	//------------------------------------------------------- MAKE OFFSET	
	makeOffset : function( outlinePts, distance ){
		// GET BENDING RADIUS AND MATERIAL THICKNESS
		var offset = (distance === undefined) ? this.ms.openingOffset : distance;

		var copy = outlinePts.slice();
		copy.unshift(copy[ copy.length - 1]);
		copy.push(copy[1]);

		var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		var angle, dist, offsetVectors = [];
		// GET OFFSET VECTORS FOR VERTICES
		for (var i = 1, il = copy.length - 1; i < il; i++) {
			v1.subVectors( copy[i-1], copy[i]);
			v2.subVectors( copy[i+1], copy[i]);
			angle = v1.angleTo(v2);

			var offVec = new THREE.Vector3().addVectors(v1, v2);
			dist = offset / Math.abs( Math.sin(angle * 0.5) );
			offVec.setLength(dist);

			offsetVectors.push(offVec);		
		}
		// APPLY OFFSET TO VERTICES
		for (var i = 0, il = outlinePts.length; i < il; i++) {
			outlinePts[i].add(offsetVectors[i]);
		}
	},// end makeOffset

	//------------------------------------------------------- MAKE BENDING OFFSET	
	makeJoints : function( outlinePts ){
		// GET BENDING RADIUS AND MATERIAL THICKNESS
		var distance = 30; 	// DISTANCE FIRST POINT TO VERT
		var offset = 10;	// DISTANCE BTW POINTS

		var copy = outlinePts.slice();
		copy.sort( function(a,b){return a.x - b.x;} );
		copy.unshift(copy[ copy.length - 1]);
		copy.push(copy[1]);

		var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		var angle, len, jointPoints = [];
		// GET OFFSET VECTORS FOR VERTICES
		for (var i = 1, il = copy.length - 1; i < il; i++) {
			v1.subVectors( copy[i-1], copy[i]);
			v2.subVectors( copy[i+1], copy[i]);

			// // LEFT
			// len = v1.length();
			// if ( len >= 180 ) {
			// 	len = (len / 2) - (offset / 2);
			// 	var pmL = new THREE.Vector3().addVectors(copy[i], v1.setLength(len) );
			// 	jointPoints.push(pmL);
			// }
			
			var p1 = new THREE.Vector3().addVectors(copy[i], v1.setLength(distance + offset) );
			var p2 = new THREE.Vector3().addVectors(copy[i], v1.setLength(distance) );
			jointPoints.push(p1);
			jointPoints.push(p2);
			// // RIGHT
			// len = v2.length();
			// if ( len >= 180 ) {
			// 	len = (len / 2) - (offset / 2);
			// 	var pmR = new THREE.Vector3().addVectors(copy[i], v2.setLength(len) );
			// 	jointPoints.push(pmR);
			// }

			var p3 = new THREE.Vector3().addVectors(copy[i], v2.setLength(distance + offset) );
			var p4 = new THREE.Vector3().addVectors(copy[i], v2.setLength(distance) );
			jointPoints.push(p3);
			jointPoints.push(p4);
		}

		return jointPoints
	},// end makeJoints
	
	//------------------------------------------------------- DISPLAY FABRICATION GEOMETRY
	createGeometry : function( fabLocs, normals, withFaces ){
		var geometry = new THREE.Geometry();
		var doFace = (withFaces === undefined) ? true : withFaces;

		var count = 0;
		for (var i = 0; i < fabLocs.length; i++) {

			var af = []; 

			for (var j = 0; j < fabLocs[i].length; j++) {
				geometry.vertices.push(fabLocs[i][j]);
				af.push(count);
				count++;
			}

			if( doFace ){
				geometry.faces.push( new THREE.Face3( af[0], af[1], af[2], normals[i] ));
			}
		}

		return geometry;
	},// end createGeometry

	//------------------------------------------------------- GET UNFOLDED GEOMETRY
	getUnfoldedGeometry : function(){

		for (var i = 0; i < this.fg.faceGroups.length; i++) {
			this.unfoldGroup( this.fg.faceGroups[i], this.fg.facePairLevels[i], this.fg.faceGroupLevels[i] );
		}
	},// end getUnfoldedGeometry

	//------------------------------------------------------- UNFOLD GROUP
	unfoldGroup : function( faceGroup, facePairLevels, faceGroupLevels){

		// GET COPY AND FRAME POINTS
		var framePoints = this.getFramePoints( this.fg.faceVertIdx );

		// GET DEEP COPY OF FRAME POINTS
		var groupFramePts = [];
		for (var i = 0, il = faceGroup.length; i < il; i++) {
			var fp = [];
			for (var j = 0; j < this.fg.frame[faceGroup[i]].length; j++) {
				fp.push(new THREE.Vector3().copy( this.fg.frame[faceGroup[i]][j] ));
			}
			groupFramePts.push(fp);
		}
		
		// GET DEEP COPY OF OUTLINE POINTS
		var groupOutlinePts = [];
		for (var i = 0, il = faceGroup.length; i < il; i++) {
			var fp = [];
			for (var j = 0; j < this.fg.outline[faceGroup[i]].length; j++) {
				fp.push(new THREE.Vector3().copy( this.fg.outline[faceGroup[i]][j] ));
			}
			groupOutlinePts.push(fp);
		}

		// GET DEEP COPY OF OPENING POINTS
		var groupOpeningPts = [];
		for (var i = 0, il = faceGroup.length; i < il; i++) {
			var fp = [];
			for (var j = 0; j < this.fg.opening[faceGroup[i]].length; j++) {
				fp.push(new THREE.Vector3().copy( this.fg.opening[faceGroup[i]][j] ));
			}
			groupOpeningPts.push(fp);
		}

		// GET DEEP COPY OF JOINTS POINTS
		var groupJointPts = [];
		for (var i = 0, il = faceGroup.length; i < il; i++) {
			var fp = [];
			for (var j = 0; j < this.fg.joints[faceGroup[i]].length; j++) {
				fp.push(new THREE.Vector3().copy( this.fg.joints[faceGroup[i]][j] ));
			}
			groupJointPts.push(fp);
		}

		//----------------------- DO UNFOLDING

		// STORES EVERYTHING THAT NEEDS TO BE UNFOLD WITH THE FACES
		var groupsToUnfold = [groupOutlinePts, groupOpeningPts, groupJointPts];

		// console.log(faceGroup, facePairLevels);
		// UNFOLD EACH PAIR ( ACT ON framePoints AND groupOutlinePts )
		for (var i = 0, il = faceGroup.length; i < il; i++) {
			if (i != 0) {
				var groupPairToUnfold = [
							[ groupOutlinePts[0]	, groupOutlinePts[i] ], 
							[ groupOpeningPts[0]	, groupOpeningPts[i] ], 
							[ groupJointPts[0]		, groupJointPts[i] ]
							];

				this.unfoldPair( [ faceGroup[0], faceGroup[i] ] , framePoints, groupPairToUnfold );
			}
		}

		//----------------------- REORIENT UNFOLDED STUFF
		switch( FS.unfoldingMethode ){
			case "LOCAL":
				this.reorientGroup_ONION( faceGroup, framePoints, groupsToUnfold );
				break;

			case "GLOBAL":
				this.reorientGroup_FLAT( faceGroup, framePoints, groupsToUnfold );
				this.reorientGroup_ROTATE( faceGroup, framePoints, groupsToUnfold );	
				break;
		}

		//----------------------- CREATE AND STORE STRIPE OBJECT 
		// CREATE STRIPE OBJECT
		var stripe = {
			parentID : "T " + this.ID,
			faceGroup : faceGroup,
			faceLevels : facePairLevels,
			faceGroupLevels : faceGroupLevels,
			faceUID : null,
			frame : groupFramePts,
			outline : groupOutlinePts,
			opening : groupOpeningPts,
			joints : groupJointPts,

			frameGeo : null,
			outlineGeo : null,
			openingGeo : null,
			jointsGeo : null,
			cutGeos : [],
			cutPolyLines : []
		};
		// STORE STRIPE OBJECT
		this.ug.stripes.push(stripe);



		// CREATE FRAME GEOMETRY
		var frameGeo = new THREE.Geometry();
		for (var i = 0; i < faceGroup.length; i++) {
			for (var j = 0; j < framePoints[ faceGroup[i] ].length; j++) {
				frameGeo.vertices.push( framePoints[faceGroup[i]][j] );
			}
			frameGeo.faces.push( new THREE.Face3( (i * 3) + 0, (i * 3) + 1, (i * 3) + 2) );
		}

		// CREATE FACE UID
		var framePointsFolded = this.getFramePoints( this.fg.faceVertIdx );
		var faceUID = [];
		for (var i = 0; i < faceGroup.length; i++) {
			var fUID = 0;
			for (var j = 0; j < framePointsFolded[ faceGroup[i] ].length; j++) {
				fUID += Math.round( framePointsFolded[faceGroup[i]][j].x );
				fUID += Math.round( framePointsFolded[faceGroup[i]][j].y );
				fUID += Math.round( framePointsFolded[faceGroup[i]][j].z );
			}
			faceUID.push( fUID );
		}
		stripe.faceUID = faceUID;
		
		// CREATE OUTLINE GEOMETRY
		var outlineGeo = new THREE.Geometry();
		for (var i = 0; i < groupOutlinePts.length; i++) {
			for (var j = 0; j < groupOutlinePts[i].length; j++) {
				outlineGeo.vertices.push( groupOutlinePts[i][j] );
			}
			outlineGeo.faces.push( new THREE.Face3( (i * 3) + 0, (i * 3) + 1, (i * 3) + 2) );
		}

		// CREATE OPENING GEOMETRY
		var openingGeo = new THREE.Geometry();
		for (var i = 0; i < groupOpeningPts.length; i++) {
			for (var j = 0; j < groupOpeningPts[i].length; j++) {
				openingGeo.vertices.push( groupOpeningPts[i][j] );
			}
			openingGeo.faces.push( new THREE.Face3( (i * 3) + 0, (i * 3) + 1, (i * 3) + 2) );
		}

		// CREATE JOINTS GEOMETRY
		var jointsGeo = new THREE.Geometry();
		for (var i = 0; i < groupJointPts.length; i++) {
			for (var j = 0; j < groupJointPts[i].length; j++) {
				jointsGeo.vertices.push( groupJointPts[i][j] );
			}
		}

		stripe.frameGeo = frameGeo;
		stripe.outlineGeo = outlineGeo;
		stripe.openingGeo = openingGeo;
		stripe.jointsGeo = jointsGeo;
		
		// CREATE CUTTING CURVES
		this.createCuttingCurve(stripe);

		// OFFSET GEOMETRY ( BETTER VISIBILITY )
		switch( FS.unfoldingMethode ){
			case "LOCAL":
				var offset = new THREE.Vector3().copy( this.fg.normals[faceGroup[0]] );
				var dist = 50 * facePairLevels[0];
				offset.setLength(dist);
				frameGeo.translate( offset.x, offset.y, offset.z );
				outlineGeo.translate( offset.x, offset.y, offset.z );
				openingGeo.translate( offset.x, offset.y, offset.z );
				jointsGeo.translate( offset.x, offset.y, offset.z );
				break;

			case "GLOBAL":
				break;
		}
	},// end unfoldGroup

	//------------------------------------------------------- UNFOLD PAIR
	reorientGroup_ONION : function( group, locs, groupsToUnfold){

		var targetN = this.fg.normals[group[0]];
		var target = locs[ group[0] ][0];
		var normal = this.fg.normals[group[0]];
		var origin = locs[ group[0] ][0];
		var quat = new THREE.Quaternion().setFromUnitVectors( normal, targetN);

		// //REORIENT FRAME
		for (var h = 0; h < group.length; h++) {
			for (var i = 0; i < locs[ group[h] ].length; i++) {
				locs[ group[h] ][i] = this.getReorientedPoint( locs[ group[h] ][i], origin, target, quat);
			}
		}

		//UNFOLD FABPOINTS
		var groupU;
		for (var g = 0; g < groupsToUnfold.length; g++) {
			groupU = groupsToUnfold[g];
			
			for (var h = 0; h < groupU.length; h++) {
				for (var i = 0; i < groupU[h].length; i++) {
					groupU[h][i] = this.getReorientedPoint( groupU[h][i], origin, target, quat);
				}
			}
		}
	},// end reorientGroup_ONION

	//------------------------------------------------------- UNFOLD PAIR
	reorientGroup_FLAT : function( group, locs, groupsToUnfold){

		var targetN = FS.unfoldingNormal;
		var target = new THREE.Vector3().copy(FS.unfoldingTarget);
		var m = new THREE.Vector3().copy(FS.offsetX);
		m.multiplyScalar( FS.count );
		target.add( m );
		FS.count += 1;

		var normal = this.fg.normals[group[0]];
		var origin = locs[ group[0] ][0];
		var quat = new THREE.Quaternion().setFromUnitVectors( normal, targetN);

		// //REORIENT FRAME
		for (var h = 0; h < group.length; h++) {
			for (var i = 0; i < locs[ group[h] ].length; i++) {
				locs[ group[h] ][i] = this.getReorientedPoint( locs[ group[h] ][i], origin, target, quat);
			}
		}

		//UNFOLD FABPOINTS
		var groupU;
		for (var g = 0; g < groupsToUnfold.length; g++) {
			groupU = groupsToUnfold[g];

			for (var h = 0; h < groupU.length; h++) {
				for (var i = 0; i < groupU[h].length; i++) {
					groupU[h][i] = this.getReorientedPoint( groupU[h][i], origin, target, quat);
				}
			}
		}
	},// end reorientGroup_FLAT

	//------------------------------------------------------- UNFOLD PAIR
	reorientGroup_ROTATE : function( group, locs, groupsToUnfold ){
		// console.log(group);

		var targetN = new THREE.Vector3(0,0,1);
		var target = new THREE.Vector3().copy(FS.unfoldingTarget);
		var m = new THREE.Vector3().copy(FS.offsetX);
		m.multiplyScalar( FS.count );
		target.add( m );
		FS.count += 1;

		var normal = new THREE.Vector3()
								.addVectors(locs[ group[0] ][0], locs[ group[0] ][1])
								.add(locs[ group[0] ][2])
								.divideScalar(3)
								.sub(locs[ group[0] ][0])
								.setLength(1);
		var origin = locs[ group[0] ][0];
		var quat = new THREE.Quaternion().setFromUnitVectors( normal, targetN);

		// //REORIENT FRAME
		for (var h = 0; h < group.length; h++) {
			for (var i = 0; i < locs[ group[h] ].length; i++) {
				locs[ group[h] ][i] = this.getReorientedPoint( locs[ group[h] ][i], origin, target, quat);
			}
		}

		//UNFOLD FABPOINTS
		var groupU;
		for (var g = 0; g < groupsToUnfold.length; g++) {
			groupU = groupsToUnfold[g];

			for (var h = 0; h < groupU.length; h++) {
				for (var i = 0; i < groupU[h].length; i++) {
					groupU[h][i] = this.getReorientedPoint( groupU[h][i], origin, target, quat);
				}
			}
		}
	},// end reorientGroup_ROTATE

	//------------------------------------------------------- UNFOLD PAIR
	unfoldPair : function( facePair, framePts, groupsToUnfold ){

		// GET SHARED VERTICES AND OPPOSITE POINT INDEICES
		var sharedPointsIdx = this.getSharedPointsIdx( facePair, this.fg.faceVertIdx );
		var oppositPointsIdx = this.getOppositePointsIdx( facePair, this.fg.faceVertIdx );

		var n0, n1, quat, origin, target;
		n0 = this.fg.normals[facePair[0]]; // IS BASE FOR UNFOLDING
		n1 = this.fg.normals[facePair[1]];
		quat = new THREE.Quaternion().setFromUnitVectors( n1, n0);
		// SET ONE OF THE SHARED POINTS AS ORIGIN FOR ORIENTATION
		origin = framePts [ facePair[0] ][ sharedPointsIdx[0][0] ];
		target = origin;		

		// UNFOLD FRAME
		for (var h = 0; h < facePair.length; h++) {
			for (var i = 0; i < framePts [ facePair[h] ].length; i++) {
				quat = new THREE.Quaternion().setFromUnitVectors( this.fg.normals[facePair[h]], n0);
				framePts [ facePair[h] ][i] = this.getReorientedPoint( framePts [ facePair[h] ][i], origin, target, quat);
			}
		}

		//UNFOLD GROUPS TO UNFOLD
		var group;
		for (var g = 0; g < groupsToUnfold.length; g++) {
			group = groupsToUnfold[g];

			for (var h = 0; h < group.length; h++) {
				for (var i = 0; i < group[h].length; i++) {
					quat = new THREE.Quaternion().setFromUnitVectors( this.fg.normals[facePair[h]], n0);
					group[h][i] = this.getReorientedPoint( group[h][i], origin, target, quat);
				}
			}
		}
	},// end unfoldPair

	//------------------------------------------------------- GET UNFOLDED POINT
	getReorientedPoint : function( point, origin, target, quaternion ){
		var toOrigin = new THREE.Vector3().subVectors( point, origin );
		toOrigin.applyQuaternion( quaternion );
		toOrigin.add( origin );
		// MOVE TO TARGET
		var move = new THREE.Vector3().subVectors(target, origin);
		toOrigin.add(move);
		return toOrigin;
	},// end getReorientedPoint

	//------------------------------------------------------- CREATE CUTTING CURVE
	createCuttingCurve : function( stripe ){

		// OPENING FILLET
		for (var i = 0, il = stripe.opening.length; i < il; i++) {
			this.getFillets(stripe.opening[i], this.ms.filletOffset, stripe);
			this.getFillets(stripe.outline[i], this.ms.filletOffset, stripe);			
			this.getOpeningLines(stripe.opening[i], this.ms.filletOffset, stripe);
		}
		// OUTLINE CUT PATH
		this.getConnections(stripe.outline, stripe.frame, this.ms.filletOffset, stripe);
		this.getOutline(stripe.outline, stripe.frame, this.ms.filletOffset, stripe);

		// console.log(stripe.cutGeos);
	},// end createCuttingCurve

	//------------------------------------------------------- GET FILLETS
	getFillets : function ( points, distance, stripe ){
		var offset = (distance === undefined) ? this.ms.filletOffset : distance;

		var copy = points.slice();
		copy.unshift(copy[ copy.length - 1]);
		copy.push(copy[1]);

		var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		var angle, dist;
		// GET OFFSET VECTORS FOR VERTICES
		for (var i = 1, il = copy.length - 1; i < il; i++) {

			v1.subVectors( copy[i-1], copy[i]).setLength(offset) ;
			v2.subVectors( copy[i+1], copy[i]).setLength(offset) ;
			var filletPts =  getfilletPointsCorner(copy[i], v1, v2, offset, this.ms.curveRes );

			var geometry = new THREE.Geometry();
			geometry.vertices = filletPts;
			stripe.cutGeos.push(geometry);
			stripe.cutPolyLines.push(geometry.vertices);

		}
	},// end getFillets

	//------------------------------------------------------- GET OUTLINE
	getOpeningLines : function ( points, distance, stripe ){
		var offset = (distance === undefined) ? this.ms.openingOffset : distance;

		var copy;
		copy = points.slice();
		copy.push(copy[0]);

		var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		// GET OFFSET VECTORS FOR VERTICES
		for (var i = 0, il = copy.length - 1; i < il; i++) {
			v1.subVectors( copy[i+1], copy[i]).setLength(offset).add(copy[i]);

			v2.subVectors( copy[i], copy[i+1]).setLength(offset).add(copy[i+1]);

			var curve = new THREE.LineCurve(
											new THREE.Vector3().copy(v1),
											new THREE.Vector3().copy(v2)
											);

			var geometry = new THREE.Geometry();
			geometry.vertices = curve.getPoints( 2 );
			stripe.cutGeos.push(geometry);
			stripe.cutPolyLines.push(geometry.vertices);

		}
	},// end getOpeningOutlines
	
	//------------------------------------------------------- GET CONNECTIONS
	getConnections : function ( outline, frame, distance, stripe ){
		var offset = (distance === undefined) ? this.ms.filletOffset : distance;
		var copy = frame.slice();
		// console.log(copy);

		var groupSharedE = this.getGroupSharedEdge(frame);


		var vecA = new THREE.Vector3(),
				vecB = new THREE.Vector3(),
				vecC = new THREE.Vector3(),
				vecD = new THREE.Vector3(),
				vecM1 = new THREE.Vector3(),
				vecM2 = new THREE.Vector3(),
				vecAB = new THREE.Vector3(),
				vecCD = new THREE.Vector3();
				vecAC = new THREE.Vector3();
				vecBD = new THREE.Vector3();

		for (var i = 0, il = groupSharedE.length; i < il; i++) {
			// console.log(groupSharedE[i]);
			vecA = new THREE.Vector3().copy(outline[0][groupSharedE[i][0][0]]);
			vecB = new THREE.Vector3().copy(outline[0][groupSharedE[i][0][1]]);
			vecC = new THREE.Vector3().copy(outline[i+1][groupSharedE[i][1][0]]);
			vecD = new THREE.Vector3().copy(outline[i+1][groupSharedE[i][1][1]]);

			vecAB = new THREE.Vector3().subVectors(vecB, vecA).setLength(offset);
			vecCD = new THREE.Vector3().subVectors(vecD, vecC).setLength(offset);

			vecAC = new THREE.Vector3().subVectors(vecC, vecA).multiplyScalar(0.08);
			vecBD = new THREE.Vector3().subVectors(vecD, vecB).multiplyScalar(0.08);

			vecM1 = new THREE.Vector3().addVectors(vecA, vecC).multiplyScalar(0.5);
			vecM2 = new THREE.Vector3().addVectors(vecB, vecD).multiplyScalar(0.5);

			vecA.add(vecAB);
			vecB.add(vecAB.negate()); vecAB.negate();
			vecC.add(vecCD);
			vecD.add(vecCD.negate()); vecCD.negate();

			vecM1.add(vecAB).add(vecAB);
			vecM2.add(vecCD.negate()).add(vecCD); vecCD.negate();


			var curveR = new THREE.CatmullRomCurve3([
									vecA,
									new THREE.Vector3().copy(vecA).add(vecAB).add(vecAC),
									new THREE.Vector3().copy(vecM1).add( new THREE.Vector3().copy(vecAB).multiplyScalar(0.5) ),
									new THREE.Vector3().copy(vecC).add(vecCD).add(vecAC.negate()),
									vecC
									]);

			vecAB.negate();
			vecCD.negate();
			var curveL = new THREE.CatmullRomCurve3([
									vecB,
									new THREE.Vector3().copy(vecB).add(vecAB).add(vecBD),
									new THREE.Vector3().copy(vecM2).add( new THREE.Vector3().copy(vecAB).multiplyScalar(0.5) ),
									new THREE.Vector3().copy(vecD).add(vecCD).add(vecBD.negate()),
									vecD
									]);

			var geometryR = new THREE.Geometry();
			geometryR.vertices = curveR.getPoints( this.ms.curveRes );
			stripe.cutGeos.push(geometryR);
			stripe.cutPolyLines.push(geometryR.vertices);	

			var geometryL = new THREE.Geometry();
			geometryL.vertices = curveL.getPoints( this.ms.curveRes );
			stripe.cutGeos.push(geometryL);
			stripe.cutPolyLines.push(geometryL.vertices);

		}
	},// end getConnections

	//------------------------------------------------------- GET OUTLINE
	getOutline : function ( outline, frame, distance, stripe ){
		var offset = (distance === undefined) ? 12 : distance;

		var nakedE = this.getGroupNakedEdge(frame);

		var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		var v3 = new THREE.Vector3(), v4 = new THREE.Vector3();

		for (var i = 0; i < nakedE.length; i++) {

			for (var j = 0, jl = nakedE[i].length; j < jl; j++) {

				v1.subVectors( outline[i][ nakedE[i][j][0] ], outline[i][ nakedE[i][j][1] ])
					.setLength(offset)
					.add( outline[i][ nakedE[i][j][1] ]);
				
				v2.subVectors( outline[i][ nakedE[i][j][1] ], outline[i][ nakedE[i][j][0] ])
					.setLength(offset)
					.add( outline[i][ nakedE[i][j][0] ]);

				// console.log(v2);



				var curveR = new THREE.LineCurve(
										new THREE.Vector3().copy(v1),
										new THREE.Vector3().copy(v2)
										);


				var geometryR = new THREE.Geometry();
				geometryR.vertices = curveR.getPoints( 2 );
				stripe.cutGeos.push(geometryR);
				stripe.cutPolyLines.push(geometryR.vertices);

			}
		}
	},// end getOutline

	//------------------------------------------------------- GET OUTLINE
	getGroupSharedEdge : function(frame){
		var groupSharedEdges = [];
		for (var i = 1, il = frame.length; i < il; i++) {
			var shared0 = [];
			var sharedI = [];
			for (var j = 0; j < frame[0].length; j++) {	
				(frame[0][j].equals(frame[i][0])) ? shared0.push(j) + sharedI.push(0) : null;
				(frame[0][j].equals(frame[i][1])) ? shared0.push(j) + sharedI.push(1) : null;
				(frame[0][j].equals(frame[i][2])) ? shared0.push(j) + sharedI.push(2) : null;
			}
			groupSharedEdges.push([shared0, sharedI]);
		}
		return groupSharedEdges;
	},// end getGroupSharedEdge

	//------------------------------------------------------- GET OUTLINE
	getGroupNakedEdge : function(frame){
		// console.log(frame);
		var groupSharedEdges = [];
		
		var naked0 = [];		
		var naked = [];		
		naked.push([naked0]);

		for (var i = 1, il = frame.length; i < il; i++) {

			// 0 
			for (var j = 0; j < frame[0].length; j++) {
				if ( !(frame[0][j].equals(frame[i][0])) &&
				     !(frame[0][j].equals(frame[i][1])) &&
				     !(frame[0][j].equals(frame[i][2])) ) {
					naked0.push(j);
				}
			}

			// I
			for (var j = 0; j < frame[i].length; j++) {
				if ( !(frame[i][j].equals(frame[0][0])) &&
				     !(frame[i][j].equals(frame[0][1])) &&
				     !(frame[i][j].equals(frame[0][2])) ) {
					
					var nakedI1 = [j , (j-1 == -1) ? 2 : j-1];
					var nakedI2 = [j , (j+1 == 3) ? 0 : j+1];
					naked.push( [ nakedI1, nakedI2 ] );
				}
			}
		}

		return naked;
	},// end getGroupSharedEdge

	//------------------------------------------------------- CLONE FROM BEIGHBOUR
	cloneFromNeighbours : function (){
		// console.log("---------")

		for (var i = 0; i < this.neighbours.length; i++) {

			// IF TET
			if ( this.neighbours[i] != 0 && this.neighbours[i].poly == null ) {

				var myCenter = this.getFaceCentre(i);
				var fc = this.neighbours[i].getFaceCentres();

				var tIdx = null;
				for (var j = 0, jl = fc.length; j < jl; j++) {
					if ( fc[j].equalsTolerance(myCenter, 1.0) ) { tIdx = j; break; }
				}

				// var tIdx = this.neighbours[i].neighbours.indexOf(this);
				var myOutline = this.fg.outline[i];
				var tempOutline = this.neighbours[i].fg.outline[tIdx];

				if (tempOutline === undefined) {
					console.log( this.neighbours[i].fg.outline[tIdx] );
				}


				var minOutlineV = getMinimalOutline( myOutline, tempOutline, this.fg.outline[i].slice() );
				var minOutlineO = getMinimalOutline( myOutline, tempOutline, this.fg.outline[i].slice() );
				var minOutlineOut = getMinimalOutline( myOutline, tempOutline, this.fg.outline[i].slice() );

				this.fg.outline[i] = minOutlineOut ;

				this.makeOffset( minOutlineV, this.ms.jointOffset);
				this.fg.joints[i] = ( this.makeJoints( minOutlineV ) );

				this.makeOffset( minOutlineO, this.ms.openingOffset);
				this.fg.opening[i] = minOutlineO ;
			}

			// IF POLY
			else if ( this.neighbours[i] != 0 && this.neighbours[i].poly != null ) {

				var tempPoly = this.neighbours[i].poly;
				var fc = tempPoly.getFrameFaceCentres();
				var myCenter = this.getFaceCentre(i);
				var tIdx = null;
				// GET SHARED FACE IDX
				for (var j = 0, jl = fc.length; j < jl; j++) {
					if ( fc[j].equalsTolerance(myCenter,1.0) ) { tIdx = j;  }
				}

				// console.log(tIdx);
				if (tIdx != null) {
					var myOutline = this.fg.outline[i];
					var tempOutline = this.neighbours[i].poly.fg.outline[tIdx];

					if (tempOutline === undefined) {
						console.log( this.neighbours[i].poly.fg.outline[tIdx] );
					}

					var minOutlineV = getMinimalOutline( myOutline, tempOutline, this.fg.outline[i].slice() );
					var minOutlineO = getMinimalOutline( myOutline, tempOutline, this.fg.outline[i].slice() );
					var minOutlineOut = getMinimalOutline( myOutline, tempOutline, this.fg.outline[i].slice() );

					this.fg.outline[i] = minOutlineOut ;

					this.makeOffset( minOutlineV, this.ms.jointOffset);
					this.fg.joints[i] = ( this.makeJoints( minOutlineV ) );

					this.makeOffset( minOutlineO, this.ms.openingOffset);
					this.fg.opening[i] = minOutlineO ;
				}
				else console.log(tIdx);
			}
		}

		this.fg.outlineGeo = this.createGeometry(this.fg.outline, this.fg.normals);
		this.fg.jointsGeo = this.createGeometry(this.fg.joints, this.fg.normals, false);
		this.fg.openingGeo = this.createGeometry(this.fg.opening, this.fg.normals);
	},// end cloneFromNeighbours

	//------------------------------------------------------- SAVE TO JSON
  getJSON : function(){
    var object = {};

    object.ID = this.ID;
    object.occupiedFaces = this.occupiedFaces;
    object.morphospace = this.ms;
    object.stable = this.stable;
    object.poly = (this.poly === null) ? null : this.poly.ID;
    object.fg = this.fg;
    object.ug = this.ug;

    var agentIDs = [];
    for (var i = 0, il = this.agents.length; i < il; i++) {
      agentIDs.push( this.agents[i].ID );
    }

    var neighboursIDs = [];
    for (var i = 0, il = this.neighbours.length; i < il; i++) {
      neighboursIDs.push( (this.neighbours[i] == 0) ? 0 : this.neighbours[i].ID );
    }

    object.neighboursIDs = neighboursIDs;
    object.agentIDs = agentIDs;

    return object;
  },// end getJSON

	//------------------------------------------------------- GET INFORMATION FOR OUTLINER
  getOutlineInfo: function(){
  	var me = "ID: T-" + this.ID;

  	var friends = "Neighbours: ";
  	for (var i = 0; i < this.occupiedFaces.length; i++) {
  		var temp = this.neighbours[ this.occupiedFaces[i] ];

  		if (i != 0) friends += ", ";

  		// CHECK IF POLY OR TET
  		if (temp.poly == null) {
  			friends += "T-" + temp.ID;
  		}else{
  			friends += "P-" + temp.poly.ID;
  		}  		
  	};

  	var info = "<b>Meta-Agent</b>" + "<br>" + me + "<br>" + friends;
  	return info;
  }// end getOutlineInfo
  //----------------------------------------------------------------------------- END TETAGENT
}