OrientationTool = function(){

	// DEVICE ORIENTATION OBJECT
  this.plane = new THREE.Mesh(
	  new THREE.PlaneBufferGeometry( 5000, 5000, 8, 8),
	  new THREE.MeshBasicMaterial( {color: 0xfffff ,visible : true, transparent: true, opacity: 0.2})
	  );
  this.plane.material.side = THREE.DoubleSide;

  // TARGET NORMAL
  this.targetNormal = null;
}

OrientationTool.prototype = {

	constructor : OrientationTool,

	update : function(){

		if (this.targetNormal != null) {
			// GET UPVECTOR OF DEVICE PRIENTATION
			var upVector = new THREE.Vector3(0,0,1).applyQuaternion(this.plane.quaternion);
			var angle = degrees( upVector.angleTo(this.targetNormal) );
			var h = map(angle, 0 , 180, 0.25, 0);
			console.log(h);
			var color = new THREE.Color().setHSL(h,1.0,0.5);
  		renderer.setClearColor( color );

		}
	}, // end update

	setTargetNormal : function( normal ){
		this.targetNormal = normal.normalize();
	}, // end setTargetNormal

	clearTargetNormal : function(){
		this.targetNormal = null;
  	renderer.setClearColor( mc.myWhite );
	} // end clearTargetNormal
}