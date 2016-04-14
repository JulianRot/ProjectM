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

	// PLAY GROWTH
	playBtn = document.getElementById("play");
	playBtn.addEventListener( "click", function(){ 
		playFlag = !playFlag;
		playBtn.innerHTML = ( playFlag == true ) ? "PAUSE" : "PLAY";

		if (bakeFlag == false) { 
  		playFlag = false;
  		bakeFlag = true;
  		myAgentSystem.bakeAgents();
  		hidePreview();
  	}
  	else{
  		playFlag = true;
  		bakeFlag = false;
  		unhidePreview();
  	}
	});

	// Refresh
  refreshBtn = document.getElementById( "Refresh" );
  refreshBtn.addEventListener( "click", function() { 
  	//RESET PLAY BTN
  	playBtn.innerHTML = "PLAY";
  	playFlag = false;
  	//RESET ENVI
  	myEnvironment.refresh();
  	console.log(myEnvironment);
  	myAgentSystem.refresh();
  	TIME = 0;
  });

	// BAKE
  bakeBtn = document.getElementById( "Bake" );
  bakeBtn.addEventListener( "click", function() { 
  	if (bakeFlag == false) { 
  		playFlag = false;
  		bakeFlag = true;
  		myAgentSystem.bakeAgents();
  	}
  	else{
  		playFlag = true;
  		bakeFlag = false;
  	}
  });

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

  // SWITCH POPULATION STRATEGY
  popBtn1 = document.getElementById( "Appomixis_B" );
  popBtn2 = document.getElementById( "Appomixis_C" );
  popBtn3 = document.getElementById( "Strategy_A" );
  popBtn4 = document.getElementById( "Paint" );
  popBtn5 = document.getElementById( "Load" );

  popBtn1.addEventListener( "click",function(){ switchPopulation( popBtn1 ); });
  popBtn2.addEventListener( "click",function(){ switchPopulation( popBtn2 ); });
  popBtn3.addEventListener( "click",function(){ switchPopulation( popBtn3 ); });
  popBtn4.addEventListener( "click",function(){ switchPopulation( popBtn4 ); });
  popBtn5.addEventListener( "click",function(){ switchPopulation( popBtn5 ); });

  // GET VALUES FROM CONTROL PANEL
  minLengthBtn = document.getElementById( "MinLength" );
  maxLengthBtn = document.getElementById( "MaxLength" );
  minLengthBtn.addEventListener( "change", function(){
  	getValueInputFromDOM(minLengthBtn, morphospace, "minEdgelength", 180, 600);
  	console.log(morphospace);

  });
  maxLengthBtn.addEventListener( "change", function(){
  	getValueInputFromDOM(maxLengthBtn, morphospace,"maxEdgelength", 200, 620);
  	console.log(morphospace);
  });

  birthRateBtn = document.getElementById( "BirthRate" );
  speedLimitBtn = document.getElementById( "SpeedLimit" );
  maxCountBtn = document.getElementById( "MaxCount" );

  birthRateBtn.addEventListener( "change", function(){
  	getValueInputFromDOM(birthRateBtn, GP,"maxBirthRate", 0, 100);
  })
  speedLimitBtn.addEventListener( "change", function(){
  	getValueInputFromDOM(speedLimitBtn, AC,"m_speedLimit", 0, 100);
  })
  maxCountBtn.addEventListener( "change", function(){
  	getValueInputFromDOM(maxCountBtn, GP,"maxTetCount", 0, 1000);
  })

}// end initButtons