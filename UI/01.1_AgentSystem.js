//----------------------------------------------------------------------------- META AGENT SYSTEM OBJECT
AgentSystem = function(){

  //------------------------------------------------------- VARIABLES
  this.count = 0;    
  this.container = [];
  this.cPlanes = [];
  this.noUpdateCount = 0;

  // TETRAHEDRONS
  this.tetAgentsCheckSum = [];
  this.tetAgents = [];

  // POLY-AGENTS
  this.polyAgents = [];

  // ENVIRONMENT
  this.environment;

  //  POINT OBJECT
  this.stockVertCount = 500; // INITIAL NUMBER OF STOCK VERTECIES
  this.pointGeo = new THREE.Geometry();  
  this.pointObj = new THREE.Points( this.pointGeo, ml.points_50_greyD);
  this.pointObj.renderOrder = 2;

  //------------------------------------------------------- INIT
  this.init = function( _environment ){
    this.environment = _environment;
    this.createStockVertices();
    WALL.add(this.pointObj);
  }// end init
}


AgentSystem.prototype = {

  constructor: AgentSystem,

  //------------------------------------------------------- RUN
  run : function(){
    
    // POPULATION HANDLER
    GP.birthcount = 0;
    this.populationHandlerOnRun();
    console.log(bakeFlag);
    // RUNNING
    if (playFlag == true) {

      // DELETE BAKED OBJECTS
      WALL.children = [];

      // RUN AGENTS
      for(var i = 0, il = this.container.length; i < il; i++){
        this.container[i].run();
      }

      // RUN TETS
      if ( this.tetAgents.length < GP.maxTetCount) {

        var tetAgentsCopy = this.tetAgents.slice();

        switch (TC.growthStyle){
          case "CENTRAL":
            break;
          case "BRANCH":
            tetAgentsCopy.reverse();
        }

        for (var i = 0, il = tetAgentsCopy.length; i < il; i++) {
          tetAgentsCopy[i].run();
        }
      }

      else {
        console.log("Numer of Tet-Agents :" + this.tetAgents.length);
        for (var i = 0, il = this.tetAgents.length; i < il; i++) {
          this.tetAgents[i].previewObj.geometry.verticesNeedUpdate = true;
        }
      }

      // CHECK TETS
      var bool1, bool2, bool3;
      for (var i = this.tetAgents.length-1; i >= 0; i--) {
        bool1 = this.tetAgents[i].stable;
        bool2 = this.tetAgents[i].isUsefull();
        bool2 = !bool2;
        bool3 = this.tetAgents[i].lifeTime >= 100;

        // console.log(bool1, bool2, bool3);
        // REMOVE NOT USEFULL TETS
        if ( bool1 && bool2 && bool3 ) {
          console.log("not usefull");
          this.tetAgents[i].removeTet();
          this.tetAgents.splice(i,1);
        }
      }

      this.pointGeo.verticesNeedUpdate = true;
    }
  },// end run

  //------------------------------------------------------- HANDELS DYNAMIC POPULATION ON RUN
  populationHandlerOnRun : function(){
    stoptime = 7999;

    switch("A"){

      case "A":
        //----- STRATEGY A
        genStep = 100;
        // stoptime = 250;
        this.popPlanar_OnFlag();
        break;

      case "A2":
        //----- STRATEGY A
        genStep = 20;
        // stoptime = 8000;
        this.popPlanar_OnFlag_2();
        break;

      case "B":
        //----- STRATEGY B
        genStep = 50;
        // stoptime = 4000;        
        this.setProductiveVoxels();
        this.popProductiveVoxels_OnFlag();
        break;

      case "C":
        //----- STRATEGY C
        genStep = 150;
        var start = 100;
        // stoptime = 4000;
        if ( iCounter == start ) this.popOneTet();
        else if ( iCounter > start ) this.popFreeFaces_OnFlag();
        break;

      case "D":
        //----- STRATEGY D
        genStep = 100;
        var start = 100;
        // stoptime = 4000;
        if ( iCounter == start ) this.popOneTet();
        else if ( iCounter > start ) {
          this.setProductiveVoxels();
          if (this.count % 2 == 0) this.environment.productiveVoxels.reverse();
          this.popFreeFacesAndProductiveVoxels_OnFlag();
        }
        break;

      case "E":
        //----- STRATEGY C
        genStep = 100;
        var start = 100;
        // stoptime = 4000;
        if ( iCounter == start ) this.popOneTet();
        else if ( iCounter > start ) this.popFreeFaces_OnFlag();
        break;

      case "F":
        //----- STRATEGY C
        genStep = 20;
        var start = 100;
        // stoptime = 4000;
        // if ( iCounter == start ) this.popOneTet();
        if ( iCounter > start ) this.popCarroussel();
        break;


      case "T":
        //----- STRATEGY D
        genStep = 48;
        var start = 10;
        // stoptime = 4000;
        if ( iCounter == start ) this.popOneTet();
        else if ( iCounter > start && this.tetAgents.length < 3) {
          this.setProductiveVoxels();
          if (this.count % 2 == 0) this.environment.productiveVoxels.reverse();
          this.popFreeFacesAndProductiveVoxels_OnFlag();
        }
        break;

      case "L":
        //----- LOAD FROM JSON
        var start = 50;
        if ( iCounter == start ) this.popFromJSON();
        // if ( iCounter == start+1 ) bakeFlag = false;
        break;

      case "APOMIXIS":
        //----- LOAD FROM JSON
        var start = 50;
        var genStep = 200;
        if ( iCounter == start ) this.popOneTet();

        if ( iCounter % genStep == 0 ) {
          TC.apomixis = true;
          AC.createTet = false;
          AC.p_mergeAgents = false;

        }
        else{
          TC.apomixis = false;
          AC.createTet = false;
          AC.p_mergeAgents = true;

        }
        break;

      case "MEIOSIS":
        //----- LOAD FROM JSON
        var start = 50;
        var genStep = 200;
        if ( iCounter == start ) this.popOneTet();

        if ( iCounter % genStep == 0 ) {
          if ( this.tetAgents.length < 2) TC.apomixis = true;
          else TC.meiosis = true;

          AC.createTet = false;
          AC.p_mergeAgents = false;
        }
        else{
          TC.apomixis = false;
          TC.meiosis = false;
          AC.createTet = false;
          AC.p_mergeAgents = false;
        }
        break;

      case "LOAD":
        //----- LOAD FROM JSON
        var start = 50;
        if ( iCounter == start ){
          this.loadJSON( CANDIDAT_11 );
          this.bakeAgents();
        } 
        // if ( iCounter == start+1 ) bakeFlag = false;
        playFlag = false;
        break;
        
    }
  },// end populationHandlerOnRun

  //------------------------------------------------------- BAKE AGENTS
  bakeAgents : function(){
    // BAKE TET-AGENTS
    for (var i = 0; i < this.tetAgents.length; i++) {
      if ( this.tetAgents[i].poly == null ) {
        this.tetAgents[i].init();
        this.tetAgents[i].getFabricationGeometry();
      }
    }

    // BAKE POLY-AGENTS
    for (var i = 0; i < this.polyAgents.length; i++) {
        this.polyAgents[i].getFabricationGeometry();
    }

    // SWAP POINTS
    for (var i = 0; i < this.tetAgents.length; i++) {
      if ( this.tetAgents[i].poly == null ) {
        this.tetAgents[i].cloneFromNeighbours();
        this.tetAgents[i].displayFabGeo( VS.finalVisibility );
      }
    }

    // BAKE POLY-AGENTS
    for (var i = 0; i < this.polyAgents.length; i++) {
        this.polyAgents[i].cloneFromNeighbours();
        this.polyAgents[i].displayFabGeo( VS.finalVisibility );
    }
  },// end bakeAgents

  //------------------------------------------------------- ADD ONE META-AGENT
  popOne : function(location){
    var ma = new Agent(location, this.container);
    this.container.push(ma);
    this.pointGeo.vertices[this.count] = ma.loc;
    this.count++;
    return ma;
  },// end popRandom

  //------------------------------------------------------- ADD A GROUP OF META-AGENT
  popGroup : function(location, amount){
    var d = 50
    var group = [];
    for (var i = 0; i < amount; i++) {
     var rv = new THREE.Vector3(
      map(Math.random(), 0, 1, -d, d),
      map(Math.random(), 0, 1, -d, d),
      map(Math.random(), 0, 1, -d, d)
      ); 

     group.push( this.popOne( new THREE.Vector3().addVectors(location, rv) ) );
    }
    return group;
  },// end popGroup

  //------------------------------------------------------- POP STRATEGY PER ROW
  popPlanar_OnFlag : function(){
    // STRATEGY : GROWING
    var vox;
    if(populationFlag){

      for (var i = 0, il = this.environment.voxels.length; i < il; i++) {
        for (var j = 0, jl = this.environment.voxels[i].length; j < jl; j++) {
          if (i == genCount * 3) {

            for (var k = 0, kl = this.environment.voxels[i][j].length; k < kl; k++) {
              vox = this.environment.voxels[i][j][k];
              var vec1 = new THREE.Vector3().copy(vox);
              var vec2 = new THREE.Vector3().copy(vox);

              //this.structuralAS.popOne(vec1);
              this.popOne(vec2);
            }
          }
        }
      }
    }
  },// end popStratOne

  //------------------------------------------------------- POP STRATEGY PER ROW
  popPlanar_OnFlag_2 : function(){
    // STRATEGY : GROWING

    if(populationFlag){

      var vox;

      var a = 1;
      var il = this.environment.voxels.length;
      var jl = this.environment.voxels[0].length;
      var kl = this.environment.voxels[0][0].length;

      var count = Math.floor(genCount - (Math.floor( genCount/ ((il * jl)/ (a * a)) ) * ((il * jl)/ (a * a)) ));
      // console.log(count, genCount);
      
      var i = Math.floor(count / (il / a));
      var j = Math.floor( ( count - ((i/a) * il) ) );
      var k = 0;

      var multi = 0.65;
      if (Math.floor( genCount/ ((il * jl)/ (a * a)) ) >= 2) multi = 0.6;;

      // console.log(multi);

      if (i*a < il && j*a < jl) {
        vox = this.environment.voxels[j*a][i*a][k];

        var close = false;
        var vec = new THREE.Vector3().copy(vox);

        for (var i = 0; i < this.container.length; i++) {
          var dist = vec.distanceTo(this.container[i].loc);
          if (dist < morphospace.minEdgelength * multi) {
            close = true;
            break;
          }
        }

        if(close == false) this.popGroup(vec, 1);
      }
    }
  },// end popStratOne

  //------------------------------------------------------- POP INITIAL TET
  popOneTet : function(){
    if(this.container.length == 0){
      // var i = Math.floor(Math.random() * this.environment.voxels.length);
      // var j = Math.floor(Math.random() * this.environment.voxels[0].length);
      // var k = Math.floor(Math.random() * this.environment.voxels[0][0].length);

      var i = Math.floor(0.5 * this.environment.voxels.length);
      var j = Math.floor(0.35 * this.environment.voxels[0].length);
      var k = Math.floor(0.5 * this.environment.voxels[0][0].length);

      var vec1 = new THREE.Vector3().copy(this.environment.voxels[i][j][k]);
      var group = this.popGroup(vec1, 4);

      var newTet = new TetAgent(group);
      newTet.init();
    }
  },// end popOneTet

  //------------------------------------------------------- SET PRODUCTIVE VOXELS
  setProductiveVoxels : function(){
    var maxCount = 150;
    var a, b, len;
    var ASl = this.container.length;
    if ( ASl < maxCount) {
      
      for (var i = 0, il = this.environment.voxels.length; i < il; i++) {
        for (var j = 0, jl = this.environment.voxels[i].length; j < jl; j++) {
          for (var k = 0, kl = this.environment.voxels[i][j].length; k < kl; k++) {
            
            len = this.environment.productiveVoxels.length;
            
            doLoop = true;
            if (len > 0 && 
                this.environment.productiveVoxels[len-1].x == i &&
                this.environment.productiveVoxels[len-1].y == j &&
                this.environment.productiveVoxels[len-1].z == k )  {
              // console.log(i,j,k);
              doLoop = false;
            }

            b = true;
            if(doLoop == true){
              for (var l = 0, ll = ASl; l < ll; l++) {
                a = this.container[l]

                if (a.closestEnvi.equals(this.environment.voxels[i][j][k])) {
                  b = false;
                  break;
                }
              }
            }

            if(b == true && i != 0 && j != 0){
              this.environment.productiveVoxels.push(new THREE.Vector3(i,j,k));
            }


          }
        }
      }
    }
  },// end setProductiveVoxels

  //------------------------------------------------------- POP STRATEGY PER ROW
  popProductiveVoxels_OnFlag : function(){
    // STRATEGY : GROWING
    var vox, random, id;

    if(genCount == 1) {
      this.environment.productiveVoxels.push(new THREE.Vector3(this.res * 0.5,this.res * 0.5 ,0));
    }

    if(populationFlag && this.environment.productiveVoxels.length != 0){
      
      random = Math.floor(Math.random()*this.environment.productiveVoxels.length);
      id = this.environment.productiveVoxels[random];

      vox = this.environment.voxels[id.x][id.y][id.z];

      var vec = new THREE.Vector3().copy(vox);
      // this.popOne(vec);
      this.popGroup(vec, 1);
    }
  },// end popProductiveVoxels_OnFlag

  //------------------------------------------------------- POP FROM UNOCCUPIED FACES
  popFreeFaces_OnFlag : function(){
    if(populationFlag){
      var vec = new THREE.Vector3(), dist, mindist = 99999999;
      var tet, fIdx, cvox, centr;
      var vox;

      for (var i = 0, il = this.environment.voxels.length; i < il; i++) {
        for (var j = 0, jl = this.environment.voxels[i].length; j < jl; j++) {
          for (var k = 0, kl = this.environment.voxels[i][j].length; k < kl; k++) {
            
            vox = this.environment.voxels[i][j][k];
            for (var m = 0, ml = this.tetAgents.length; m < ml; m++) {
              
              //CHECK IF IT HAS FREE FACES
              fIdx = this.tetAgents[m].getFreeFaceIdx();
              
              if ( fIdx.length != 0) {
                //CHECK IF IT IS CLOSEST
                centr = this.tetAgents[m].getCentre();
                vec.subVectors( centr , vox );
                dist = vec.length();

                if ( dist < mindist ) {
                  mindist = dist;
                  tet = this.tetAgents[m];
                  cvox = vox;
                }

              }
            }
          }
        }
      }

      if (typeof tet !== "undefined") {
        var idx = tet.getClosestFreeFaceIdx( cvox );
        var idx2 = tet.getFreeFaceIdx();

        var n = tet.getFaceNormal(idx);
        var loc = tet.getFaceCentre(idx);
        var arr = tet.getFaceAgents(idx);

        n.multiplyScalar(100);
        loc.add(n);
        var newAgent = this.popOne( loc );
        arr.push( newAgent );

        var newTet = new TetAgent(arr);
        newTet.init();

      }
    }
  },// end popFreeFaces_OnFlag_S

  //------------------------------------------------------- POP CARROUSSEL
  popCarroussel : function(){
    if(populationFlag){

      var startI = 0;
      var startJ = 0;

      var il = myEnvironment.voxels.length - 1;
      var jl = myEnvironment.voxels[0].length - 1;
      var count = genCount - Math.floor( genCount / (4 * il) ) * (4 * il);

      var i, j;
      if( Math.floor( count / il) == 0){ i = count; j = 1; }
      if( Math.floor( count / il) == 1){ i = il - 1; j = count - il; }
      if( Math.floor( count / il) == 2){ i = il - (count - (il + jl)); j = jl - 1; }
      if( Math.floor( count / il) == 3){ i = 1; j = jl-(count - (il + jl + il)); }
      // console.log(i,j);

      var vox = myEnvironment.voxels[i][j][0];
      this.popOne( new THREE.Vector3().copy(vox) );

    }
  },// end popCarroussel

  //------------------------------------------------------- POP FROM UNOCCUPIED FACES 
  popFreeFacesAndProductiveVoxels_OnFlag : function(){

    if(populationFlag){

      // GET CLOSE ENVI VOXELS
      var checkedTets = [];
      var vox, vid, dist, vec = new THREE.Vector3(), vecL, t, c, cid, n;
      loop1:
      for (var i = 0, il = this.environment.productiveVoxels.length; i < il; i++) {
            for (var m = 0, ml = this.tetAgents.length; m < ml; m++) {
              
              var rnd = Math.floor(Math.random() * il);

              if ( !(checkedTets.includes(m))  ) {
                vid = this.environment.productiveVoxels[rnd];
                vox = this.environment.voxels[vid.x][vid.y][vid.z];
                t = this.tetAgents[m];

                if ( t.occupiedFaces.length < 4 ) {
                  cid = t.getClosestFaceIdx( vox );
                  c = t.getFaceCentre( cid );
                  n = t.getFaceNormal( cid )
                  vec.subVectors( vox, c );
                  vecL = vec.length();
                  // console.log( vec, n );
                  //CHECK DOT PRODUCT
                  if (vec.dot( n ) >= 0 
                  && vecL < morphospace.maxEdgelength * 0.9
                  && vecL > morphospace.minEdgelength * 0.5){

                    n.setLength( morphospace.minEdgelength * 0.9 );
                    this.popOne( new THREE.Vector3().subVectors( vox,c ).setLength(mac.sepRadius).add(c));
                    checkedTets.push(m);
                    var a = t.getFaceAgents( cid );
                    a.push(this.container[this.count - 1]);
                    var nTet = new TetAgent(a);
                    nTet.init();
                    break loop1;
                  }
                }
              }
            }
          
        
      }
    }
  },// end popFreeFaces_OnFlag

  //------------------------------------------------------- POP FROM JSON
  popFromJSON : function(){

    for (var i = 0, il = save1.agents.length; i < il; i++) {
      var loca = new THREE.Vector3( save1.agents[i].location.x,
                                    save1.agents[i].location.y,
                                    save1.agents[i].location.z
                                  );
      this.popOne( loca );
      // una cerveza, loquita !!!
    }
  },// end popFromJSON

  //------------------------------------------------------- LOAD JSON
  loadJSON : function( json ){

    // CREATE AGENTS 
    console.log(json.agents.length);
    for (var i = 0, il = json.agents.length; i < il; i++) {
      var loca = new THREE.Vector3( json.agents[i].location.x,
                                    json.agents[i].location.y,
                                    json.agents[i].location.z
                                  );
      var agent = this.popOne( loca );
      agent.ID = json.agents[i].ID
      // una cerveza, loquita !!!
    }

    // CREATE TET-AGENTS 
    console.log(json.tetAgents.length);
    for (var i = 0, il = json.tetAgents.length; i < il; i++) {
      var ags = [];

      for (var j = 0; j < json.tetAgents[i].agentIDs.length; j++) {
        for (var k = 0; k < this.container.length; k++) {
          (this.container[k].ID == json.tetAgents[i].agentIDs[j]) ? ags.push(this.container[k]) : null;
        }
      }

      var ta = new TetAgent(ags);
      ta.ID = json.tetAgents[i].ID;
      ta.ms = json.tetAgents[i].morphospace;
      ta.occupiedFaces = json.tetAgents[i].occupiedFaces;
      this.tetAgents.push(ta);
    }

    // INIT TET AGENTS
    for (var i = 0, il = this.tetAgents.length; i < il; i++) {
      this.tetAgents[i].init();
    }

    // CREATE POLY-AGENTS 
    console.log(json.polyAgents.length);
    for (var i = 0, il = json.polyAgents.length; i < il; i++) {
      
      var pa = new PolyAgent();

      // TET-AGENTS
      for (var j = 0; j < json.polyAgents[i].tetAgentIDs.length; j++) {
        for (var k = 0; k < this.tetAgents.length; k++) {
          if (this.tetAgents[k].ID == json.polyAgents[i].tetAgentIDs[j]) {
           pa.addTetAgent(this.tetAgents[k]);
         }
        }
      }
      
      pa.ID = json.polyAgents[i].ID;
      pa.ms = json.polyAgents[i].morphospace;
      pa.init();
    }

    var singleCounter = 0;
    for (var i = 0; i < this.tetAgents.length; i++) {
      if(this.tetAgents[i].poly == null) singleCounter++;
    }
    console.log(singleCounter);
  },// end popFromJSON

  //------------------------------------------------------- MAKE TETRAHEDRON
  // IT IS NOT POSSIBLE TO ADD VERTICES
  // TO AN OBJECT THAT HAS BEEN ALREADY
  // RENDERED FOR THE FIRST TIME
  // THAT´S WHY FIRST CREATE A STOCK OF
  // VERTICES THAT CAN BE USED LATER
  createStockVertices : function(){
    var x,y,z;
    for (var i = 0; i < this.stockVertCount; i++) {
      // MAKE A CIRCLE / LOOKS NICER :)
      // x = X/2 + X/2 * Math.cos(i);
      // y = -100;
      // z = Y/2 + Y/2 * Math.sin(i);

      x = (map(Math.random(),0.5,1,-4 * X, X * 4) + X/2) ;
      y = (map(Math.random(),0.5,1,-4 * Y, Y * 4) + Y/2) ;
      z = (map(Math.random(),0.5,1,-4 * Z, Z * 4) + Z/2) ;

      this.pointGeo.vertices.push(new THREE.Vector3(x,y,z));
    }
  }// end createStockVertices

  //----------------------------------------------------------------------------- END META AGENT SYSTEM
}