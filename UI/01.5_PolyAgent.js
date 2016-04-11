PolyAgent = function (){
	this.ID = 0;
	this.agents = [];
	this.tetAgents = [];
	this.faceVertexIndex = [];
	this.douplicatedFaceIndices = [];
	this.ms = morphospace;

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

PolyAgent.prototype = {

	constructor : PolyAgent,

  //------------------------------------------------------- INIT
  init : function(){

  	// REGISTER IN AGENT SYSTEM
  	myAgentSystem.polyAgents.push(this);
  	// REGISTER IN TET-AGENTS
  	for (var i = 0; i < this.tetAgents.length; i++) {
  		this.tetAgents[i].poly = this;
  	}

  },// end init

  //------------------------------------------------------- ADD A TET
  addTetAgent : function( tetAgent ){
  	
  	// CHECK IF NEIGHBOUR IS TET-AGENT
  	if ( tetAgent != 0 ) {
	  	
	  	// IF THIS IS THE FIRST ONE
	  	if (this.tetAgents.length == 0) {
	  		this.agents = tetAgent.agents.slice();
	  		this.tetAgents.push(tetAgent);
	  		this.ID += tetAgent.ID;
	  		this.faceVertexIndex = tetAgent.faceVertexIndex.slice();
	  	}
	  	
	  	// CHECK IF TET IS NOT ALREADY PART OF POLY
	  	else if (this.tetAgents.indexOf(tetAgent) == -1){
		  	
		  	var merged = this.MergeAgentsAndFaces(tetAgent);
	  		
	  		// CHECK IF IT IS CONNECTED AT ALL
	  		if (merged[2].length != 0) {
		  		
		  		this.tetAgents.push( tetAgent );
	  			this.ID += tetAgent.ID;
		  		this.agents = merged[0];
		  		this.faceVertexIndex = merged[1];
		  		this.douplicatedFaceIndices = merged[2];
	  		}
	  	}
	  }
  },// end addTetAgent

  //------------------------------------------------------- GET SHARED FACES
  getSharedFaceIdx : function( tetAgent ){

  	var facesToRemove = [];
  	for (var i = 0, il = this.tetAgents.length; i < il; i++) {
  		
  		var p = this.tetAgents[i].neightbours.indexOf( tetAgent );
  		var t = tetAgent.neightbours.indexOf( this.tetAgents[i] );
  		if ( p != -1 && t != -1) {
  			facesToRemove.push(p + (4 * i) );
  			facesToRemove.push(t + (4 * il));  			
  		}  		
  	}

  	return facesToRemove;
  },// end getSharedFaceIdx

  //------------------------------------------------------- REMOVE SHARED FACES
  getCleanedFromDuplicates : function ( list ){
  	// NORMALS ARE OPTIONAL	
  	var cleaned = [];

  	// REMOVE DUPLICAT FACES
  	for (var i = 0, il = this.faceVertexIndex.length; i < il; i++) {
  		if ( this.douplicatedFaceIndices.indexOf( i ) == -1 ){
  		 cleaned.push(list[i]);
  		}
  	}

  	return cleaned;
  },// end removeSharedFaces

  //-------------------------------------------------------CLEAN POINT INDICES
  MergeAgentsAndFaces : function( tet ){
  	var fvi =   [
								 	[0,1,2],
						     	[1,2,3],
						  	 	[2,3,0],
						     	[3,0,1]
								];

		var newAgents = this.agents.slice();

		// MERGE FACES AND AGENTS
  	for (var i = 0; i < fvi.length; i++) {
  		
  		for (var j = 0; j < fvi[i].length; j++) {
  			// CHECK IF EXISTING
  			if( newAgents.indexOf( tet.agents[fvi[i][j]] ) != -1){
  				//SET NEW INDEX
  				fvi[i][j] = newAgents.indexOf( tet.agents[fvi[i][j]] );
  			}
  			// IF NOT EXISTING : ADD AGENT
  			else{
  				newAgents.push( tet.agents[fvi[i][j]] );
  				fvi[i][j] = newAgents.length -1;
  			}
  		}
  	}
  	
  	// GET DUPLICATES IDX
  	var mergedFaces = this.faceVertexIndex.concat(fvi);
  	var duplicateFaces = [];
  	var str1, str2;
  	for (var i = 0; i < mergedFaces.length; i++) {
  		for (var j = 0; j < mergedFaces.length, j != i; j++) {
  			mergedFaces[i].sort( function(a,b){return a - b;} );
  			mergedFaces[j].sort( function(a,b){return a - b;} );

  			str1 = mergedFaces[i].slice().toString();
  			str2 = mergedFaces[j].slice().toString();

  			if(str1 === str2){
  				duplicateFaces.push(i,j);
  			}
  		}
  	}

  	var output = [ newAgents, mergedFaces, duplicateFaces ];
  	return output;
  },// end cleanPointIdx

  //------------------------------------------------------- GET FACE NORMALS
  getFaceNormals : function(){	
  	var faceNormals = [];
		for (var i = 0, il = this.tetAgents.length; i < il; i++) {
			faceNormals = faceNormals.concat( this.tetAgents[i].getFaceNormals() );
		}

		return faceNormals;
  },// end getFaceNormals

  //------------------------------------------------------- GET GEOMETRY
	getGeometry : function(){

		// GET LISTS CLEANED FROM SHARED / DUPLICATED FACES / NORMALS
		var n = this.getFaceNormals();
		n = this.getCleanedFromDuplicates( n );
		var faVertIdx = this.getCleanedFromDuplicates( this.faceVertexIndex );

		var geometry = new THREE.Geometry();

		// ADD VERTICES
		for (var i = 0; i < this.agents.length; i++) {
			geometry.vertices.push(new THREE.Vector3().copy( this.agents[i].loc ) );
		}

		// ADD FACES AND NORMALS
		for (var i = 0, il = faVertIdx.length; i < il; i++) {
			var f = faVertIdx[i];
			geometry.faces.push( new THREE.Face3( f[0], f[1], f[2], n[i] ) );
		}

		return geometry;
	},// end getGeometry

	//------------------------------------------------------- FOR FABRICATION
	//------------------------------------------------------- -------------------------
	getFabricationGeometry : function(){

		// FABRICATION GEOMETRY
		this.fg.faceVertIdx = this.getCleanedFromDuplicates( this.faceVertexIndex );

		this.fg.normals = this.getFaceNormals();
		this.fg.normals = this.getCleanedFromDuplicates( this.fg.normals );
		
		// GET UNFOLDING GROUP INFORMATION
		this.fg.facePairs = this.getFaceNeighbours( this.fg.faceVertIdx );
		this.fg.faceGroups = this.getFaceGroups();

		var tempfacePairs = this.getFaceNeighbours( this.fg.faceVertIdx );
		this.fg.facePairLevels = this.getFaceLevels( this.fg.faceGroups, tempfacePairs );
		// this.fg.facePairLevels = this.getFaceLevels( this.fg.facePairs, tempfacePairs );

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
		// return geometry;
	},// end forFabrication
	
	//------------------------------------------------------- DISPLAY FABRICATION GEOMETRY
	displayFabGeo : function( selector ){

		var info = this.getOutlineInfo();

		// FRAME
		if (this.fg.frameGeo != null && ( selector == "FRAME" || selector == "ALL" || selector == "FO") ) {
			var material = (selector == "FRAME") ? ml.wire_blueB : ml.wire_grey;
			var frameMesh = new THREE.Mesh(this.fg.frameGeo, material);
			frameMesh.renderOrder = 2;
			frameMesh.userData = info;
			WALL.add(frameMesh);
		}

		// OUTLINE
		if (this.fg.outlineGeo != null && ( selector == "OUTLINE" || selector == "ALL" || selector == "FO") ) {
			var outlineMesh = new THREE.Mesh(this.fg.outlineGeo, ml.wire_blueB);
			outlineMesh.renderOrder = 2;
			outlineMesh.userData = info;
			WALL.add(outlineMesh);
		}

		// OPENING
		if (this.fg.openingGeo != null && ( selector == "OPENING" || selector == "ALL" ) ) {
			var openingMesh = new THREE.Mesh(this.fg.openingGeo, ml.wire_blueB);
			openingMesh.renderOrder = 2;
			openingMesh.userData = info;
			WALL.add(openingMesh);
		}

		// Joints
		if (this.fg.jointsGeo != null && ( selector == "JOINTS" || selector == "ALL" ) ) {
			var jointsMesh = new THREE.Points(this.fg.jointsGeo, ml.points_10_blueB);
			jointsMesh.renderOrder = 2;
			jointsMesh.userData = info;
			WALL.add(jointsMesh);
		}
	},// end displayFabGeo

	//------------------------------------------------------- GET FACE NEIGHBOURS
	getFaceGroups : function(){
		var facepairs = this.getFaceNeighbours( this.fg.faceVertIdx );
		var faceGroups = [];

		recursiveGroups(facepairs,faceGroups);
	
		return faceGroups;
	},// end getFaceGroups

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
	getOpeningPoints : function(){

		// GET A COPY OF FRAME POINTS
		var openingPts = this.getOutlinePoints();

		// MAKE OFFSET ( ACTS ON OPENING POINTS )
		for (var i = 0, il = openingPts.length; i < il; i++) {
			this.makeOffset( openingPts[i] );
		}

		return openingPts;
	},// end getOpeningPoints

	//------------------------------------------------------- GET JOINT POINTS
	getJointPoints : function(){

		// GET A COPY OF FRAME POINTS
		var outline = this.getOutlinePoints();
		var offsetDistance = this.ms.jointOffset;

		var jointPoints = [];
		// MAKE OFFSET ( ACTS ON OPENING POINTS )
		for (var i = 0, il = outline.length; i < il; i++) {
			this.makeOffset( outline[i], offsetDistance);
			jointPoints.push( this.makeJoints( outline[i] ) );
		}

		// console.log(jointPoints);
		return jointPoints;
	},// end getOpeningPoints
	
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

		for (var i = 0; i < groups.length; i++) {
			var array = [];
			groups[i].forEach(function(x) { counts[x] = (counts[x] || 0)+1; array.push( counts[x] );});
			// flat.push(array);
			this.fg.faceGroupLevels.push(array);

			// SORT TO 2-FACE-PAIRS
			var pairLevels = [];
			for (var j = 1, jl = groups[i].length; j < jl; j++) {
				
				var np;
				
				if ( groups[i][0] < groups[i][j]) {
					np = [ groups[i][0], groups[i][j] ];
					pairLevels = [ array[0], array[j] ];
				}
				else{
					np = [ groups[i][j], groups[i][0] ];
					pairLevels = [ array[j], array[0] ];
				}
				
				var str = np.toString();
				// console.log(str);

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
		
		// UNFOLD GROUPS
		// var frameGeo = [];
		// var outlineGeo = [];
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
			parentID : "P " + this.ID,
			faceGroup : faceGroup,
			faceUID : null,
			faceLevels : facePairLevels,
			faceGroupLevels : faceGroupLevels,
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
		var offset = (distance === undefined) ? this.ms.filletOffset : distance;

		var copy;
		copy = points.slice();
		copy.push(copy[0]);

		var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		var curves = [];
		// GET OFFSET VECTORS FOR VERTICES
		for (var i = 0, il = copy.length - 1; i < il; i++) {
			v1.subVectors( copy[i+1], copy[i]).setLength(offset).add(copy[i]);

			v2.subVectors( copy[i], copy[i+1]).setLength(offset).add(copy[i+1]);

			var curve = new THREE.LineCurve(
											new THREE.Vector3().copy(v1),
											new THREE.Vector3().copy(v2)
											);

			curves.push(curve);

			var geometry = new THREE.Geometry();
			geometry.vertices = curve.getPoints( 2 );
			stripe.cutGeos.push(geometry);
			stripe.cutPolyLines.push(geometry.vertices);

		}
	},// end getOpeningOutlines

		//------------------------------------------------------- GET OUTLINE
	
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
									new THREE.Vector3().copy(vecM1).add(new THREE.Vector3().copy(vecAB).multiplyScalar(0.5)),
									new THREE.Vector3().copy(vecC).add(vecCD).add(vecAC.negate()),
									vecC
									]);

			vecAB.negate();
			vecCD.negate();
			var curveL = new THREE.CatmullRomCurve3([
									vecB,
									new THREE.Vector3().copy(vecB).add(vecAB).add(vecBD),
									new THREE.Vector3().copy(vecM2).add(new THREE.Vector3().copy(vecAB).multiplyScalar(0.5)),
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
		var offset = (distance === undefined) ? this.ms.filletOffset : distance;

		console.log(frame);
		var nakedE = this.getGroupNakedEdge(frame);
		console.log(nakedE);

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
		var naked = [];	

		if (frame.length == 3) {
			var naked0 = [];		
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
		}

		else if(frame.length == 2){

			var copy = frame.slice();
			copy.push(copy[0]);

			for (var h = 0; h < frame.length; h++) {

				for (var i = 0; i < frame[h].length; i++) {

					if( !(frame[h][i].equals(copy[h+1][0])) &&
							!(frame[h][i].equals(copy[h+1][1])) &&
							!(frame[h][i].equals(copy[h+1][2])) ){

							var nakedI1 = [i , (i-1 == -1) ? 2 : i-1];
							var nakedI2 = [i , (i+1 == 3) ? 0 : i+1];
							naked.push( [ nakedI1, nakedI2 ] );
					}
				}
			}
		}

		return naked;
	},// end getGroupSharedEdge

	//------------------------------------------------------- GET FRAME FACE CENTRES
	getFrameFaceCentres : function (){
		var frameCentres = [];
		for (var i = 0, il = this.fg.frame.length; i < il; i++) {
			var cent = new THREE.Vector3(0,0,0);
			cent.add( this.fg.frame[i][0] );
			cent.add( this.fg.frame[i][1] );
			cent.add( this.fg.frame[i][2] );
			cent.divideScalar( 3 );
			frameCentres.push(cent);
		}
		return frameCentres;
	},// end getFrameFaceCentres
	
	//------------------------------------------------------- GET TET-AGENT NEIGHBOURS
	getNeighbours : function(){

		var neighbours = [];
		for (var i = 0; i < this.tetAgents.length; i++) {
			for (var j = 0; j < this.tetAgents[i].neighbours.length; j++) {
				if (this.tetAgents.indexOf( this.tetAgents[i].neighbours[j] ) == -1 
					&& this.tetAgents[i].neighbours[j] != 0){
					neighbours.push( this.tetAgents[i].neighbours[j] );
				}
			}
		}

		return neighbours;
	},// end getNeighbours

	//------------------------------------------------------- CLONE FROM BEIGHBOUR
	cloneFromNeighbours : function (){
		// console.log("---------")

		var neighbours =  this.getNeighbours();
		var fc;

		for (var i = 0; i < this.fg.frame.length; i++) {

			var myCenter = new THREE.Vector3(0,0,0)
				.add(this.fg.frame[i][0])
				.add(this.fg.frame[i][1])
				.add(this.fg.frame[i][2])
				.divideScalar(3)

			
			for (var j = 0; j < neighbours.length; j++) {

				// IF TET
				if ( neighbours[j] != 0 && neighbours[j].poly == null ) {

					if (neighbours[j].fg.frame.length == 0) {
						neighbours[j].getFabricationGeometry();
					}

					fc = neighbours[j].getFaceCentres();
					var nid = undefined, fid = undefined;
					for (var k = 0, kl = fc.length; k < kl; k++) {
						if ( fc[k].equalsTolerance( myCenter, 1.0 ) ) { nid = j; fid = k; break; }
					}

					// console.log(i,nid,fid);
					if (nid !== undefined && fid !== undefined) {

						var myOutline = this.fg.outline[i];
						var tempOutline = neighbours[nid].fg.outline[fid];

						if (tempOutline === undefined) {
							console.log( tempPoly.fg.outline[fid] );
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

					// break;
				}

				// IF POLY
				if ( neighbours[j] != 0 && neighbours[j].poly != null ) {

					var tempPoly = neighbours[j].poly;

					if (tempPoly.fg.frame.length == 0) {
						tempPoly.getFabricationGeometry();
					}

					fc = tempPoly.getFrameFaceCentres();
					nid = undefined, fid = undefined;
					for (var m = 0, ml = fc.length; m < ml; m++) {
						if ( fc[m].equalsTolerance( myCenter, 1.0 ) ) { nid = j; fid = m; break; }
					}

					if (nid !== undefined && fid !== undefined) {

						var myOutline = this.fg.outline[i];
						var tempOutline = tempPoly.fg.outline[fid];

						if (tempOutline === undefined) {
							console.log( tempPoly.fg.outline[fid] );
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

					// break;
				}
			}
		// }
				this.fg.outlineGeo = this.createGeometry(this.fg.outline, this.fg.normals);
				this.fg.jointsGeo = this.createGeometry(this.fg.joints, this.fg.normals, false);
				this.fg.openingGeo = this.createGeometry(this.fg.opening, this.fg.normals);
		}
	},// end cloneFromNeighbours

	//------------------------------------------------------- SAVE TO JSON
	getJSON : function(){
    var object = {};

    object.ID = this.ID;
    object.faceVertexIndex = this.faceVertexIndex;
    object.douplicatedFaceIndices = this.douplicatedFaceIndices;
    object.morphospace = this.ms;
    object.fg = this.fg;
    object.ug = this.ug;

    var agentIDs = [];
    for (var i = 0, il = this.agents.length; i < il; i++) {
      agentIDs.push( this.agents[i].ID );
    }

    var tetAgentIDs = [];
    for (var i = 0, il = this.tetAgents.length; i < il; i++) {
      tetAgentIDs.push( this.tetAgents[i].ID );
    }

    object.agentIDs = agentIDs;
    object.tetAgentIDs = tetAgentIDs;

    return object;
  },// end getJSON

  //------------------------------------------------------- GET INFORMATION FOR OUTLINER
  getOutlineInfo: function(){
  	var me = "ID: P-" + this.ID;

  	var friends = "Neighbours: ";
  	var neighbours = this.getNeighbours();
  	for (var i = 0; i < neighbours.length; i++) {
  		var temp = neighbours[i];

  		if (i != 0) friends += ", ";

  		// CHECK IF POLY OR TET
  		if (temp.poly == null) {
  			friends += "T-" + temp.ID;
  		}else{
  			friends += "P-" + temp.poly.ID;
  		}  		
  	};

  	var info = "<b>Poly-Agent</b>" + "<br>" + me + "<br>" + friends;
  	return info;
  }// end getOutlineInfo
//----------------------------------------------------------------------------- END POLY AGENT 
}