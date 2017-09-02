var world;
var dt = 1 / 60;

var constraintDown = false;
var camera, scene, renderer, gplane=false, clickMarker=false;
var geometry, material, mesh;
var controls,time = Date.now();

var jointBody, constrainedBody, mouseConstraint;

var N = 20;

var score_box = document.getElementById('score');
var timer_box = document.getElementById('timer');
var win_box = document.getElementById('wins');
var container, camera, scene, renderer, projector;

// +x is into the screen, +y is up/down, +z is left

function max(input) {
    return Math.max( ...input )
}

function min(input) {
    return Math.min( ...input )
}

// To be synced
var meshes=[], bodies=[], cigarettes = [];
var wins = []

class Cigarettes {
        constructor(){
            this.bodies = []
            this.meshes = []
        }
    };

var limits = []
var cigs = new Cigarettes()
var win_condition = 1

var cig_shape = new CANNON.Vec3(0.05, 0.05, 0.7)
// Initialize Three.js
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

initCannon();
init();
animate();

function init() {

    projector = new THREE.Projector();

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 500, 10000 );

    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.5, 10000 );
    camera.position.set(10, 2, 0);
    camera.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
    scene.add(camera);

    // lights
    var light, materials;
    scene.add( new THREE.AmbientLight( 0x666666 ) );

    light = new THREE.DirectionalLight( 0xffffff, 1.75 );
    var d = 20;

    light.position.set( d, d, d );

    light.castShadow = true;
    //light.shadowCameraVisible = true;

    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

    light.shadowCameraFar = 3*d;
    light.shadowCameraNear = d;
    light.shadowDarkness = 0.5;

    scene.add( light );

    // floor
    geometry = new THREE.PlaneGeometry( 10, 10, 1, 1 );
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    material = new THREE.MeshLambertMaterial( { color: 0x777777 } );
    markerMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    mesh = new THREE.Mesh( geometry, material );
    mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
    //geometry2 = new THREE.PlaneGeometry( 1, 1, 1, 1 );
    cig_box_geometry = new THREE.BoxGeometry( 1, 1, 0.1, 10, 10 )
    cig_box_edge = new THREE.BoxGeometry( 0.1, 0.1, 0.1, 10, 10 )
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    material2 = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    material3 = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
    cig_box = new THREE.Mesh( cig_box_geometry, material2 );
    cig_box.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    //meshes.push(mesh2)
    scene.add(cig_box);
    // cig box is to the right of the cig pile
    cig_box.position.set(2., 0., -2.5)
    limits = [[cig_box.position.x-cig_box_geometry.parameters.width/2.0, cig_box.position.x+cig_box_geometry.parameters.width/2.0],
              [cig_box.position.y, cig_box.position.y+cig_box_geometry.parameters.depth],
              [cig_box.position.z-cig_box_geometry.parameters.height/2.0, cig_box.position.z+cig_box_geometry.parameters.height/2.0]]
    var edge1 = new THREE.Mesh( cig_box_edge, material3 );
    var edge2 = new THREE.Mesh( cig_box_edge, material3 );
    var edge3 = new THREE.Mesh( cig_box_edge, material3 );
    var edge4 = new THREE.Mesh( cig_box_edge, material3 );
    edge1.position.set(limits[0][0], limits[1][1], limits[2][0])
    edge2.position.set(limits[0][1], limits[1][1], limits[2][0])
    edge3.position.set(limits[0][0], limits[1][1], limits[2][1])
    edge4.position.set(limits[0][1], limits[1][1], limits[2][1])
    scene.add(edge1)
    scene.add(edge2)
    scene.add(edge3)
    scene.add(edge4)
    // cubes
    gen_cig_meshes()

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( scene.fog.color );

    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMapEnabled = true;

    window.addEventListener( 'resize', onWindowResize, false );

    window.addEventListener("mousemove", onMouseMove, false );
    window.addEventListener("mousedown", onMouseDown, false );
    window.addEventListener("mouseup", onMouseUp, false );
}

