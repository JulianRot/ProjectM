
// ---------------------------------------------------------------------------- UTILITIES

// ---------------------------------------------------------------------------- MAP LINEAR
function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    //
}// end map

// ---------------------------------------------------------------------------- CLAMP A NUMBER
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
  //
}// end clamp number

// ---------------------------------------------------------------------------- ADD LIMIT TO VECTOR3 CLASS
THREE.Vector3.prototype.limit = function( len ){
  // THHIS IS ADDING THE LIMIT METHODE 
  // TO THE THREE.VECTOR3 CLASS
  var lSq = this.lengthSq();

  if( lSq > len * len ){
    // NORMALIZE IT :
    this.divideScalar( Math.sqrt( lSq ) ); 
    this.multiplyScalar( len );
  }
  
  return this;
}// end THREE.Vector3.prototype.limit

// ---------------------------------------------------------------------------- ADD EQUALS TO TOLERANCE TO VECTOR3 CLASS
THREE.Vector3.prototype.equalsTolerance = function( v , t ){

  return ( (    Math.abs(v.x - this.x) <= t ) 
          && (  Math.abs(v.y - this.y) <= t ) 
          && (  Math.abs(v.z - this.z) <= t ) );

}// end THREE.Vector3.prototype.equalsTolerance

// ---------------------------------------------------------------------------- COMPARE 2 VECTORS IF SIMILAR
function similarVectors(vector1, vector2, tolerance){
  var a = Math.abs(vector1.x - vector2.x);
  var b = Math.abs(vector1.y - vector2.y);
  var c = Math.abs(vector1.z - vector2.z);

  if (a <= tolerance && b <= tolerance && c <= tolerance ) {
    return true;
  }
  else { return false;}
}// end similarVectors

// ---------------------------------------------------------------------------- CONVERT RADIANS TO DEGREE
function radians(degrees){
  return degrees * Math.PI / 180;
}// end radians

// ---------------------------------------------------------------------------- CONVERT DEGREE TO RADIANS
function degrees(radians){
  return radians * 180 / Math.PI;
}// end degrees

// ---------------------------------------------------------------------------- MAKE FILLET CORNER
function getfilletPointsCorner(point, vectorA, vectorB, distance, resolution){
  var filletPoints = [];

  var step = 1 / resolution;
  var angle = vectorA.angleTo(vectorB);
  var h = Math.abs( distance / Math.cos(angle * 0.5) );
  var vM = new THREE.Vector3().addVectors(vectorA, vectorB).setLength( h );
  var m = new THREE.Vector3().addVectors( point, vM );
  var a = new THREE.Vector3().addVectors( point, vectorA);
  var b = new THREE.Vector3().addVectors( point, vectorB);
  var vecA = new THREE.Vector3().subVectors(a, m);
  var vecB = new THREE.Vector3().subVectors(b, m);
  var r = vecA.length();

  for (var i = 0; i < resolution + 1; i++) {
    var vec = new THREE.Vector3().lerpVectors(vecA, vecB, i * step);
    vec.setLength(r);
    vec.add(m);
    filletPoints.push( vec );
  }

  return filletPoints;
}// end getfilletPointsCorner

// ---------------------------------------------------------------------------- EXPORT TO OBJ FILE FORMAT
function exportToObj (){
  var exporter = new THREE.OBJExporter ();
  var result = exporter.parse (scene);
  var filename = "160403_MorphospaceTest_" + morphospace.minEdgelength;
  var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
  saveAs(blob, filename+".obj");

  exportMetaData(filename);
}// end exportToObj

