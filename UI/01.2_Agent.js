//----------------------------------------------------------------------------- META AGENT OBJECT
Agent = function(_loc, tmyAgentSystem) {

  //--------------------------------- VARIABLES
  // META AGENT VARIABLES
  this.ID = Math.round(Math.random() * 10000);                      // ID
  this.myAgentSystem = tmyAgentSystem;          // CONTAINER OF ALL AGENTS
  
  // RELATIONS
  this.closestAgents = [];                      // ALL AGENTS IN this.cohRadius RANGE
  this.closestAgent = null;                     // THE VERY CLOSEST AGENT
  this.closestTet = null;                       // CLOSEST TET AGENT
  this.closestEnvi = new THREE.Vector3();       // CLOSEST ENVIRONMENT LOCATION
  
  this.connectedTet = [];                       // CONNECTED TETRAHEDRONS
  this.globalPlanes = myEnvironment.cPlanes;    // BOTTOM AND TOP PLANE

  // PROPERTIES
  this.loc = _loc;                              // LOCATION VECTOR
  this.acc = new THREE.Vector3(0,0,0);          // ACCELERATION VECTOR
  this.speed = new THREE.Vector3(0, 0, 0);      // SPEED VECTOR

  // STATES
  this.stable = false;                        // MOVING OR NOT
}

