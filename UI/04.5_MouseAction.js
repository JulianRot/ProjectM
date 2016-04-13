// -------------------------------------------------------- ON DOCUMENT MOUSE MOVE
function onDocumentMouseMove( event ) {
	event.preventDefault();
	// CALCULATE MOUSE POSITION IN NORMALIZED DEVICE COORDINATES
	// -1 TO 1 FOR BOTH COMPONENTS
	
	mouse.x = ((event.clientX / viewport.clientWidth) * 2) - 1;
	mouse.y = (-((event.clientY - viewport.offsetTop) / viewport.clientHeight) * 2) + 1;
	
	raycaster.setFromCamera( mouse, camera );
	
	var selObj1 = scene.getObjectByName("CPLANES").children;
  var selObj2 = scene.getObjectByName("WALL").children;
  SELECTABLE = selObj1.concat(selObj2);
	var intersects = raycaster.intersectObjects(SELECTABLE);

	if (intersects.length > 0){
		domContainer.style.cursor = "pointer";
		if ( INTERSECTED != intersects[0].object ){
			INTERSECTED = intersects[0].object;
		}
	}
	else {
		INTERSECTED = null;
		domContainer.style.cursor = "auto";
	}
}// end onDocumentMouseMove

// -------------------------------------------------------- ON DOCUMENT MOUSE DOWN
function onDocumentMouseDown( event ) {
	event.preventDefault();
	

	raycaster.setFromCamera(mouse, camera);

	var selObj1 = scene.getObjectByName("CPLANES").children;
  var selObj2 = scene.getObjectByName("WALL").children;
  SELECTABLE = selObj1.concat(selObj2);
	var intersects = raycaster.intersectObjects(SELECTABLE);

	if (intersects.length > 0) {

		if (SELECTED == null) {
			cameraCntrl.enabled = false;
			SELECTED = intersects[0].object;

			transformCntrl.detach();
			transformCntrl.attach(SELECTED);
			transformCntrl.setSpace("local");

			domContainer.style.cursor = "move";

			// UPDATE OUTLINER WITH INFORMATION ABOUT SELECTED
			updateOutliner( SELECTED );

		}
	}
	else {
		if ( SELECTED == null ) transformCntrl.detach();		
		SELECTED = null;
	}
}// end onDocumentMouseDown

// -------------------------------------------------------- ON DOCUMENT MOUSE UP
function onDocumentMouseUp( event ) {
	event.preventDefault();
	cameraCntrl.enabled = true;

	// if (INTERSECTED) {
	// 	SELECTED = null;
	// }
	domContainer.style.cursor = "auto";
}// end onDocumentMouseUp