// ---------------------------------------------------------------------------- EXPORT META DATA
function exportMetaData(_filename){

  var text1 = "morphospace";
  text1 += JSON.stringify(morphospace,null,'\r\n');
  text1 += "\r\n";
  text1 += "\r\n";

  var text2 = "Number Agents: " + "{" + JSON.stringify(myAgentSystem.count) + "}";
  text2 += "\r\n";
  text2 += "\r\n";

  var text3 = "Number Meta-Agents: " + "{" + JSON.stringify(myAgentSystem.tetAgents.length) + "}" ;
  text3 += "\r\n";
  text3 += "\r\n";

  var text4 = "Number Meta-Meta-Agents: " + "{" + JSON.stringify(myAgentSystem.polyAgents.length) + "}";
  text4 += "\r\n";
  text4 += "\r\n";

  var text5 = "AC";
  text5 += JSON.stringify(AC,null,'\r\n');
  text5 += "\r\n";
  text5 += "\r\n";

  var text6 = "TC";
  text6 += JSON.stringify(TC,null,'\r\n');
  text6 += "\r\n";
  text6 += "\r\n";

  var text7 = "Generation Step: " + "{" +   genStep + "}" ;
  text7 += "\r\n";

  var text8 = "Stop Time: " + "{" +   stoptime + "}" ;
  text8 += "\r\n";

  var output = text1 + text2 + text3 + text4 + text5 + text6 + text7 + text8;

  var blob = new Blob([output], {type: "text/plain;charset=utf-8"});
  saveAs(blob, _filename+".txt");
}// end exportMetaData

// ---------------------------------------------------------------------------- SELECT OBJECTS
function selectObjects (_raycaster, _INTERSECTED){

	_raycaster.setFromCamera( mouse, camera);
  var intersects = _raycaster.intersectObjects( scene.children );

  // console.log(intersects);
  if ( intersects.length > 0) {
  	/// 					!!!!!	something Missing here 	!!!!
  }
  else{
    if (_INTERSECTED instanceof THREE.Mesh) {
      _INTERSECTED.material.color.setHex(_INTERSECTED.currentHex);
    }
    _INTERSECTED = null;
  }
}// end selectObjects

// ---------------------------------------------------------------------------- ADDITIONAL
function spaceCube(){
  // FLOOR
  var n = new THREE.Vector3(0,1,0);
  var geometry1 = new THREE.Geometry();
  geometry1.vertices.push(
    new THREE.Vector3(0,0,0),
    new THREE.Vector3(X,0,0),
    new THREE.Vector3(X,0,Z),
    new THREE.Vector3(0,0,Z)
  );

  geometry1.faces.push(
    new THREE.Face3(0,1,2,n),
    new THREE.Face3(2,3,0,n)
  );

  // OUTLINE
  var curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6,-5,-6),
    new THREE.Vector3(X+6,-5,-6),
    new THREE.Vector3(X+6,-5,Z+6),
    new THREE.Vector3(-6,-5,Z+6),
    new THREE.Vector3(-6,-5,-6)
  ]);

  var geometry2 = new THREE.Geometry();
  geometry2.vertices = curve.getPoints( 4 );



  //Create the final Object3d to add to the scene
  var floor = new THREE.Mesh( geometry1, ml.floor );
  var outline = new THREE.Line( geometry2, ml.line_grey );
  
  floor.material.side = THREE.DoubleSide;
  floor.renderOrder = 0;


  // scene.add(floor);
  ENVIRONMENT.add(outline);
}// end spaceCube

// ---------------------------------------------------------------------------- FIND FACES
// RECURSIVE FACE RECOGNITION
function recFace (agent, array, output){
  array.push(agent);

  if(array.length < 5){

    if(array.length > 3 && array[array.length -1] == array[0]){
      output.push(array);
    }

    else{
      for (var i = 0; i < agent.closestAgents.length; i++) {
      var nArray = array.slice();
      recFace(agent.closestAgents[i], nArray, output);
      }
    }
  }
}// end recFace

// ---------------------------------------------------------------------------- FIND LOOPS
// RECURSIVE FACE RECOGNITION
function recLoop (agent, array, output){
  array.push(agent);

  if(array.length < 6){

    if(array.length > 4 && array[array.length -1] == array[0]){
      output.push(array);
      //break;
    }

    else{
      for (var i = 0; i < agent.closestAgents.length; i++) {
      var nArray = array.slice();
      recLoop(agent.closestAgents[i], nArray, output);
      }
    }
  }
}// end recFace