function gen_cig_meshes(){
    var cubeGeo = new THREE.BoxGeometry( cig_shape.x, cig_shape.y, cig_shape.z, 10, 10 );
    var cigarette = new THREE.CylinderGeometry(1, 1, 2, 32); //cigs have 5 mm radius and 70 mm length
    var cubeMaterial = new THREE.MeshPhongMaterial( { color: 0x888888 } );
    var cube = true
    for(var i=0; i !== cigs.bodies.length; i++){
        if(cube) {
            cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
            cubeMesh.castShadow = true;
            cubeMesh.position.copy(cigs.bodies[i].position)
            cigs.meshes.push(cubeMesh);
            scene.add(cubeMesh);
        } else {
            cigarette = new THREE.Mesh(cigarette, cubeMaterial)
            cigarette.castShadow = true
            meshes.push(cigarette)
            scene.add(cigarette)
        }
    }
}

function gen_cig_boxes() {
    var mass = 5;
    boxShape = new CANNON.Box(cig_shape);
    // the bodies get added first
    for(var i=0; i < N; i++){
        boxBody = new CANNON.Body({ mass: mass });
        boxBody.addShape(boxShape);
        boxBody.position.set(0.1*N, 0.1*N, 0);
        world.addBody(boxBody);
        cigs.bodies.push(boxBody);
    }
}

function setClickMarker(x,y,z) {
    if(!clickMarker){
        var shape = new THREE.SphereGeometry(0.02, 8, 8);
        clickMarker = new THREE.Mesh(shape, markerMaterial);
        scene.add(clickMarker);
    }
    clickMarker.visible = true;
    clickMarker.position.set(x,y,z);
}

function removeClickMarker(){
  clickMarker.visible = false;
}

function onMouseMove(e){
    // Move and project on the plane
    if (gplane && mouseConstraint) {
        var pos = projectOntoPlane(e.clientX,e.clientY,gplane,camera);
        if(pos){
            setClickMarker(pos.x,pos.y,pos.z,scene);
            moveJointToPoint(pos.x,pos.y,pos.z);
        }
    }
}

function onMouseDown(e){
    // Find mesh from a ray
    var entity = findNearestIntersectingObject(e.clientX,e.clientY,camera, cigs.meshes);
    var pos = entity.point;
    if(pos && entity.object.geometry instanceof THREE.BoxGeometry){
        constraintDown = true;
        // Set marker on contact point
        setClickMarker(pos.x,pos.y,pos.z,scene);

        // Set the movement plane
        setScreenPerpCenter(pos,camera);

        var idx = cigs.meshes.indexOf(entity.object);
        if(idx !== -1){
            addMouseConstraint(pos.x,pos.y,pos.z,cigs.bodies[idx]);
        }
    }
}

// This function creates a virtual movement plane for the mouseJoint to move in
function setScreenPerpCenter(point, camera) {
    // If it does not exist, create a new one
    if(!gplane) {
      var planeGeo = new THREE.PlaneGeometry(100,100);
      var plane = gplane = new THREE.Mesh(planeGeo,material);
      plane.visible = false; // Hide it..
      scene.add(gplane);
    }

    // Center at mouse position
    gplane.position.copy(point);

    // Make it face toward the camera
    gplane.quaternion.copy(camera.quaternion);
}

var started = false

function onMouseUp(e) {
  constraintDown = false;
  // remove the marker
  removeClickMarker();
  started = true
  // Send the remove mouse joint to server
  removeJointConstraint();
}

var lastx,lasty,last;
function projectOntoPlane(screenX,screenY,thePlane,camera) {
    var x = screenX;
    var y = screenY;
    var now = new Date().getTime();
    // project mouse to that plane
    var hit = findNearestIntersectingObject(screenX,screenY,camera,[thePlane]);
    lastx = x;
    lasty = y;
    last = now;
    if(hit)
        return hit.point;
    return false;
}
function findNearestIntersectingObject(clientX,clientY,camera,objects) {
    // Get the picking ray from the point
    var raycaster = getRayCasterFromScreenCoord(clientX, clientY, camera, projector);

    // Find the closest intersecting object
    // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
    var hits = raycaster.intersectObjects(objects);
    var closest = false;
    if (hits.length > 0) {
        closest = hits[0];
    }

    return closest;
}

