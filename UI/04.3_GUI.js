// ---------------------------------------------------------------------------- INIT GUI
function initGUI(){

	var gui = new dat.GUI();

	// AGENT CONTROL
	var f2 = gui.addFolder('AGENT CONTROL');

	f2.add(AC, 'ca_Radius', 0.0, 600, 500);

	f2.add(AC, 'ct_minDist', 0.0, 600, 100);
	f2.add(AC, 'ct_maxDist', 0.0, 600, 400);
	f2.add(AC, 'ct_Mag', 0.0, 20.0, 10);

	f2.add(AC, 'cs_cohRad', 0.0, 600, 400);
	f2.add(AC, 'cs_sepRad', 0.0, 600, 200);
	f2.add(AC, 'cs_cohMag', 0.0, 10.0, 1.25);
	f2.add(AC, 'cs_sepMag', 0.0, 10.0, 3.5);

	f2.add(AC, 'lp_Rad', 0.0, 600, 50);
	f2.add(AC, 'lp_Mag', 0.0, 10.0, 1.25);
	f2.add(AC, 'lp_PlaneMag', 0.0, 10.0, 1.25);

	f2.add(AC, 'clt_Mag', 0.0, 5.0, 1.25);
	f2.add(AC, 'clt_maxRad', 0.0, 600, 400);
	f2.add(AC, 'clt_minRad', 0.0, 600, 200);

	f2.add(AC, 'ec_Rad', 0.0, 600, 400);
	f2.add(AC, 'ec_Mag', 0.0, 10.0, 0.15);

	f2.add(AC, 'edgeLengthOpti', 0.0, 10.0, 1.0);
	f2.add(AC, 'edgeAngleOpti', 0.0, 10.0, 1.0);
	f2.add(AC, 'edgeFaceOpti', 0.0, 10.0, 0.5);
	f2.add(AC, 'viscosity', 0.0, 10.0, 1.0);

	f2.add(AC, 'm_treshold', 0.0, 5.0, 0.75);
	f2.add(AC, 'm_speedLimit', 0.0, 10.0, 5.0);
}// end initGUI

// ---------------------------------------------------------------------------- INIT BUTTONS
function initButtons(){

	// Refresh
  refreshBtn = document.getElementById( "Refresh" );
  refreshBtn.addEventListener( "click", function() { myEnvironment.refresh(); });

	// BAKE
  bakeBtn = document.getElementById( "Bake" );
  bakeBtn.addEventListener( "click", function() { keybool = !keybool; });

  // EXPORT BUTTON
  exportBtn = document.getElementById( "Export" );
  exportBtn.addEventListener( "click", function() { exportToObj (); });

  // UNFOLD TET BUTTON
  unfoldTet = document.getElementById( "UnfoldTets" );
  unfoldTet.addEventListener( "click", function() { 
  	fabAllTets();
  });

  // UNFOLD PLY BUTTON
  unfoldPoly = document.getElementById( "UnfolPoly" );
  unfoldPoly.addEventListener( "click", function() { 
  	fabAllPolys();  	
  });

  // EXPORT CUT FILES
  exportCut = document.getElementById( "CutFiles" );
  exportCut.addEventListener( "click", function() { 
  	saveCutFile();  	
  });

  // SAVE OBJECT
  saveBtn = document.getElementById( "Save" );
  saveBtn.addEventListener( "click", function() { 
    saveScene();    
  });
}// end initButtons