// ---------------------------------------------------------------------------- COMPARE ARRAYS
// COMPARE IF TWO ARRAYS HAVE THE SAME ITEMS; INGORING THE ORDER
function containSameItems ( a, b ){
  var flag = true;

  if (a.length == b.length) {
    for (var i = 0; i < a.length; i++) {
      if (b.indexOf(a[i] != -1)) {
        flag = true;
      }
      else{
        flag = false;
        break;
      }
    }
  }
  else{
    flag = false;
  }

  return flag;
}// end containSameItems

// ---------------------------------------------------------------------------- FIND TETRAHEDRON
// TETRAHEDRON RECOGNITION
function recTet (orginal, output){

  for (var i = 0, il = orginal.closestAgents.length; i < il; i++) {

    var tetra = [];
    var n1 = orginal.closestAgents[i];
    var index = [];

    tetra.push(orginal);
    tetra.push(n1);

    for (var j = 0, jl = n1.closestAgents.length; j < jl; j++) {

      if ( orginal.closestAgents.indexOf(n1.closestAgents[j]) != -1 ) {
        index.push(j);
        if (index.length == 2) {break;}
      }
    }

    if (index.length == 2) {
      for (var k = 0; k < index.length; k++) {
        tetra.push(n1.closestAgents[index[k]]);
      }
      output.push(tetra);
    }
  }
}// end recFace

// ---------------------------------------------------------------------------- DELETE DUPLICATED FACES
var delDuplicates = function(array){
  var newArray = [];
  var centerArray = [];

  for (var i = 0, il = array.length; i < il; i++) {

    var c = new THREE.Vector3(0,0,0);

    for (var j = 0, jl = array[i].length - 1; j < jl; j++) {

      c.add(array[i][j].loc);
    }

    c.divideScalar(array[i].length);

    var existing = false;

    if (centerArray.length != 0) {

      for (var k = 0, kl = centerArray.length; k < kl; k++) {

        if(centerArray[k].distanceTo(c) < 3){

          existing = true;
          break;
        }
      }
    }

    if (existing == false) {

      newArray.push(array[i]);
      centerArray.push(c);
    };
  }

  //console.log(newArray);
  return newArray;
}// end delDuplicates

// ---------------------------------------------------------------------------- DELETE DUPLICATED FACES
function normalsByCentre (geometry){

  // CALCULATE CENTRE
  var centre = new THREE.Vector3();
  for (var i = 0, il = geometry.vertices.length; i < il; i++) {
    centre.add(geometry.vertices[i])
  }
  centre.divideScalar(geometry.vertices.length);

  // CALCULATE FACE NORMALS
  for (var i = 0, il = geometry.faces.length; i < il; i++) {
    var face = geometry.faces[i];
    var plane = new THREE.Plane().setFromCoplanarPoints(
      geometry.vertices[face.a],
      geometry.vertices[face.b],
      geometry.vertices[face.c]
    );

    var vec = plane.orthoPoint(centre);
    if ( vec.dot(plane.normal) <= 0) {
      geometry.faces[i].normal.copy(plane.normal).setLength(1);
    }
    else{
      geometry.faces[i].normal.copy(plane.normal).setLength(1).negate();
    }

  }
}// end normalsByCentre

