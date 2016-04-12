//----------------------------------------------------------------------------- SUB AGENT SYSTEM OBJECT
Environment = function(){

  //------------------------------------------------------- VARIABLES
  this.cPlanes = [];

  // 3-DIMENSIONAL NESTED ARRAYS:
  this.voxels = []; // CONTAINS LOCATION DATA WITH DISPLACEMENT
  this.voxelsOrigins = []; // CONTAINS LOCATION DATA WITHOUT DISPLACEMENT
  this.weight = []; // CONTAINS SCALAR DATA

  this.productiveVoxels = [];

  this.bottomPlane;
  this.topPlane;
  this.attractorPlanes = [];
  this.res = 20; // NUMBER OF SUB DIVISIONS

  this.readyFlag = true;  // INDECATE CHANGES

  this.pointGeo = new THREE.Geometry();
  this.pointMAt = ml.points_Envi;
  this.dispPoints;
  // scene.add(this.dispPoints);
}
    
Environment.prototype = {

  constructor : Environment,

  //------------------------------------------------------- RUN
  run : function(){
    this.readyFlag = true;
    this.displacement();

    this.pointGeo.verticesNeedUpdate = true;  
    this.productiveVoxels = [];
  },// end run

  //------------------------------------------------------- ADD PLANES
  addCPlane : function (cPlane) {
    this.cPlanes.push(cPlane);
    this.evaluatePlanes();
  },// end addCPlanes

  //------------------------------------------------------- EVALUATE PLANES
  evaluatePlanes : function() {

    this.attractorPlanes = [];
    var maxY = -9999, minY = 9999;

    if (this.cPlanes.length > 1){
      // check for bottom and top cPlane
      for (var i = 0; i < this.cPlanes.length; i++) {
        if( this.cPlanes[i].origin.y > maxY ){
          this.topPlane = this.cPlanes[i];
          this.cPlanes[i].usage = "Top-Plane";
          maxY = this.cPlanes[i].origin.y;
        }
        if( this.cPlanes[i].origin.y < minY ){
          this.bottomPlane = this.cPlanes[i];
          this.cPlanes[i].usage = "Bottom-Plane";
          minY = this.cPlanes[i].origin.y;
        }
      }

      this.voxelSpace();
      this.display();
    }
  },// end evaluateCPlanes

  //------------------------------------------------------- VOXEL SPACE
  voxelSpace : function (){
    this.voxels = [];
    this.weight = [];

    var clp = this.bottomPlane.getCentreLinePoints();
    var CLP = this.topPlane.getCentreLinePoints();

    console.log(clp);
    console.log(CLP);

    var m = clp[0];
    var l = new THREE.Vector3().subVectors(clp[1], clp[0]);
    l.divideScalar(this.res);

    var M = CLP[0];
    var L = new THREE.Vector3().subVectors(CLP[1], CLP[0]);
    L.divideScalar(this.res);

    var arrBot = [];
    var arrTop = [];

    var tempVec = new THREE.Vector3(0,0,0);

    // CREATE ARRAYS FOR TOP AND BOTTOM PLANE
    // ARRAY NEED TO HAVE THE SAME LENGTH
    for (var i = 0; i < this.res+1; i++) {
      tempVec.copy( l );
      tempVec.multiplyScalar(i);
      tempVec.add( m );

      arrBot.push( new THREE.Vector3().copy( tempVec ) );

      tempVec.copy( L );
      tempVec.multiplyScalar(i);
      tempVec.add( M );

      arrTop.push( new THREE.Vector3().copy( tempVec ) );
    }

    var tb = new THREE.Vector3(0,0,0);
    var cntr = new THREE.Vector3(0,0,0);

    // INTERPOLATE BETWEEN TOP AND BOTTOM ARRAYS
    for (var i = 0, il = arrBot.length; i < il; i++) {

      tb.subVectors(arrTop[i], arrBot[i]);
      tb.divideScalar(this.res);

      // 1 AND 2 ARE NEEDED TO MAKE A COPY
      // 1 IS CHANGING AND ADAPTING WHILE
      // 2 STAYS THE SAME // ORIGINAL-->ORIGINS
      var arrayU1 = [];
      var arrayU2 = [];
      var weightU = [];

      for (var j = 0; j < this.res+1; j++) {
        tempVec.copy(tb);
        tempVec.multiplyScalar(j);

        var arrayV1 = [];
        var arrayV2 = [];
        var weightV = [];

        arrayV1.push(new THREE.Vector3().addVectors( arrBot[i], tempVec));
        arrayV2.push(new THREE.Vector3().addVectors( arrBot[i], tempVec));

        arrayU1.push(arrayV1);
        arrayU2.push(arrayV2);  

        weightV.push(0);
        weightU.push(weightV); 
      }

      this.voxels.push(arrayU1);
      this.voxelsOrigins.push(arrayU2);
      this.weight.push(weightU);
    }
  },// end voxelSpace

  //------------------------------------------------------- DISPLAY
  display : function(){

    for (var i = 0, il = this.voxels.length; i < il; i++) {
      for (var j = 0, jl = this.voxels[i].length; j < jl; j++) {
        for (var k = 0, kl = this.voxels[i][j].length; k < kl; k++) {

          this.pointGeo.vertices.push(this.voxels[i][j][k]);
        }
      }      
    }

    this.dispPoints = new THREE.Points(this.pointGeo, this.pointMAt);
    this.dispPoints.renderOrder = 1;
    ENVIRONMENT.add(this.dispPoints);
  },// end display

  //------------------------------------------------------- DISPLAY
  displacement : function(){

    var cp, s;
    for (var i = 0; i < this.attractorPlanes.length; i++) {

      cp = this.attractorPlanes[i];
      s = ((cp.sizeX + cp.sizeY) * 0.5);
      var v, dist;

      for (var j = 0, jl = this.voxels.length; j < jl; j++) {
        for (var k = 0, kl = this.voxels[j].length; k < kl; k++) {
          for (var l = 0, ll = this.voxels[j][k].length; l < ll; l++) {

            v = new THREE.Vector3().subVectors(cp.object.position, this.voxelsOrigins[j][k][l]);
            v.projectOnPlane(cp.vecZ);
            dist = v.length();
            var n = s - dist;

            if ( n >= 0) {
              n = map(n, 0, s, 0, 0.25);

              this.weight[j][k][l] = n;

              var vpp = cp.plane.orthoPoint(this.voxelsOrigins[j][k][l]);
              vpp.multiplyScalar(-n);
              var cv = new THREE.Vector3().addVectors(this.voxelsOrigins[j][k][l], vpp);

              var v2 = new THREE.Vector3().subVectors(cv,  this.voxels[j][k][l]);
              if (v2.length() > 20) {
                v2.multiplyScalar(n * 0.2);
                this.voxels[j][k][l].add(v2);
                this.readyFlag = false;
              }
            }
          }
        }
      }
    }
  },// end displacement

  //------------------------------------------------------- DISPLAY
  getBestPointToOrientation : function( origin, normal, maxdist ){

    var vox, vec = new THREE.Vector3(), dist;
    var minangel = 9999, mindist = maxdist;
    var bestVoxel = null;

    for (var i = 0, il = this.voxels.length; i < il; i++) {
      for (var j = 0, jl = this.voxels[i].length; j < jl; j++) {
        for (var k = 0, kl = this.voxels[i][j].length; k < kl; k++) {

          vox = this.voxels[i][j][k];
          vec.subVectors(vox, origin);
          dist = vec.length();

          if (dist < maxdist) {

            var angle = vec.angleTo(normal);

            if (angle < minangel) {
              minangel = angle;
              bestVoxel = new THREE.Vector3().copy(vox);
            }
          }
        }
      }
    }

    return bestVoxel;
  },// end getBestPointToOrientation

  //------------------------------------------------------- DISPLAY
  refresh : function(){
    scene.getObjectByName("ENVIRONMENT").remove(this.dispPoints);
  }// end refresh
  //----------------------------------------------------------------------------- END META AGENT SYSTEM
}