// Function that returns a raycaster to use to find intersecting objects
// in a scene given screen pos and a camera, and a projector
function getRayCasterFromScreenCoord (screenX, screenY, camera, projector) {
    var mouse3D = new THREE.Vector3();
    // Get 3D point form the client x y
    mouse3D.x = (screenX / window.innerWidth) * 2 - 1;
    mouse3D.y = -(screenY / window.innerHeight) * 2 + 1;
    mouse3D.z = 0.5;
    return projector.pickingRay(mouse3D, camera);
}

function resetCigs(){
    for(var i=0; i<cigs.meshes; i++) {
        scene.remove(cigs.meshes[i])
    }
    for(var i=0; i<cigs.bodies; i++) {
        world.removeBody(cigs.bodies[i])
    }
    cigs.meshes = []
    cigs.bodies = []
    gen_cig_boxes()
    gen_cig_meshes()
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    //controls.handleResize();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var timer = 0
function animate() {
    win_box.innerHTML = ""
    for(var i=0;i<wins.length;i++){
        win_box.innerHTML = '<span style="font-size:10px;font-color:green">win at: '+wins[i]+'</span>'
    }

    requestAnimationFrame( animate );

    updatePhysics();
    if(checkForWin()) {
        resetCigs()
    }

    if(started){
        timer_box.innerHTML = '<span style="font-size:40px">'+timer+'</span>'
        timer += 1
    }
    render();
}

function updatePhysics(){
    world.step(dt);
    for(var i=0; i !== cigs.meshes.length; i++){
        if(cigs.bodies[i] == undefined) {
            continue
        }
        cigs.meshes[i].position.copy(cigs.bodies[i].position);
        cigs.meshes[i].quaternion.copy(cigs.bodies[i].quaternion);
    }
}

function checkForWin() {
    if(score_box == undefined) {
        return false
    }

    var in_count = 0
    for(var i=0; i !== cigs.meshes.length; i++){
        if(cigs.bodies[i] == undefined) {
            continue
        }
        var conds = [min(limits[0]) <= cigs.bodies[i].position.x,
                     cigs.bodies[i].position.x <= max(limits[0]),
                     min(limits[1]) <= cigs.bodies[i].position.y,
                     cigs.bodies[i].position.y <= max(limits[1]),
                     min(limits[2]) <= cigs.bodies[i].position.z,
                     cigs.bodies[i].position.z<= max(limits[2])]
        if( conds[0] && conds[1] && conds[2] && conds[3] && conds[4] && conds[5]) {
            in_count += 1
        }
    }

    score_box.innerHTML = '<span style="font-size:40px">'+in_count+'</span>'
    if(in_count >= win_condition){
        wins.push(timer)
        return true
    }
    return false
}

function render() {
    renderer.render(scene, camera);
}

function initCannon(){
    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0,-10,0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create boxes
    gen_cig_boxes()

    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(groundBody);

    // Joint body
    var shape = new CANNON.Sphere(0.1);
    jointBody = new CANNON.Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    world.addBody(jointBody)
}

function addMouseConstraint(x,y,z,body) {
  // The cannon body constrained by the mouse joint
  constrainedBody = body;

  // Vector to the clicked point, relative to the body
  var v1 = new CANNON.Vec3(x,y,z).vsub(constrainedBody.position);

  // Apply anti-quaternion to vector to tranform it into the local body coordinate system
  var antiRot = constrainedBody.quaternion.inverse();
  pivot = antiRot.vmult(v1); // pivot is not in local body coordinates

  // Move the cannon click marker particle to the click position
  jointBody.position.set(x,y,z);

  // Create a new constraint
  // The pivot for the jointBody is zero
  mouseConstraint = new CANNON.PointToPointConstraint(constrainedBody, pivot, jointBody, new CANNON.Vec3(0,0,0));

  // Add the constriant to world
  world.addConstraint(mouseConstraint);
}

// This functions moves the transparent joint body to a new postion in space
function moveJointToPoint(x,y,z) {
    // Move the joint body to a new position
    jointBody.position.set(x,y,z);
    mouseConstraint.update();
}

function removeJointConstraint(){
  // Remove constriant from world
  world.removeConstraint(mouseConstraint);
  mouseConstraint = false;
}