// ---------------------------------------------------------------------------- SAVE SCENE
function saveScene (){
  // CREATE JSON
  var sceneFile = {};

  // META DATA
  var date = new Date();
  var name = date.getFullYear().toString() + "-"
            + (date.getMonth() +1).toString() + "-"
            + date.getDate().toString() + "-"
            + date.getHours().toString() + "-"
            + date.getMinutes().toString();

  // MAIN DATA
  var agents = [];
  var tetAgents = [];
  var polyAgents = [];

  sceneFile.name = name;
  sceneFile.agents = agents;
  sceneFile.tetAgents = tetAgents;
  sceneFile.polyAgents = polyAgents;

  //GET ALL AGENTS
  for (var i = 0, il = myAgentSystem.container.length; i < il; i++) {
    agents.push( myAgentSystem.container[i].getJSON() );
  }

  //GET ALL TET AGENTS
  for (var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++) {
    tetAgents.push( myAgentSystem.tetAgents[i].getJSON() );
  }

  //GET POLY TET AGENTS
  for (var i = 0, il = myAgentSystem.polyAgents.length; i < il; i++) {
    polyAgents.push( myAgentSystem.polyAgents[i].getJSON() );
  }

  var print = JSON.stringify(sceneFile);
  console.log(print);

  var blob = new Blob([print], {type: "text/plain;charset=utf-8"});
  // console.log(blob);

  saveAs(blob, name+".json");
}// end saveScene

// ---------------------------------------------------------------------------- SAVE SCENE
function saveCutFile (){

  var cutFile = {};

    // META DATA
  var date = new Date();
  var name =  "CUT_"
              + date.getFullYear().toString() + "-"
              + (date.getMonth() +1).toString() + "-"
              + date.getDate().toString() + "-"
              + date.getHours().toString() + "-"
              + date.getMinutes().toString();

  var tetAgents = [];
  var polyAgents = [];

  cutFile.name = name;
  cutFile.tetAgents = tetAgents;
  cutFile.polyAgents = polyAgents;

  // BAKE TET-AGENTS
  for (var i = 0; i < myAgentSystem.tetAgents.length; i++) {
    if ( myAgentSystem.tetAgents[i].poly == null ) {
      tetAgents.push( myAgentSystem.tetAgents[i].ug.stripes );
    }
  }

  // BAKE POLY-AGENTS
  for (var i = 0; i < myAgentSystem.polyAgents.length; i++) {
    tetAgents.push( myAgentSystem.polyAgents[i].ug.stripes );
  }

  var strCutFile = JSON.stringify(cutFile);
  var blob = new Blob([strCutFile], {type: "text/plain;charset=utf-8"});
  saveAs(blob, name+"__"+morphospace.minEdgelength+".json");

}// end saveCutFile

// ---------------------------------------------------------------------------- LOAD SCENE
function loadScene (){
  // CREATE JSON
  // var sceneFile = JSON.parse(save1);
  console.log(save1.agents[0].location.x);

  // console.log(sceneFile);
}// end saveScene

