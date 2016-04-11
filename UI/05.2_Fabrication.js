

// ---------------------------------------------------------------------------- FABRICATION VARIABLES
// var FS = {
//   unfoldingMethode : "GLOBAL", // LOCAL || GLOBAL
//   unfoldingNormal : new THREE.Vector3(0,1,0),
//   unfoldingTarget : new THREE.Vector3(0,0,0),
//   unfoldingArrayX : 10,
//   unfoldingScene : "scene",
//   unfoldFrame : true,
//   offsetX : new THREE.Vector3(500,0,0),
//   count : 0,
// };

// ---------------------------------------------------------------------------- EXAMPLE POLY AGENT
function examplePoly(){

  switch( FS.unfoldingMethode ){
    case "LOCAL":
      var offset = -1000;
      break;

    case "GLOBAL":
      var offset = 0;
      break;
  }

  poly = myAgentSystem.polyAgents[0];
  
  poly.displayFabGeo();
  poly.getUnfoldedGeometry();

  // UNFOLDED OUTLINE
  for (var i = 0; i < poly.ug.stripes.length; i++) {
    // FRAME
    poly.ug.stripes[i].frameGeo.translate(0,0, offset);
    scene.add( new THREE.Mesh(poly.ug.stripes[i].frameGeo, ml.wire_grey) );
    // OUTLINE
    // poly.ug.stripes[i].outlineGeo.translate(0,0, offset);
    // scene.add( new THREE.Mesh(poly.ug.stripes[i].outlineGeo, ml.points_10_blueB) );
    // OPENING
    // poly.ug.stripes[i].openingGeo.translate(0,0, offset);
    // scene.add( new THREE.Mesh(poly.ug.stripes[i].openingGeo, ml.points_10_blueB) );
    // JOINTS
    poly.ug.stripes[i].jointsGeo.translate(0,0, offset);
    scene.add( new THREE.Points(poly.ug.stripes[i].jointsGeo, ml.points_10_blueB) );
    // CUT LINES
    for (var j = 0; j < poly.ug.stripes[i].cutGeos.length; j++) {
      scene.add( new THREE.Line(poly.ug.stripes[i].cutGeos[j], ml.line_blueB) );      
    };
  }
}// end randomPoly

// ---------------------------------------------------------------------------- EXAMPLE TET AGENT
function exampleTet(){

  switch( FS.unfoldingMethode ){
    case "LOCAL":
      var offset = -1000;
      break;

    case "GLOBAL":
      var offset = 0;
      break;
  }

  // console.log(myAgentSystem.tetAgents.length);
  var tet = myAgentSystem.tetAgents[2];

  // tet.getFabricationGeometry();
  tet.displayFabGeo();
  tet.getUnfoldedGeometry();

  // console.log(tet.fg);
  // UNFOLDED OUTLINE
  for (var i = 0; i < tet.ug.stripes.length; i++) {
    // FRAME
    tet.ug.stripes[i].frameGeo.translate(0,0, offset);
    scene.add( new THREE.Mesh(tet.ug.stripes[i].frameGeo, ml.wire_grey) );
    // OUTLINE
    // tet.ug.stripes[i].outlineGeo.translate(0,0, offset);
    // scene.add( new THREE.Mesh(tet.ug.stripes[i].outlineGeo, ml.points_10_blueD) );
    // OPENING
    // tet.ug.stripes[i].openingGeo.translate(0,0, offset);
    // scene.add( new THREE.Mesh(tet.ug.stripes[i].openingGeo, ml.points_10_blueD) );
    // JOINTS
    tet.ug.stripes[i].jointsGeo.translate(0,0, offset);
    scene.add( new THREE.Points(tet.ug.stripes[i].jointsGeo, ml.points_10_blueD) );
    // CUT LINES
    for (var j = 0; j < tet.ug.stripes[i].cutGeos.length; j++) {
      scene.add( new THREE.Line(tet.ug.stripes[i].cutGeos[j], ml.line_blueD) );      
    };
  }
  // unfoldTetrahedron( myAgentSystem.tetAgents[0].getGeometry() );
}// end exampleTet