Agent.prototype = {

  constructor : Agent,
  
  //------------------------------------------------------- RUN
  run : function(){

    // CALL FUNCTIONS
    // DECIDE HOW TO BEHAVE
    this.prefrontalCortex();
    this.environmentCommunication();
    this.limitToPlanes();
    this.move();
  },// end run

  //------------------------------------------------------- BEHAVIORAL CONTROL
  prefrontalCortex : function(){

    // CHECK IF PART OF TET-AGENTS OR NOT
    if (this.connectedTet.length != 0) {
      // CONNECTED :
      this.gravity();
      this.getCloseAgents();
      this.avoidPenetration();
      this.crowdBehavior(); // OPTIMISE CONNECTED TETS
      this.populationBehavior() // CONNECT TO OTHER TETS BY CREATING NEW TETS
    }
    else{
      // NOT CONNECTED :
      this.singleBehavior();
    }
  },// end prefrontalCortex

  //------------------------------------------------------- CROWD BEHAVIOR
  crowdBehavior : function(){
    // OPTIMISE CONNECTED TETS
    var steer = new THREE.Vector3(), count = 0;
    for (var i = 0, il = this.connectedTet.length; i < il; i++) {
      // EVALUATE TET
      // A : EDGE LENGTH
      var eo = this.connectedTet[i].edgeOptimisation( this );
      eo.setLength(AC.edgeLengthOpti);
      steer.add(eo);

      // B : EDGE ANGLES
      var eao = this.connectedTet[i].edgeAngleOptimisation( this );
      eao.setLength(AC.edgeAngleOpti);
      steer.add(eao);

      // C : FACE ANGLES
      var efao = this.connectedTet[i].faceAngleOptimisation( this );
      efao.setLength(AC.edgeFaceOpti);
      steer.add(efao);
    }

    // if (this.connectedTet.length < 4) {
    //   this.acc.add(steer);
    // }

    steer.divideScalar(this.connectedTet.length * AC.viscosity);
    this.acc.add(steer);  
  },// end crowdBehavior

  //------------------------------------------------------- POPULATION BEHAVIOR
  populationBehavior : function(){
    
    if (this.closestAgent != null) {
      // CHECK IF CLOSEST IS NOT PART OF MY TETS
      var bool = true   
      for (var i = 0; i < this.connectedTet.length; i++) {
        if (this.connectedTet[i].agents.indexOf(this.closestAgent) != -1) {
          // console.log("fuck");
          bool = false;
          break;
        }
      }

      // CHECK DISTANCE TO CLOSE AGENT
      var dist = this.loc.distanceTo(this.closestAgent.loc);
      
      // IF CLOSE
      if (bool == true && dist < morphospace.minEdgelength * AC.distanceFactor) {
        var agentsA = [];
        var agentsC = [];
        
        for (var i = 0, il = this.connectedTet.length; i < il; i++) {
          agentsA = agentsA.concat(this.connectedTet[i].agents);
        }

        for (var i = 0, il = this.closestAgent.connectedTet.length; i < il; i++) {
          agentsC = agentsC.concat(this.closestAgent.connectedTet[i].agents);
        }

        // GET SHARED AGENTS
        var sharedAgents = [];
        for (var i = 0, il = agentsA.length; i < il; i++) {

          if ( agentsC.indexOf( agentsA[i] ) != -1 
              && sharedAgents.indexOf( agentsA[i]) == -1 
              && agentsA[i] != this
              && agentsA[i] != this.closestAgent) {

            sharedAgents.push( agentsA[i] );
            if (sharedAgents.length == 2) break;
          }
        }

        // IF THEY HAVE 2 SHARED NEIGHBOURS : MAKE TET
        if ( sharedAgents.length == 2 && AC.p_fillTet) {
          sharedAgents.push(this);
          sharedAgents.push(this.closestAgent);

          var newTet = new TetAgent( sharedAgents );
          newTet.init();
          console.log("filltet");

        }

        // IF THEY HAVE 1 SHARED NEIGHBOURS : EXCHANGE AGENT
        // "POINT MERGE"
        if (     sharedAgents.length == 1 
              && this.closestAgent.connectedTet.length <= 1
              && this.connectedTet.length <= 1
              && AC.p_mergeAgents
              && dist <= AC.p_mergeDistance
              ) {
           var ca = this.closestAgent;
           var idx;
          // REPLACE CLOSEST AGENT WITH THIS IN TET AGENTS
          for (var i = 0; i < ca.connectedTet.length; i++) {
            idx = ca.connectedTet[i].agents.indexOf(ca);
            ca.connectedTet[i].agents[idx] = this;
          }

          // REMOVE CONNECTET TETS
          ca.connectedTet = [];
          console.log("merged");
        }

      }
    }
  },// end populationBehavior

  //------------------------------------------------------- SINGLE BEHAVIOR
  singleBehavior : function(){
    this.getCloseAgents();

    if (myAgentSystem.tetAgents.length == 0) {
      this.createFirstTet();
    }
    else{
      this.getClosestTet();
      if ( AC.createTet == true ) {
       this.createTet();
      }
    }
    
    this.cohAndSep();
  },// end crowdBehavior

  //------------------------------------------------------- CREATE TETRAHEDRONS
  createTet : function(){

    if (this.closestTet != null 
        && this.closestTet.isStable() 
        && this.closestTet.occupiedFaces.length < 4) {
    // if (this.closestTet != null && this.closestTet.occupiedFaces.length != 4) {
      // CHECK DISTANCE
      var center = this.closestTet.getCentre();
      var dist = this.loc.distanceTo( center );

      if (dist < AC.ct_maxDist && dist > AC.ct_minDist) {

        // GET BEST FACE IDX
        var ulf = this.closestTet.getUnlockedFacesIdx();
        var clf = this.closestTet.getClosestFreeFaceIdx( this.loc );
        
        var idx;
        switch (AC.p_FacesToUse){
          case "UNLOCKED":
            idx = (ulf.length == 0) ? clf : ulf[0];
            break;

          case "FREE" :
            idx = this.closestTet.getClosestFreeFaceIdx( this.loc );
            break;

        }

        if ( idx != undefined) {
          var norm = this.closestTet.getFaceNormal( idx );      
          center = this.closestTet.getFaceCentre( idx );
          var vec = new THREE.Vector3().subVectors( this.loc, center );
          
          // CHECK DOTPRODUCT
          if ( vec.dot(norm) > 0) {
            var group = this.closestTet.getFaceAgents( idx );
            group.push(this);
            
            // CREATE TET
            var newTet = new TetAgent( group );
            newTet.init();
          }

          else{
            var steer = this.closestTet.getFaceCentre( idx );
            steer.add( norm.multiplyScalar(this.closestTet.ms.minEdgelength) );
            steer.sub(this.loc);
            steer.limit( AC.ct_Mag );
            this.acc.add(steer);
            // console.log("mannn");
          }

        }

        else console.log("WARNING : idx undefined");
      }
    }
  },// end createTet

  //------------------------------------------------------- CREATE TETRAHEDRONS
  createFirstTet : function(){

    if (myAgentSystem.tetAgents.length == 0) {
      if (this.closestAgents.length >= 3) {
        var group = this.closestAgents.slice(0,3);
        group.push(this);

        var newTet = new TetAgent( group );
        newTet.init();
      }
    }
  },// end createTet

  //------------------------------------------------------- GET CLOSE AGENT
  getCloseAgents : function(){

    // RESET VARIABLES
    this.closestAgents = [];
    this.closestAgent = null;

    // GET CLOSEST AGENTS
    var tempAgent, distance, mindist = 99999999;
    for ( var i = 0, il = this.myAgentSystem.length; i < il; i++ ){
      tempAgent = this.myAgentSystem[i];

      // CHECK IF IT IS NOT THIS AND NOT ALREADY IN ARRAY
      if ( tempAgent.ID != this.ID && this.closestAgents.indexOf( tempAgent ) == -1 ){
        distance = this.loc.distanceTo( tempAgent.loc );
        // CLOSEST META AGENTS
        if( distance <= AC.ca_Radius ){
          // CREATE NEW
          this.closestAgents.push( tempAgent ); 
          // GET CLOSEST AGENT
          if (distance < mindist) {
            mindist = distance;
            this.closestAgent = tempAgent;
          }
        }
      }
    }
  },// end getCloseAgents

  //------------------------------------------------------- GET CLOSE TET AGENT
  getClosestTet : function(){

    // RESET VARIABLES
    this.closestTet = null;

    // GET CLOSEST TET AGENT
    var tempTet, centr, distance, mindist = 99999999;
    var repellSteer = new THREE.Vector3(), count = 0;

    for ( var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++ ){
      
      tempTet = myAgentSystem.tetAgents[i];
      centr = tempTet.getCentre();
      distance = this.loc.distanceTo( centr );  
      
      // GET CLOSEST AGENT
      if (distance < mindist 
        && distance >= AC.clt_minRad
        && tempTet.occupiedFaces.length != 4) {
        
        mindist = distance;
        this.closestTet = tempTet;
      }
      else if (distance < AC.clt_minRad) {
        // MOVE OUT IF TOO CLOSE
        repellSteer.add( 
          new THREE.Vector3()
          .subVectors( this.loc, centr )
          .limit( AC.clt_Mag ) 
          );
        count++;
      }
    }

    // COHESION
    if ( this.closestTet != null) {
      centr = this.closestTet.getCentre();
      this.acc.add( 
            new THREE.Vector3()
            .subVectors( centr, this.loc )
            .limit( AC.clt_Mag ) 
            );
    }

    //SEPARATION
    if (count != 0) {
      repellSteer.divideScalar(count);
      this.acc.add( repellSteer.limit( AC.clt_Mag ) );
    }
  },// end getCloseAgents

  //------------------------------------------------------- COHESION AND SEPARATION
  cohAndSep : function(){

    var agent, distance, 
    sepSteer = new THREE.Vector3(), sepCount = 0;
    cohSteer = new THREE.Vector3(), cohCount = 0;

    // FOR CLOSEST META AGENTS
    for (var i = 0, il = this.closestAgents.length; i < il; i++) {
      agent = this.closestAgents[i];
      distance = agent.loc.distanceTo(this.loc);

      // SEPARATION
      if (distance <= AC.cs_sepRad ) {
        sepSteer.add( new THREE.Vector3().subVectors( this.loc, agent.loc ) );
        sepCount++;
      }

      // COHESION
      if ( distance >= AC.cs_cohRad ) {
        cohSteer.add( new THREE.Vector3().subVectors( agent.loc, this.loc ).multiplyScalar(distance) );
        cohCount++;
      }
    }

    if(sepCount != 0){sepSteer.divideScalar(sepCount);}
    sepSteer.limit(AC.cs_sepMag);
    this.acc.add(sepSteer);

    if(cohCount != 0){cohSteer.divideScalar(cohCount);}
    cohSteer.limit(AC.cs_cohMag);
    this.acc.add(cohSteer);
  },// end cohAndSep

  //------------------------------------------------------- LIMIT TO ENVIRONMENT
  environmentCommunication : function(){
    // COHESION TO ENVIRONMENT POINTS
    var dist, min = 9999999;
    var steer = new THREE.Vector3(0,0,0);

    for (var i = 0, il = myEnvironment.voxels.length; i < il; i++) {
      for (var j = 0, jl = myEnvironment.voxels[i].length; j < jl; j++) {
        for (var k = 0, kl = myEnvironment.voxels[i][j].length; k < kl; k++) {

          var voxloc = new THREE.Vector3().copy(myEnvironment.voxels[i][j][k]);
          dist = voxloc.distanceTo(this.loc);

          // COHESION TO ENVIRONMENT
          if ( dist < min ) {
            min = dist;
            steer = voxloc;

            if ( dist >= AC.ec_Rad ) {
              this.closestEnvi = voxloc;
            }
          }
        }
      }
    }

    steer.sub( this.loc );
    steer.limit( AC.ec_Mag );
    this.acc.add( steer );  
  },// end environmentCommunication

  //------------------------------------------------------- STICK TO ENVIRONMENT PLANES
  limitToPlanes : function(){
    // ENSURE THAT WALL END WITH C-PLANES
    var p, steer, u = new THREE.Vector3();

    for (var i = 0; i < this.globalPlanes.length; i++) {

      p = this.globalPlanes[i].plane;
      steer = p.projectPoint(this.loc);
      steer.sub(this.loc);
      u.copy(steer).setLength(1);

      // IF OUT OF PLANE BUONDARY
      if( u.sub( p.normal).length() <= 1.0){
        this.acc.add( steer.divideScalar( AC.lp_PlaneMag ) );
      }

      // IF BTW. TOP & BOTTOM PLANE
      else{
        // COHESION TO PLANE IF CLOSE
        if ( steer.length() < AC.lp_Rad ) {
          this.acc.add(steer.limit( AC.lp_Mag ));
        }
      }
    }
  },// end limitToPlanes

  //------------------------------------------------------- GRAVITY
  gravity : function(){

    var steer = new THREE.Vector3().copy(GP.gravity);
    steer.multiplyScalar(GP.gravityMag);

    this.acc.add(steer);
  },// end gravity

  //------------------------------------------------------- GRAVITY
  avoidPenetration : function(){

    var tempTet, steer;
    for (var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++) {
      tempTet = myAgentSystem.tetAgents[i];
      if (this.connectedTet.indexOf(tempTet) == -1) {
        var result = tempTet.isPointInside( this.loc );
        if (result[0] == true) steer = result[1];
      }
    }

    if (steer !== undefined) {
      this.acc.add( steer.setLength( AC.avoidPenetration ) );
    }
  },// end avoidPenetration

  //------------------------------------------------------- AGENT MOVE
  move : function(){

    // MOVE ONLY WHEN ACCELERATION RECHES A CERTAIN THESHOLD
    if (this.acc.length() > AC.m_treshold ) {
      this.speed.add(this.acc);
      this.speed.limit( AC.m_speedLimit );
      this.loc.add(this.speed);
      this.stable = false;
    }
    else{
      this.stable = true;
    }
    // CLEAR ACCELERATION & SPEED
    this.acc = new THREE.Vector3(0,0,0);
    this.speed = new THREE.Vector3(0,0,0);
  },// end move  

  //------------------------------------------------------- SAVE TO JSON
  getJSON : function(){
    var object = {};

    object.ID = this.ID;
    object.location = this.loc;
    object.stable = this.stable;

    var connectedTetIDS = [];
    for (var i = 0, il = this.connectedTet.length; i < il; i++) {
      connectedTetIDS.push(this.connectedTet[i].ID);
    }

    object.connectedTetID = connectedTetIDS;

    return object;
  }// end getJSON
  // P L A Y G R O U N D
  // E N D   P L A Y G R O U N D
//---------------------------------------------------------------------------- END AGENT
}