// ---------------------------------------------------------------------------- LOAD SCENE
// IS NOT WORKING
function getMinimalOutline ( _outlineA, _outlineB, _frame ){

  var frame = _frame.slice();
  //DEEP COPY
  frame = [];
  for (var i = 0; i < _frame.length; i++) { 
    frame.push(new THREE.Vector3().copy( _frame[i] ) );
  }

  outlineA = [];
  for (var i = 0; i < _outlineA.length; i++) { 
    outlineA.push(new THREE.Vector3().copy( _outlineA[i] ) );
  }

  outlineB = [];
  for (var i = 0, il = _outlineB.length; i < il; i++) { 
    outlineB.push(new THREE.Vector3().copy( _outlineB[i] ) );
  }

  var oa = [];
  var ob = [];
  var centG = new THREE.Vector3(0,0,0)
                      .add(_frame[0])
                      .add(_frame[1])
                      .add(_frame[2])
                      .divideScalar(3);

  // SORT POINTS
  for (var i = 0; i < frame.length; i++) {
    var mindistA = 99999, mindistB = 99999, dist;
    for (var j = 0; j < frame.length; j++) {
      dist = frame[i].distanceTo(outlineA[j]);
      if (dist < mindistA) { mindistA = dist; oa[i] = outlineA[j]};

      dist = frame[i].distanceTo(outlineB[j]);
      if (dist < mindistB) { mindistB = dist; ob[i] = outlineB[j]};
    }
  }

  oa.unshift(oa[oa.length - 1]);
  oa.push(oa[1]);

  ob.unshift(ob[ob.length - 1]);
  ob.push(ob[1]);


  var vec = new THREE.Vector3();
  var vecToC = new THREE.Vector3();

  var minOut = [], lineA, lineB, lineCP, closeP, len, angle1, angle2, b;
  for (var i = 0, il = frame.length; i < il; i++) {

    lineA = new THREE.Line3(oa[i+2], oa[i]);
    lineB = new THREE.Line3(ob[i+2], ob[i]);
    lineCP = lineA.center();
    closeP = lineB.closestPointToPoint(lineCP, true);
    vec.subVectors(closeP, lineCP);
    vecToC.subVectors(lineCP, centG);

    if (vec.dot(vecToC) < 0) {
      len = vec.length();

      angle1 = new THREE.Vector3().subVectors( oa[i], oa[i+2])
                  .angleTo( new THREE.Vector3().subVectors( oa[i+1], oa[i+2]) );

      angle2 = new THREE.Vector3().subVectors( oa[i+2], oa[i])
                  .angleTo( new THREE.Vector3().subVectors(oa[i+1], oa[i]) );

      b = Math.abs( len / Math.sin(angle1) );
      oa[i+2].add( new THREE.Vector3().subVectors(oa[i+1], oa[i+2] ).setLength(b) );

      b = Math.abs( len / Math.sin(angle2) );
      oa[i].add( new THREE.Vector3().subVectors( oa[i+1], oa[i] ).setLength(b) );
    }
  }

  var minimalOutline = oa.slice(1,4);
  return minimalOutline;
}// end getMinimalOutline

// ---------------------------------------------------------------------------- FIND GROUPS FROM FACEPAIRS RECURSIVELY
function recursiveGroups ( facepairs, target ){

  if (facepairs.length > 1) {

    var myFP = facepairs.slice();
    var myFP0 = myFP.splice(0,1)[0];
    var group = [];
    var remove = null;

    for (var i = 0; i < myFP.length; i++) {
      
      var idx = myFP[i].indexOf(myFP0[0]);
      if (idx != -1){
        group = myFP[i].slice();
        group.splice(idx,1);
        group.unshift(myFP0[1]);
        group.unshift(myFP0[0]);
        target.push(group);
        remove = i;
        break;
      }
      
      idx = myFP[i].indexOf(myFP0[1]);
      if (idx != -1){
        group = myFP[i].slice();
        group.splice(idx,1);
        group.unshift(myFP0[0]);
        group.unshift(myFP0[1]);
        target.push(group);
        remove = i;
        break;
      }
    }

    myFP.splice(remove,1);
    recursiveGroups(myFP, target);
  }

  else if (facepairs.length == 1) target.push(facepairs[0]);
}// end recursiveGroups

// ---------------------------------------------------------------------------- FIND AND GET ELEMENTS BY UID
function getElement ( uid ){
  var parts = uid.split("-");
  var element;
  // console.log(parts);
  switch( parts[0]){
    case "T":
    case "t":
      for (var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++) {
        if(myAgentSystem.tetAgents[i].ID == parseFloat(parts[1]) ){
          element = myAgentSystem.tetAgents[i];
          outliner.innerHTML = (element.getOutlineInfo());
          break;
        }
      };
      break;

    case "P":
    case "p":
      for (var i = 0, il = myAgentSystem.polyAgents.length; i < il; i++) {
        if(myAgentSystem.polyAgents[i].ID == parseFloat(parts[1]) ){
          element = myAgentSystem.polyAgents[i];
          outliner.innerHTML = (element.getOutlineInfo());
          break;
        }
      };
      break;

    case "FUID":
    case "fuid":
      var tempAgent, tempFuids, normal, connected = [];
      for (var i = 0, il = myAgentSystem.tetAgents.length; i < il; i++) {
        tempAgent = myAgentSystem.tetAgents[i];
        tempFuids = tempAgent.getFUID();

        if(tempFuids.indexOf(parseFloat(parts[1])) != -1){
          element = tempAgent;
          normal = element.getFaceNormal( tempFuids.indexOf(parseFloat(parts[1])) );
          myOrienTool.setTargetNormal(normal);
          (element.poly == null) ? connected.push("T-"+element.ID) : connected.push("P-"+element.poly.ID);
          // break;
        }
      };

      outliner.innerHTML = "<i>Elements connected to this face :</i><br><b>" + connected + "</b>";
      break;     
  }

  return element;
}// end getElement

