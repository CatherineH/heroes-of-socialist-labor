var world;
var dt = 1 / 60;

var constraintDown = false;
var camera, scene, renderer, gplane=false, clickMarker=false;
var geometry, material, mesh;
var controls,time = Date.now();

var jointBody, constrainedBody, mouseConstraint;

var cigNums = 20;
var cigBoxNums = 4;

var score_box = document.getElementById('score');
var timer_box = document.getElementById('timer');
var instruction_box = document.getElementById('instructions')
var win_box = document.getElementById('wins');
var container, camera, scene, renderer, projector;

// +x is into the screen, +y is up/down, +z is left

// To be synced
var meshes=[], bodies=[], cigarettes = [];
var wins = []

class Cigarettes {
        constructor(){
            this.bodies = []
            this.meshes = []
            this.name = "cigarettes"
        }
    };

class CigaretteBoxes {
    constructor(){
            this.bodies = []
            this.meshes = []
            this.name = "cigarette_boxes"
        }
    };

var limits = []
var cigs = new Cigarettes()
var cigBoxes = new CigaretteBoxes()
var allObjects = [cigs, cigBoxes]
var win_condition = 1

var cig_shape = new CANNON.Vec3(0.05, 0.05, 0.7)


initCannon();
init();
animate();

function init() {
    console.log(getName())
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


    gen_cig_meshes()
    gen_cig_box_meshes()
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
    var cigarette = new THREE.CylinderGeometry(cig_shape.x, cig_shape.x, cig_shape.z, 32); //cigs have 5 mm radius and 70 mm length
    var cigMaterial = new THREE.MeshPhongMaterial( { color: 0xaaaaaaaa } );
    for(var i=0; i !== cigs.bodies.length; i++){
        cigMesh = new THREE.Mesh(cigarette, cigMaterial);
        cigMesh.castShadow = true;
        cigMesh.position.copy(cigs.bodies[i].position)
        cigMesh.name = "cig"+i
        cigs.meshes.push(cigMesh);
        scene.add(cigMesh);
    }
}

function gen_cig_box_meshes(){
    var cigBoxMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    //var cigBoxMaterial = new THREE.MeshLambertMaterial( { color: 0xffff00ff } );
    for(var i=0; i !== cigBoxes.bodies.length; i++){
        cigBoxMesh = new THREE.Mesh(cigBoxGeometry, cigBoxMaterial);
        cigBoxMesh.castShadow = true;
        cigBoxMesh.position.copy(cigBoxes.bodies[i].position)
        cigBoxMesh.name = "cigBox"+i
        cigBoxes.meshes.push(cigBoxMesh);
        scene.add(cigBoxMesh);
    }
}

function gen_cig_bodies() {
    var mass = 5;
    boxShape = new CANNON.Cylinder(cig_shape.x, cig_shape.x, cig_shape.z, 32);
    // the bodies get added first
    for(var i=0; i < cigNums; i++){
        boxBody = new CANNON.Body({ mass: mass });
        boxBody.addShape(boxShape);
        boxBody.position.set(0.1*i, 0.1*i, 0);
        world.addBody(boxBody);
        cigs.bodies.push(boxBody);
    }
}

