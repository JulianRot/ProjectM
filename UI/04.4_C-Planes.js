cPlane = function( _origin, _normal ){
	// variables
	this.origin = _origin;	
	this.vecX;
	this.vecY;
	this.vecZ = _normal;
	this.vertices = [];
	this.plane;
	this.geometry = new THREE.Geometry();
	this.material = ml.wire_greyM;
	this.object;
	this.type;
	this.sizeX = 10;
	this.sizeY = 10;
	this.strength = 1;
	this.usage = "Attractor";
}

cPlane.prototype = {

	constructor : cPlane,

  //------------------------------------------------------- INIT
	init : function(){
		// init plane

		this.plane = new THREE.Plane();
		this.plane.setFromNormalAndCoplanarPoint(this.vecZ, this.origin);
		var constant = this.plane.constant;

		var planeOrigin = new THREE.Vector3().copy(this.vecZ);
		planeOrigin.setLength(constant);

		this.vecX = new THREE.Vector3().subVectors(planeOrigin,this.origin);
		this.vecY = new THREE.Vector3().crossVectors(this.vecX, this.vecZ);

		this.vecX.normalize();
		this.vecY.normalize();
		this.vecZ.normalize();

		this.createVertices();
	},// end init

  //------------------------------------------------------- CREATE VERTICES
	createVertices :  function(){

		// MATRACIES
		var vz = new THREE.Vector3(0,0,1);

		var quaternion = new THREE.Quaternion().setFromUnitVectors(vz, this.vecZ);
		var rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion( quaternion );
		var translationMatrix = new THREE.Matrix4().makeTranslation( this.origin.x, this.origin.y, this.origin.z );
		var matrix = new THREE.Matrix4().multiplyMatrices( translationMatrix, rotationMatrix );

		// CREATE VERTICES
		this.vertices = [
			new THREE.Vector3(this.sizeX * 0.5,this.sizeY * 0.5,0),
			new THREE.Vector3(-this.sizeX * 0.5,this.sizeY * 0.5,0),
			new THREE.Vector3(-this.sizeX * 0.5,-this.sizeY * 0.5,0),
			new THREE.Vector3(this.sizeX * 0.5,-this.sizeY * 0.5,0)
		];

		for (var i = 0; i < this.vertices.length; i++) {
			this.geometry.vertices.push(this.vertices[i]);
		}

		// CREATE FACES
		this.geometry.faces.push(
			new THREE.Face3(0,1,2),
      new THREE.Face3(0,2,3)
		);

		// CREATE OBJECTS		
		this.object = new THREE.Mesh(this.geometry, this.material);

		this.geometry.computeFaceNormals();
		this.geometry.verticesNeedUpdate = true;
		this.object.material.side = THREE.DoubleSide;
		this.object.originalMat = this.material;
		
		// OBJECT INFORMATION
		this.object.renderOrder = 1;
		this.object.name = "C-Plane";
		this.object.userData = this.getOutlineInfo();
		this.object.applyMatrix( matrix );
		CPLANES.add(this.object); 

	},// end createVertices

	//------------------------------------------------------- GET CENTER LINE POINTS
	getCentreLinePoints : function(){

		var ab = new THREE.Vector3().subVectors( this.geometry.vertices[2], this.geometry.vertices[1] );
		var cd = new THREE.Vector3().subVectors( this.geometry.vertices[3], this.geometry.vertices[0] );
		ab.divideScalar(2).add( this.geometry.vertices[1] );
		cd.divideScalar(2).add( this.geometry.vertices[0] );
		
		this.object.updateMatrixWorld();
		this.object.localToWorld(ab);
		this.object.localToWorld(cd);
		
		var clp = [ab,cd];
		return clp;
	},// end getCentreLinePoints

	//------------------------------------------------------- GET ORIGIN
	getOrigin : function(){
		return this.object.position;
	}, // end getOrigin


	//------------------------------------------------------- GET INFORMATION FOR OUTLINER
  getOutlineInfo : function(){
  	var info = "<b>C-Plane</b>" + "<br>" + this.usage;
  	return info;
  }// end getOutlineInfo
	//---------------------------------------------------------------------------- END C-PLANES
}