// ---------------------------------------------------------------------------- UPDATE OUTLINER
function updateOutliner( object ){
  outliner.innerHTML = "<i>Selected Element :</i><br>" + object.userData;
  // var element = getElement(object.name);
  // element.getFUID();
  // console.log(element);
}// end updateOutliner

// ---------------------------------------------------------------------------- SWITCH POPULATION STRATEGY
function switchPopulation ( btn ){
  var selPopStrat = document.getElementById( "PopStrategy" );
  selPopStrat.innerText = btn.innerText;
  GP.populationStrategy = btn.innerText;
}// end switchPopulation

// ---------------------------------------------------------------------------- GET INPUT VALUE FROM TEXT FIELD
function getValueInputFromDOM ( btn, target, selector, min, max ){
  var value = parseFloat(btn.value);

  if (value < min) target[selector] = min;
  else if (value > max) target[selector] = max;
  else target[selector] = value;

  console.log(target);
  btn.value = target[selector];
}// end getTextFieldInput

// ---------------------------------------------------------------------------- ZOOM TO SELECTED
function zoomToSelected ( target ){
  console.log(target);
  var offset = new THREE.Vector3(1,1,1).setLength(1000);
  offset.add( target );
  camera.position.x = offset.x;
  camera.position.y = offset.y;
  camera.position.z = offset.z;
  camera.lookAt( target );
}// end zoomToSelected

// ---------------------------------------------------------------------------- ZOOM TO SELECTED
function changeColorOfSelected ( ID ){
  for (var i = 0; i < WALL.children.length; i++) {
    if(WALL.children[i].name === ID){
      WALL.children[i].originalMat = WALL.children[i].material;
      WALL.children[i].material = ml.wire_SELECTION;
      console.log(WALL.children[i]);
    }
  }
}// end changeColorOfSelected

// ---------------------------------------------------------------------------- RESTORE MATERIAL
function restoreMaterials (){
  //WALL
  for (var i = 0; i < WALL.children.length; i++) {
    if (WALL.children[i].originalMat !== undefined) {
      WALL.children[i].material = WALL.children[i].originalMat;
    }
  }

  //CPLANES
  for (var i = 0; i < CPLANES.children.length; i++) {
    if (CPLANES.children[i].originalMat !== undefined) {
      CPLANES.children[i].material = CPLANES.children[i].originalMat;
    }
  }

  //PREVIEW
  for (var i = 0; i < PREVIEW.children.length; i++) {
    if (PREVIEW.children[i].originalMat !== undefined) {
      PREVIEW.children[i].material = PREVIEW.children[i].originalMat;
    }
  }
}// end restoreMaterials

function hidePreview(){
  for (var i = 0; i < PREVIEW.children.length; i++) {
    PREVIEW.children[i].visible = false;
  }
}// end hidePreview

function unhidePreview(){
  for (var i = 0; i < PREVIEW.children.length; i++) {
    PREVIEW.children[i].visible = true;
  }
}// end hidePreview

function refreshScene(){
  //RESET PLAY BTN
  playBtn.innerHTML = "PLAY";
  playFlag = false;
  //RESET ENVI
  myEnvironment.refresh();
  myAgentSystem.refresh();
  TIME = 0;
}