// ---------------------------------------------------------------------------- FABRICATE ALL TETS
function fabAllTets(){

  switch( FS.unfoldingMethode ){
    case "LOCAL":
      var offset = -1000;
      break;

    case "GLOBAL":
      var offset = 0;
      break;
  }

  // console.log(myAgentSystem.tetAgents.length);
  console.log(myAgentSystem.tetAgents.length);
  var countTet = 0;
  for (var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++) {
    if (myAgentSystem.tetAgents[i].poly === null){
      countTet++;
      var tet = myAgentSystem.tetAgents[i];

      // tet.getFabricationGeometry();
      tet.displayFabGeo();
      tet.getUnfoldedGeometry();

      for (var j = 0; j < tet.ug.stripes.length; j++) {
        // FRAME
        tet.ug.stripes[j].frameGeo.translate(0,0, offset);
        scene.add( new THREE.Mesh(tet.ug.stripes[j].frameGeo, ml.wire_grey) );
        // OUTLINE
        // tet.ug.stripes[j].outlineGeo.translate(0,0, offset);
        // scene.add( new THREE.Mesh(tet.ug.stripes[j].outlineGeo, ml.points_10_blueD) );
        // OPENING
        // tet.ug.stripes[j].openingGeo.translate(0,0, offset);
        // scene.add( new THREE.Mesh(tet.ug.stripes[j].openingGeo, ml.points_10_blueD) );
        // JOINTS
        tet.ug.stripes[j].jointsGeo.translate(0,0, offset);
        scene.add( new THREE.Points(tet.ug.stripes[j].jointsGeo, ml.points_10_blueD) );
        // CUT LINES
        for (var k = 0; k < tet.ug.stripes[j].cutGeos.length; k++) {
          scene.add( new THREE.Line(tet.ug.stripes[j].cutGeos[k], ml.line_blueD) );      
        }
      }
    }
  }
  console.log(countTet);
  console.log(myAgentSystem.tetAgents.length);
}// end exampleTet

// ---------------------------------------------------------------------------- FABRICATE ALL POLYS
function fabAllPolys(){

  switch( FS.unfoldingMethode ){
    case "LOCAL":
      var offset = -1000;
      break;

    case "GLOBAL":
      var offset = 0;
      break;
  }

  console.log(myAgentSystem.polyAgents.length);
  for (var i = 0, il = myAgentSystem.polyAgents.length; i < il; i++) {
    
    poly = myAgentSystem.polyAgents[i];  
    poly.displayFabGeo();
    poly.getUnfoldedGeometry();

    // UNFOLDED OUTLINE
    for (var j = 0; j < poly.ug.stripes.length; j++) {
      // FRAME
      poly.ug.stripes[j].frameGeo.translate(0,0, offset);
      scene.add( new THREE.Mesh(poly.ug.stripes[j].frameGeo, ml.wire_grey) );
      // OUTLINE
      // poly.ug.stripes[j].outlineGeo.translate(0,0, offset);
      // scene.add( new THREE.Mesh(poly.ug.stripes[j].outlineGeo, ml.points_10_blueB) );
      // OPENING
      // poly.ug.stripes[j].openingGeo.translate(0,0, offset);
      // scene.add( new THREE.Mesh(poly.ug.stripes[j].openingGeo, ml.points_10_blueB) );
      // JOINTS
      poly.ug.stripes[j].jointsGeo.translate(0,0, offset);
      scene.add( new THREE.Points(poly.ug.stripes[j].jointsGeo, ml.points_10_blueB) );
      // CUT LINES
      for (var k = 0; k < poly.ug.stripes[j].cutGeos.length; k++) {
        scene.add( new THREE.Line(poly.ug.stripes[j].cutGeos[k], ml.line_blueB) );      
      }
    }
  }

}// end randomPoly