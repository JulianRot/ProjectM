// -------------------------------------------------------- ON DOCUMENT MOUSE MOVE
function onDocumentMouseMove( event ) {
	event.preventDefault();
	// CALCULATE MOUSE POSITION IN NORMALIZED DEVICE COORDINATES
	// -1 TO 1 FOR BOTH COMPONENTS
	
	mouse.x = ((event.clientX / viewport.clientWidth) * 2) - 1;
	mouse.y = (-((event.clientY - viewport.offsetTop) / viewport.clientHeight) * 2) + 1;
	
	// mouse.x = ((event.clientX / window.innerWidth) * 2) - 1;
	// mouse.y = (-(event.clientY / window.innerHeight) * 2) + 1;
	
	raycaster.setFromCamera( mouse, camera );
	// MOVE SELECTED OBJECTS
	if ( SELECTED ) {
		var refPlaneX = raycaster.intersectObject( refPlane );
		if (refPlaneX.length > 0) {
			SELECTED.position.copy( refPlaneX[0].point.sub( offset ) );
			// SELECTED.geometry.applyMatrix(SELECTED.matrix);
		}
		return;
	}
	
	var selObj1 = scene.getObjectByName("CPLANES").children;
  var selObj2 = scene.getObjectByName("WALL").children;
  SELECTABLE = selObj1.concat(selObj2);
	var intersects = raycaster.intersectObjects(SELECTABLE);

	if (intersects.length > 0){
		domContainer.style.cursor = "pointer";
		if ( INTERSECTED != intersects[0].object ){

			INTERSECTED = intersects[0].object;
			// console.log(INTERSECTED);
			INTERSECTED.geometry.computeBoundingSphere();
			var cent = INTERSECTED.geometry.boundingSphere.center;
			// refPlane.position.copy(cent);
			refPlane.position.copy(intersects[0].object.position);
			refPlane.lookAt(camera.position);
			// console.log(refPlane.position);
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
		controls.enabled = false;
		SELECTED = intersects[0].object;

		var refPlaneX = raycaster.intersectObject(refPlane);
		// console.log(SELECTED.position);
		if (refPlaneX.length > 0) {
			offset.copy( refPlaneX[0].point ).sub( refPlane.position );
		}

		domContainer.style.cursor = "move";

		// UPDATE OUTLINER WITH INFORMATION ABOUT SELECTED
		updateOutliner( SELECTED );
	}
}// end onDocumentMouseDown

// -------------------------------------------------------- ON DOCUMENT MOUSE UP
function onDocumentMouseUp( event ) {
	event.preventDefault();
	controls.enabled = true;

	if (INTERSECTED) {
		refPlane.position.copy(INTERSECTED.position);
		SELECTED = null;
	}
	domContainer.style.cursor = "auto";
}// end onDocumentMouseUp

// -------------------------------------------------------- UPDATE OUTLINER
function updateOutliner( object ){
	outliner.innerHTML = "<i>Selected Element :</i><br>" + object.userData;
}// end updateOutliner