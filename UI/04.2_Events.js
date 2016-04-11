// ---------------------------------------------------------------------------- EVENTS

// ---------------------------------------------------------------------------- INIT EVENT LISTENERS
function initEvents(){
	// KEY - EVENTS
  document.addEventListener("keydown", onDocumentKeyDown, false);

  // WINDOW - EVENTS
  window.addEventListener( 'resize', onWindowResize, false );
  // MOUSE - EVENTS
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
}// end initEvents

// ---------------------------------------------------------------------------- ON DOCUMENT KEY DOWN
function onDocumentKeyDown(event){

	if (event.keyCode === 13) {
		infoInput();
	}
	// if (event.code === "KeyG") {
	// 	keybool = !keybool;
	// }

	// if (event.code === "KeyS") {
	// 	saveScene();
	// }

	// if (event.code === "KeyL") {
	// 	loadScene();
	// } 

	// if (event.code === "KeyD") {
	// 	WALL.children = [];
	// 	PREVIEW.children = [];
	// } 

	// if (event.code === "KeyE") {
	// 	exportToObj ();
	// } 
 //  //console.log(keybool);
}// end onDocumentKeyDown

// ---------------------------------------------------------------------------- ON DOCUMENT MOUSE UP
function onWindowResize() {
	viewportH = viewport.clientHeight;
  viewportW = viewport.clientWidth;

	camera.aspect = viewport.offsetWidth / viewport.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( viewport.offsetWidth, viewport.offsetHeight );
}// end onWindowResize

// ---------------------------------------------------------------------------- ON INFO INPUT
function infoInput(){
	var inputDom = ( document.getElementById("Bash").offsetParent === null) ? document.getElementById("BashM") : document.getElementById("Bash");
	// var inputDom = ( document.getElementById("BashM"));
	// console.log (inputDom.offsetParent);
	var outputTarget = ( document.getElementById("Outliner").offsetParent === null) ? document.getElementById("OutlinerM") : document.getElementById("Outliner");
	var content = inputDom.value;
	var commands;

	if (content !== "") {
		commands = content.split(" ");
		inputDom.value = "";
		outputTarget.innerHTML = commands[0] + ">";
	}
	else{
		outputTarget.innerHTML = "<i>If you select something, I will unveil my treasure! ;-) </i>";
	}
	

	if (commands !== undefined) {
		switch (commands[0]){
			case "morphospace":
			case "ms":
				outputTarget.innerHTML += "<br>" + JSON.stringify(morphospace,null,'<br>');
				break;

			case "find" :
			case "get" :

			  if (commands.length == 1) outputTarget.innerHTML = "Get What?";
			  else {
			  	getElement(commands[1]);
			  }
				break;

			default:
				outputTarget.innerHTML = "Don't know <b>" + commands + "</b> :(";
		}
	}
}// end infoInput