function gen_cig_box_bodies() {
    var mass = 5;
    // the bodies get added first
    for(var i=0; i < cigBoxNums; i++){
        cig_boxBody.position.set(1.0, 1.0, 1.0*i);
        world.addBody(cig_boxBody);
        cigBoxes.bodies.push(cig_boxBody);
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

function isMoveable(_object) {
    if(_object.name.indexOf("cig") == 0){
        return true
    }
    return false
}

function findObject(e, objects) {
    var entity = findNearestIntersectingObject(e.clientX,e.clientY,camera, objects.meshes);
    if(!entity) {
        console.log("No intersection found with ", objects.name)
        return
    }
    var pos = entity.point;

    console.log("entity: ", entity)
    var isMove = isMoveable(entity.object)
    console.log(entity.object.name, "is moveable: ",isMove)
    if(pos && isMove) {
        constraintDown = true;
        // Set marker on contact point
        setClickMarker(pos.x,pos.y,pos.z,scene);

        // Set the movement plane
        setScreenPerpCenter(pos,camera);

        var idx = objects.meshes.indexOf(entity.object);
        if(idx !== -1){
            addMouseConstraint(pos.x,pos.y,pos.z,objects.bodies[idx]);
        }
    }
}

function onMouseDown(e){
    findObject(e, cigs)
    findObject(e, cigBoxes)
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

function removeCig(index) {
    var selectedObject = scene.getObjectByName(cigs.meshes[index].name);
    scene.remove(selectedObject)
    world.remove(cigs.bodies[index])
    cigs.bodies.splice(index, 1)
    cigs.meshes.splice(index, 1)
}


function resetCigs(){
    for(var i=0; i<cigs.meshes.length; i++) {
        removeCig(i)
    }

    cigs.meshes = []
    cigs.bodies = []
    gen_cig_bodies()
    gen_cig_meshes()
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    //controls.handleResize();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var day_length = 1000*60
var timer = Date.now()+day_length
function animate() {
    requestAnimationFrame( animate );
    updatePhysics();
    if(checkForWin()) {
        //resetCigs()
        win_box.innerHTML = '<span style="font-size:20px;font-color:green">boxes complete: '+wins.length+'</span><br>'
    }
    var time_left = 60.0*60.0*8.0*(timer-Date.now())/day_length

    if(started && time_left >= 0){
        var seconds = sprintf("%02d", time_left % 60)
        var minutes = sprintf("%02d", Math.floor(time_left/60) % 60)
        var hours = sprintf("%02d", Math.floor(time_left/3600))
        timer_box.innerHTML = '<span style="font-size:20px">Day left: '+hours+":"+minutes+":"+seconds+'</span>'
        instruction_box.style.display = "none"
    }
    else if(started) {
        var name = getName()
            $.post(url=window.origin+"/scoreboard/data", data={name:name, "blo": "hello", num_boxes: ""+wins.length}, success=getScoreboard())
        timer = Date.now()+day_length
    }
    render();
}

function getScoreboard() {
    //window.location = window.origin+"/scoreboard"
}

function updatePhysics(){
    world.step(dt);
    for(var obj_i in allObjects) {
        var objectsList = allObjects[obj_i]
        for(var i=0; i !== objectsList.meshes.length; i++){
            if(objectsList.bodies[i] == undefined) {
                continue
            }
            objectsList.meshes[i].position.copy(objectsList.bodies[i].position);
            objectsList.meshes[i].quaternion.copy(objectsList.bodies[i].quaternion);
        }
    }

}

function checkForWin() {
    if(score_box == undefined) {
        return false
    }

    var in_count = 0
    for(var i=0; i !== cigs.meshes.length; i++){
        if(cigs.meshes[i] == undefined) {
            continue
        }
        var conds = [min(limits[0]) <= cigs.meshes[i].position.x,
                     cigs.meshes[i].position.x <= max(limits[0]),
                     min(limits[1]) <= cigs.meshes[i].position.y,
                     cigs.meshes[i].position.y <= max(limits[1]),
                     min(limits[2]) <= cigs.meshes[i].position.z,
                     cigs.meshes[i].position.z<= max(limits[2])]
        if( conds[0] && conds[1] && conds[2] && conds[3] && conds[4] && conds[5]) {
            removeCig(i)
            wins.push(i)
            return true
            in_count += 1
        }
    }

    /*
    score_box.innerHTML = '<span style="font-size:40px">Cigarettes in box: '+in_count+'</span>'
    if(in_count >= win_condition){
        wins.push(timer)
        return true
    }
    return false*/
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
    gen_cig_bodies()
    gen_cig_box_bodies()

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
    console.log("updating jointBody: ", jointBody)
    mouseConstraint.update();
}

function removeJointConstraint(){
  // Remove constriant from world
  world.removeConstraint(mouseConstraint);
  mouseConstraint = false;
}