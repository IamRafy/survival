/**
 * Notes:
 * - Coordinates are specified as (X, Y, Z) where X and Z are horizontal and Y
 *   is vertical
 */

var map = [ // 1  2  3  4  5  6  7  8  9
 		   [5, 1, 1, 1, 3, 1, 1, 1, 1, 5,], // 0
           [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
           [1, 0, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
           [1, 0, 0, 0, 0, 0, 0, 0, 0, 1,], // 3
           [1, 0, 2, 1, 0, 0, 0, 0, 0, 1,], // 4
           [1, 0, 0, 0, 0, 0, 0, 0, 1, 5,], // 0
           [1, 1, 5, 0, 0, 0, 0, 5, 1, 1,], // 1
           [1, 1, 1, 0, 2, 0, 0, 0, 1, 1,], // 2
           [1, 0, 0, 0, 0, 0, 0, 0, 0, 1,], // 3
           [1, 0, 0, 2, 0, 0, 0, 0, 0, 1,], // 4
           [1, 0, 0, 0, 0, 5, 0, 0, 1, 1,], // 5
           [1, 0, 0, 0, 0, 0, 0, 1, 1, 1,], // 6
           [1, 1, 0, 0, 0, 1, 0, 0, 1, 1,], // 7
           [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
           [5, 1, 1, 1, 1, 1, 1, 1, 1, 5,], // 9
           ], mapW = map.length, mapH = map[0].length;

// Semi-constants
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	UNITSIZE = 250,
	WALLHEIGHT = UNITSIZE / 3,
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 5,
	NUMAI = 4,
	PROJECTILEDAMAGE = 20;
// Global vars
var t = THREE, scene, cam, renderer, controls, clock, projector, model, skin;
var runAnim = true, mouse = { x: 0, y: 0 }, kills = 0, health = 100;
var healthCube, lastHealthPickup = 0,bomb;
var object1;
var wall1;
var skyboxMesh;
var isenemykilled = 0;
var noofenemies = 0;
var lastenemykilled = 0;
var noofenemieskilled = 0;
var lasttimeenemies = 0;
var canaddai = 0;
var totaltime = 0;
var lastbombPickup = 0;
var immune = 0;
var totalenemies = 0;
/*
var finder = new PF.AStarFinder({ // Defaults to Manhattan heuristic
	allowDiagonal: true,
}), grid = new PF.Grid(mapW, mapH, map);
*/

// Initialize and run on document ready
$(document).ready(function() {
	$('body').append('<div id="intro">You are just a click away from fun ...!!!</div>');
	$('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
		e.preventDefault();
		$(this).fadeOut();
		init();
		setInterval(drawRadar, 1000);
		animate();
	});
	/*
	new t.ColladaLoader().load('models/Yoshi/Yoshi.dae', function(collada) {
		model = collada.scene;
		skin = collada.skins[0];
		model.scale.set(0.2, 0.2, 0.2);
		model.position.set(0, 5, 0);
		scene.add(model);
	});
	*/
});

// Setup
function init() {
	clock = new t.Clock(); // Used in render() for controls.update()
	projector = new t.Projector(); // Used in bullet projection
	scene = new t.Scene(); // Holds all objects in the canvas
	scene.fog = new t.FogExp2(0xD6F1FF, 0.00005); // color, density

	// Set up camera
	cam = new t.PerspectiveCamera(60, ASPECT, 1, 10000); // FOV, aspect, near, far
	cam.position.y = UNITSIZE * .2;
	scene.add(cam);

	// Camera moves with mouse, flies around with WASD/arrow keys
	controls = new t.FirstPersonControls(cam);
	controls.movementSpeed = MOVESPEED;
	controls.lookSpeed = LOOKSPEED;
	controls.lookVertical = false; // Temporary solution; play on flat surfaces only
	controls.noFly = true;

	// World objects
	setupScene();
	totaltime = Date.now();
	lastenemykilled = Date.now();
	// Artificial Intelligence
	setupAI();

	// Handle drawing as WebGL (faster than Canvas but less supported)
	renderer = new t.WebGLRenderer();
	renderer.setSize(WIDTH, HEIGHT);

	// Add the canvas to the document
	renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see
	document.body.appendChild(renderer.domElement);

	// Track mouse position so we know where to shoot
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	// Shoot on click
	$(document).click(function(e) {
		e.preventDefault;
		if (e.which === 1) { // Left click only
			createBullet();
		}
		else if (e.which === 2) { // Left click only
					bombblast();
		}
	});
// Display HUD
	$('body').append('<canvas id="radar" width="200" height="200"></canvas>');
	$('body').append('<div id="hud"><p>Health: <span id="health">100</span><br />Score: <span id="score">0</span></p></div>');
	$('body').append('<div id="hud1"><p>Enemies killed: <span id="enemkill">0</span><br />Score1: <span id="score1">0</span></p></div>');
	$('body').append('<div id="hud2"><p>Time: <span id="time">0</span><br />Score2: <span id="score2">0</span></p></div>');


		// Set up "hurt" flash
	$('body').append('<div id="hurt"></div>');
	$('#hurt').css({width: WIDTH, height: HEIGHT,});
}

// Helper function for browser frames
function animate() {
	if (runAnim) {
		requestAnimationFrame(animate);
	}
	render();
}

// Update and display
function render() {
	var delta = clock.getDelta(), speed = delta * BULLETMOVESPEED;
	var aispeed = delta * MOVESPEED;
	controls.update(delta); // Move camera

	  $('#Time').html((totaltime - Date.now())/1000);

	// Rotate the health cube
	healthcube.rotation.x += 0.004
	healthcube.rotation.y += 0.008;

	bomb.rotation.x += 0.004
	bomb.rotation.y += 0.008;
	// Allow picking it up once per minute
	if (Date.now() > lastHealthPickup + 60000) {
		if (distance(cam.position.x, cam.position.z, healthcube.position.x, healthcube.position.z) < 15 && health != 100) {
			health = Math.min(health + 50, 100);
			$('#health').html(health);
			lastHealthPickup = Date.now();
		}
		healthcube.material.wireframe = false;
	}
	else {
		healthcube.material.wireframe = true;
	}

	if (Date.now() > lastbombPickup + 60000 ) {
			if (distance(cam.position.x, cam.position.z, bomb.position.x, bomb.position.z) < 15 ) {

				lastbombPickup = Date.now();
			}
			bomb.material.wireframe = false;
			bombs.push(bomb);
			immune = 1;

		}
		else {
			bomb.material.wireframe = true;
			immune = 0;
	}

		if ((Date.now() > lastenemykilled + 10000) && ((lasttimeenemies-noofenemies)>=3)) {
			addAI();
			addAI();
			addAI();
			//canaddai = 1;
			lastenemykilled = Date.now();
			lasttimeenemies = noofenemies;
		}
	else if ((Date.now() > lastenemykilled + 10000) && ((lasttimeenemies-noofenemies)>=2)) {
			addAI();
			addAI();
			//canaddai = 1;
			lastenemykilled = Date.now();
			lasttimeenemies = noofenemies;
		}
		else if ((Date.now() > lastenemykilled + 10000) && ((lasttimeenemies-noofenemies)>=1)) {
					addAI();
					//canaddai = 1;
					lastenemykilled = Date.now();
					lasttimeenemies = noofenemies;
		}
		else if ((Date.now() > lastenemykilled + 20000) && ((noofenemies)==1)) {
							addAI();
							//canaddai = 1;
							lastenemykilled = Date.now();
							lasttimeenemies = noofenemies;
		}
		if ((Date.now() > totaltime + 120000) && noofenemieskilled > 20) {
				MOVESPEED += 40;
				LOOKSPEED += 0.015;
				noofenemieskilled = 0;
				totaltime = Date.now();
				scene.add(bomb);

		}

	// Update bullets. Walk backwards through the list so we can remove items.
	for (var i = bullets.length-1; i >= 0; i--) {
		var b = bullets[i], p = b.position, d = b.ray.direction;
		if (checkWallCollision(p)) {
			bullets.splice(i, 1);
			scene.remove(b);
			continue;
		}

		/*for (var i1 = bombs.length-1; i1 >= 0; i1--)
		{
						var b1 = bombs[i1], p1 = b1.position, d1 = b1.ray.direction;
						if (checkWallCollision(p1))
						{
							bombs.splice(i1, 1);
							scene.remove(b1);
							continue;
						}
		}*/

		// Collide with AI
		var hit = false;
		for (var j = ai.length-1; j >= 0; j--) {
			var a = ai[j];
			var v = a.geometry.vertices[0];
			var c = a.position;
			var x = Math.abs(v.x), z = Math.abs(v.z);
			//console.log(Math.round(p.x), Math.round(p.z), c.x, c.z, x, z);
			if (p.x < c.x + x && p.x > c.x - x &&
					p.z < c.z + z && p.z > c.z - z &&
					b.owner != a) {
				bullets.splice(i, 1);
				scene.remove(b);

				a.health -= PROJECTILEDAMAGE;
				var color = a.material.color, percent = a.health / 100;
				a.material.color.setRGB(
						percent * color.r,
						percent * color.g,
						percent * color.b
				);
				hit = true;
				break;
			}
		}
		// Bullet hits player
		if (distance(p.x, p.z, cam.position.x, cam.position.z) < 25 && b.owner != cam) {
			$('#hurt').fadeIn(75);
			health -= 10;
			if (health < 0) health = 0;
			val = health < 25 ? '<span style="color: darkRed">' + health + '</span>' : health;
			$('#health').html(val);
			bullets.splice(i, 1);
			//isenemykilled++;
			//noofenemies --;
			scene.remove(b);
			$('#hurt').fadeOut(350);
		}
		if (!hit) {
			b.translateX(speed * d.x);
			//bullets[i].translateY(speed * bullets[i].direction.y);
			b.translateZ(speed * d.z);
		}
	}

	// Update AI.
	for (var i = ai.length-1; i >= 0; i--) {
		var a = ai[i];
		if (a.health <= 0) {
			ai.splice(i, 1);
			scene.remove(a);
			noofenemieskilled++;
			totalenemies++;
			kills++;
			$('#score').html(kills * 100);
			$('#enemkill').html(totalenemies);
			if(canaddai)
			addAI();
		}
		// Move AI
		var r = Math.random();
		if (r > 0.995) {
			a.lastRandomX = Math.random() * 1.2 - 1;
			a.lastRandomZ = Math.random() * 1.2 - 1;
		}
		a.translateX(aispeed * a.lastRandomX);
		a.translateZ(aispeed * a.lastRandomZ);
		var c = getMapSector(a.position);
		if (c.x < 0 || c.x >= mapW || c.y < 0 || c.y >= mapH || checkWallCollision(a.position)) {
			if (distance(wall1.position.x, wall1.position.z, cam.position.x, cam.position.z) < 250 )
			{
				for(var i1 = 0; i1 <= 50; i1+=0.0006)
				     wall1.position.y += i1;
				//scene.remove(wall1);
			}
			a.translateX(-2 * aispeed * a.lastRandomX);
			a.translateZ(-2 * aispeed * a.lastRandomZ);
			a.lastRandomX = Math.random() * 2 - 1;
			a.lastRandomZ = Math.random() * 2 - 1;
		}
		if (c.x < -1 || c.x > mapW || c.z < -1 || c.z > mapH) {
			ai.splice(i, 1);
			scene.remove(a);
			addAI();
		}
		/*
		var c = getMapSector(a.position);
		if (a.pathPos == a.path.length-1) {
			console.log('finding new path for '+c.x+','+c.z);
			a.pathPos = 1;
			a.path = getAIpath(a);
		}
		var dest = a.path[a.pathPos], proportion = (c.z-dest[1])/(c.x-dest[0]);
		a.translateX(aispeed * proportion);
		a.translateZ(aispeed * 1-proportion);
		console.log(c.x, c.z, dest[0], dest[1]);
		if (c.x == dest[0] && c.z == dest[1]) {
			console.log(c.x+','+c.z+' reached destination');
			a.PathPos++;
		}
		*/
		var cc = getMapSector(cam.position);
		if (Date.now() > a.lastShot + 750 && distance(c.x, c.z, cc.x, cc.z) < 2) {
			createBullet(a);
			a.lastShot = Date.now();
		}
	}

	renderer.render(scene, cam); // Repaint
    $('#score').html(kills * 100);
    $('#score1').html(totalenemies);
	// Death
	if (health <= 0) {
		//runAnim = false;
		//$(renderer.domElement).fadeOut();
		//$('#radar, #hud, #credits').fadeOut();
		//$('#intro').fadeIn();
		//$('#intro').html('Ouch! Click to restart...');
		//$('#intro').one('click', function() {
			//location = location;
			/*
			$(renderer.domElement).fadeIn();
			$('#radar, #hud, #credits').fadeIn();
			$(this).fadeOut();
			runAnim = true;
			animate();
			health = 100;
			$('#health').html(health);
			kills--;
			if (kills <= 0) kills = 0;
			$('#score').html(kills * 100);
			cam.translateX(-cam.position.x);
			cam.translateZ(-cam.position.z);
			*/
		//});
	}
}
var bombs = [];
// Set up the objects in the world
function setupScene() {
	var UNITSIZE = 250, units = mapW;


	// Geometry: floor
	var material4 = new t.MeshLambertMaterial({color: 0xEDCBA0,map: t.ImageUtils.loadTexture('images/grass.jpg')});
	material4.bumpMap    = THREE.ImageUtils.loadTexture('images/bump.jpg');
	material4.bumpScale = 0.5;
	material4.specularMap    = THREE.ImageUtils.loadTexture('images/spec.jpg');
	material4.specular  = new THREE.Color('grey');

	var floor = new t.Mesh(
			new t.CubeGeometry(units * UNITSIZE, 10, units * UNITSIZE),
			material4
	);
	scene.add(floor);

	$('#score1').html(totalenemies);

	// Geometry: walls
	var planegeometry = new THREE.PlaneGeometry(UNITSIZE,WALLHEIGHT);
	var cube = new t.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
	var cube1 = new t.CubeGeometry(UNITSIZE, WALLHEIGHT*3, UNITSIZE);
	var cylinder = new t.CylinderGeometry(WALLHEIGHT,UNITSIZE,UNITSIZE, UNITSIZE);
	var spheretomb = new t.SphereGeometry(UNITSIZE/2,UNITSIZE/2,UNITSIZE/2);
	var materials = [
	                 new t.MeshLambertMaterial({/*color: 0x00CCAA,*/map: t.ImageUtils.loadTexture('images/wall-1.jpg')}),
	                 new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/wall-2.jpg')}),
					 //new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/yellow.gif')}),
	                 new t.MeshLambertMaterial({color: 0xFFA500}),
	                 ];
	                 var k  =0;
	for (var i = 0; i < mapW; i++) {
		for (var j = 0, m = map[i].length; j < m; j++) {
			if (map[i][j]) {
				if(map[i][j] == 3 ){
					var material1 = new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/gate1.jpg')});
					material1.bumpMap    = THREE.ImageUtils.loadTexture('images/bump.jpg');
					material1.bumpScale = 3.5;
	material1.specularMap    = THREE.ImageUtils.loadTexture('images/spec.jpg');
	material1.specular  = new THREE.Color('grey');
					wall1 = new t.Mesh(cube,material1 );
					wall1.name = "gate";
					wall1.position.x = (i - units/2) * UNITSIZE;
					wall1.position.y = WALLHEIGHT/2;
					wall1.position.z = (j - units/2) * UNITSIZE;
					wall1.scale.y = 8;
					//wall1.rotation.z =  90;
					scene.add(wall1);
				}else if(map[i][j] == 5 ){
					var material2 = new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/wall-1.jpg')});
					material2.bumpMap    = THREE.ImageUtils.loadTexture('images/bump.jpg');
					material2.bumpScale = 1.5;
					material2.specularMap    = THREE.ImageUtils.loadTexture('images/spec.jpg');
	material2.specular  = new THREE.Color('grey');
					var wall2 = new t.Mesh(cylinder, material2);
					wall2.name = "gate";
					wall2.position.x = (i - units/2) * UNITSIZE;
					wall2.position.y = WALLHEIGHT/2;
					wall2.position.z = (j - units/2) * UNITSIZE;
					wall2.scale.y = 4;

					var material3 = new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/wall-1.jpg')})
						material3.bumpMap    = THREE.ImageUtils.loadTexture('images/bump.jpg');
					material3.bumpScale = 1.5;
						material3.specularMap    = THREE.ImageUtils.loadTexture('images/spec.jpg');
	material3.specular  = new THREE.Color('grey');
					var wall3 = new t.Mesh(spheretomb, material3);

					wall3.position.x = (i - units/2) * UNITSIZE;
					wall3.position.y = 250;
					wall3.position.z = (j - units/2) * UNITSIZE;
					//wall3.scale.y = 2;
					//wall1.rotation.z =  90;
					scene.add(wall3);
					scene.add(wall2);
				} else {
					if(k % 3 ==0)
					{
						var wall = new t.Mesh(cube, materials[map[i][j]-1]);
											materials[map[i][j]-1].bumpMap    = THREE.ImageUtils.loadTexture('images/bump.jpg');
											materials[map[i][j]-1].bumpScale = 3.5;
												materials[map[i][j]-1].specularMap    = THREE.ImageUtils.loadTexture('images/spec.jpg');
							materials[map[i][j]-1].specular  = new THREE.Color('grey');
											wall.name = "wall";
											wall.position.x = (i - units/2) * UNITSIZE;
											wall.position.y = WALLHEIGHT/2;
											wall.position.z = (j - units/2) * UNITSIZE;
					scene.add(wall);
					}
					else
					{
						var wall = new t.Mesh(cube1, materials[map[i][j]-1]);
											materials[map[i][j]-1].bumpMap    = THREE.ImageUtils.loadTexture('images/bump.jpg');
											materials[map[i][j]-1].bumpScale = 3.5;
												materials[map[i][j]-1].specularMap    = THREE.ImageUtils.loadTexture('images/spec.jpg');
							materials[map[i][j]-1].specular  = new THREE.Color('grey');
											wall.name = "wall";
											wall.position.x = (i - units/2) * UNITSIZE;
											wall.position.y = WALLHEIGHT/2;
											wall.position.z = (j - units/2) * UNITSIZE;
					scene.add(wall);
					}
						k++
				}


			}
		}
	}

	// Health cube
	healthcube = new t.Mesh(
			new t.CubeGeometry(30, 30, 30),
			new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/health.png')})
	);
	healthcube.position.set(-UNITSIZE-15, 35, -UNITSIZE-15);
	scene.add(healthcube);

	bomb = new t.Mesh(
		new t.CylinderGeometry(20, 20, 60),
		new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/immune.jpg')})
	);
	bomb.rotation.z = 30;
	bomb.position.set(-UNITSIZE-145, 35, -UNITSIZE-145);


	// Lighting
	var directionalLight1 = new t.DirectionalLight( 0xF7EFBE, 0.7 );
	directionalLight1.position.set( 0.5, 1, 0.5 );
	scene.add( directionalLight1 );
	var directionalLight2 = new t.DirectionalLight( 0xF7EFBE, 0.5 );
	directionalLight2.position.set( -0.5, -1, -0.5 );
	scene.add( directionalLight2 );

	/* var directions  = ["images/px.jpg", "images/nx.jpg", "images/py.jpg", "images/ny.jpg", "images/pz.jpg", "images/nz.jpg"];

		var materialArray = [];
		 for (var i = 0; i < 6; i++)
		  materialArray.push( new THREE.MeshBasicMaterial({
		   map: THREE.ImageUtils.loadTexture( directions),
		   side: THREE.BackSide
		  }));

		 var skyGeometry = new THREE.CubeGeometry( 500, 500, 500 );
		 var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
		 var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
		 skyBox.rotation.x += Math.PI / 2;
         scene.add( skyBox );*/
}

var ai = [];
var aiGeo = new t.CubeGeometry(40, 40, 40);
function setupAI() {
	for (var i = 0; i < NUMAI; i++) {
		addAI();
	}

}

function addAI() {
	var c = getMapSector(cam.position);
	var aiMaterial = new t.MeshBasicMaterial({/*color: 0xEE3333,*/map: t.ImageUtils.loadTexture('images/face.png')});
	var o = new t.Mesh(aiGeo, aiMaterial);
	do {
		var x = getRandBetween(0, mapW-1);
		var z = getRandBetween(0, mapH-1);
	} while (map[x][z] > 0 || (x == c.x && z == c.z));
	x = Math.floor(x - mapW/2) * UNITSIZE;
	z = Math.floor(z - mapW/2) * UNITSIZE;
	o.position.set(x, UNITSIZE * 0.15, z);
	o.health = 100;
	//o.path = getAIpath(o);
	o.pathPos = 1;
	o.lastRandomX = Math.random();
	o.lastRandomZ = Math.random();
	o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
	ai.push(o);
	scene.add(o);
	noofenemies++;
}

function getAIpath(a) {
	var p = getMapSector(a.position);
	do { // Cop-out
		do {
			var x = getRandBetween(0, mapW-1);
			var z = getRandBetween(0, mapH-1);
		} while (map[x][z] > 0 || distance(p.x, p.z, x, z) < 3);
		var path = findAIpath(p.x, p.z, x, z);
	} while (path.length == 0);
	return path;
}

/**
 * Find a path from one grid cell to another.
 *
 * @param sX
 *   Starting grid x-coordinate.
 * @param sZ
 *   Starting grid z-coordinate.
 * @param eX
 *   Ending grid x-coordinate.
 * @param eZ
 *   Ending grid z-coordinate.
 * @returns
 *   An array of coordinates including the start and end positions representing
 *   the path from the starting cell to the ending cell.
 */
function findAIpath(sX, sZ, eX, eZ) {
	var backupGrid = grid.clone();
	var path = finder.findPath(sX, sZ, eX, eZ, grid);
	grid = backupGrid;
	return path;
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function getMapSector(v) {
	var x = Math.floor((v.x + UNITSIZE / 2) / UNITSIZE + mapW/2);
	var z = Math.floor((v.z + UNITSIZE / 2) / UNITSIZE + mapW/2);
	return {x: x, z: z};
}

/**
 * Check whether a Vector3 overlaps with a wall.
 *
 * @param v
 *   A THREE.Vector3 object representing a point in space.
 *   Passing cam.position is especially useful.
 * @returns {Boolean}
 *   true if the vector is inside a wall; false otherwise.
 */
function checkWallCollision(v) {
	var c = getMapSector(v);
	return map[c.x][c.z] > 0;
}

// Radar
function drawRadar() {
	var c = getMapSector(cam.position), context = document.getElementById('radar').getContext('2d');
	context.font = '10px Helvetica';
	for (var i = 0; i < mapW; i++) {
		for (var j = 0, m = map[i].length; j < m; j++) {
			var d = 0;
			for (var k = 0, n = ai.length; k < n; k++) {
				var e = getMapSector(ai[k].position);
				if (i == e.x && j == e.z) {
					d++;
				}
			}
			if (i == c.x && j == c.z && d == 0) {
				context.fillStyle = '#0000FF';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
			}
			else if (i == c.x && j == c.z) {
				context.fillStyle = '#AA33FF';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
				context.fillStyle = '#000000';
				context.fillText(''+d, i*20+8, j*20+12);
			}
			else if (d > 0 && d < 10) {
				context.fillStyle = '#FF0000';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
				context.fillStyle = '#000000';
				context.fillText(''+d, i*20+8, j*20+12);
			}
			else if (map[i][j] > 0) {
				context.fillStyle = '#666666';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
			}
			else {
				context.fillStyle = '#CCCCCC';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
			}
		}
	}
}

var bullets = [];

var sphereMaterial = new t.MeshBasicMaterial({color: 0x33000});
var sphereGeo = new t.SphereGeometry(2, 6, 6);
function createBullet(obj) {
	if (obj === undefined) {
		obj = cam;
	}
	var sphere = new t.Mesh(sphereGeo, sphereMaterial);
	sphere.position.set(obj.position.x, obj.position.y * 0.8, obj.position.z);

	if (obj instanceof t.Camera) {
		var vector = new t.Vector3(mouse.x, mouse.y, 1);
		projector.unprojectVector(vector, obj);
		sphere.ray = new t.Ray(
				obj.position,
				vector.subSelf(obj.position).normalize()
		);
	}
	else {
		var vector = cam.position.clone();
		sphere.ray = new t.Ray(
				obj.position,
				vector.subSelf(obj.position).normalize()
		);
	}
	sphere.owner = obj;

	bullets.push(sphere);
	scene.add(sphere);

	return sphere;
}

/*
function loadImage(path) {
	var image = document.createElement('img');
	var texture = new t.Texture(image, t.UVMapping);
	image.onload = function() { texture.needsUpdate = true; };
	image.src = path;
	return texture;
}
*/

function onDocumentMouseMove(e) {
	e.preventDefault();
	mouse.x = (e.clientX / WIDTH) * 2 - 1;
	mouse.y = - (e.clientY / HEIGHT) * 2 + 1;
}

// Handle window resizing
$(window).resize(function() {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	ASPECT = WIDTH / HEIGHT;
	if (cam) {
		cam.aspect = ASPECT;
		cam.updateProjectionMatrix();
	}
	if (renderer) {
		renderer.setSize(WIDTH, HEIGHT);
	}
	$('#intro, #hurt').css({width: WIDTH, height: HEIGHT,});
});

// Stop moving around when the window is unfocused (keeps my sanity!)
$(window).focus(function() {
	if (controls) controls.freeze = false;
});
$(window).blur(function() {
	if (controls) controls.freeze = true;
});

//Get a random integer between lo and hi, inclusive.
//Assumes lo and hi are integers and lo is lower than hi.
function getRandBetween(lo, hi) {
 return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo, 10);
}



