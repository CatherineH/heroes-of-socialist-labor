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
var wins = 0

class Cigarettes {
        constructor(){
            this.bodies = []
            this.meshes = []
            this.name = "cigarettes"
        }
    };

class CigaretteBoxes {
    constructor(){
            this.limits = []
            this.meshes = []
            this.name = "cigarette_boxes"
            this.num_in = []
        }
    };

var limits = []
var cigs = new Cigarettes()
var cigBoxes = new CigaretteBoxes()
var win_condition = 1

var cig_shape = new CANNON.Vec3(0.05, 0.05, 0.7)
var cig_box_shape = new CANNON.Vec3(1.0, 0.25, 0.7)
var totalAdded = 0

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
    geometry = new THREE.PlaneGeometry( 5, 10, 1, 1 );
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    material = new THREE.MeshLambertMaterial( { color: 0x777777 } );
    markerMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    mesh = new THREE.Mesh( geometry, material );
    mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
    var back = 0
    var boxCigGeometry = new THREE.BoxGeometry(cig_shape.x, cig_shape.y, cig_shape.z)

    for(var i=0; i<10; i++) {
        var start_value = parseInt((i+2)/2.0)
        for(var j=-start_value; j<=start_value; j++) {
            var other_table = new THREE.Mesh( geometry, material );
            other_table.castShadow = true;
            other_table.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
            other_table.receiveShadow = true;
            var z_val = 12*j
            var x_val = -11*(i+1)
            if(x_val < back) {
                back = x_val
            }
            other_table.position.set(x_val, 0, z_val)

            scene.add(other_table)

            for(var k=0; k<3; k++) {
                var cigBoxMesh = gen_cig_box_mesh(x_val, z_val, k)
                scene.add(cigBoxMesh[0])
            }
            /*

            for(var k=0; k<1; i++) {
                //var cigMaterial = new THREE.MeshPhongMaterial( { color: 0xaaaaaaaa } );
                cigMesh = new THREE.Mesh(boxCigGeometry, material);
                cigMesh.castShadow = false;
                cigMesh.position.set(x_val, 2, 2.50 +k*0.05+z_val)
                //scene.add(cigMesh)
            }*/
        }
    }

    var end_position = -120
    var windowGeometry = new THREE.BoxGeometry( 1, 7, 5 );
    var windowMaterial = new THREE.MeshLambertMaterial( { color: 0xffffffff } );
    windowMesh = new THREE.Mesh( windowGeometry, windowMaterial );
    windowMesh.castShadow = false;
    // add a window
    for(var k=-1; k<=1; k++) {
        for(var i=0; i<2; i++) {
            for(var j=0; j<3; j++) {
                var windowMesh = new THREE.Mesh( windowGeometry, windowMaterial );
                windowMesh.castShadow = false;
                windowMesh.position.set(-140, 10+j*8, i*6+k*50)
                scene.add(windowMesh)
            }
        }
    }


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

function gen_cig_mesh(position){
    var cigarette = new THREE.CylinderGeometry(cig_shape.x, cig_shape.x, cig_shape.z, 32); //cigs have 5 mm radius and 70 mm length
    var cigMaterial = new THREE.MeshPhongMaterial( { color: 0xaaaaaaaa } );
    cigMesh = new THREE.Mesh(cigarette, cigMaterial);
    cigMesh.castShadow = true;
    cigMesh.position.copy(position)
    return cigMesh
}


function gen_cig_meshes(){
    for(var i=cigs.meshes.length; i < cigs.bodies.length; i++){
        var cigMesh = gen_cig_mesh([cigs.bodies[i].position.x, cigs.bodies[i].position.y, cigs.bodies[i].position.z])
        totalAdded += 1
        cigMesh.name = "cig"+totalAdded
        cigs.meshes.push(cigMesh);
        scene.add(cigMesh);
    }
}

function gen_cig_box_mesh(x, z, i) {
    var cigBoxGeometry = new THREE.BoxGeometry( cig_box_shape.x, cig_box_shape.y, cig_box_shape.z, 10, 10 )
    var cigBoxMaterial = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
    cigBoxMesh = new THREE.Mesh(cigBoxGeometry, cigBoxMaterial);
    cigBoxMesh.castShadow = true;
    cigBoxMesh.position.set(x, cig_box_shape.y/2.0, -4.0+i*1.0+z)
    var limits = [[cigBoxMesh.position.x-cigBoxGeometry.parameters.width/2.0, cigBoxMesh.position.x+cigBoxGeometry.parameters.width/2.0],
              [cigBoxMesh.position.y, cigBoxMesh.position.y+cigBoxGeometry.parameters.depth],
              [cigBoxMesh.position.z-cigBoxGeometry.parameters.height/2.0, cigBoxMesh.position.z+cigBoxGeometry.parameters.height/2.0]]
    return [cigBoxMesh, limits]
}

function gen_cig_box_meshes(){
    for(var i=0; i < cigBoxNums; i++){
        var output = gen_cig_box_mesh(0, 0, i)
        cigBoxMesh = output[0]
        cigBoxMesh.name = "cigBox"+i

        cigBoxes.limits.push(output[1])
        cigBoxes.num_in.push(0)
        cigBoxes.meshes.push(cigBoxMesh);
        scene.add(cigBoxMesh);
    }
}

function gen_cig_bodies(number_bodies) {
    var mass = 5;
    var boxShape = new CANNON.Cylinder(cig_shape.x, cig_shape.x, cig_shape.z, 32);
    // the bodies get added first
    for(var i=0; i < number_bodies; i++){
        boxBody = new CANNON.Body({ mass: mass });
        boxBody.addShape(boxShape);
        boxBody.position.set(1.0, 1.0, 2.50 +i*0.05);
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

function isMoveable(_object) {
    if(_object.name.indexOf("cig") == 0){
        return true
    }
    return false
}

function findObject(e, objects) {
    var entity = findNearestIntersectingObject(e.clientX,e.clientY,camera, objects.meshes);
    if(!entity) {
        return
    }
    var pos = entity.point;

    var isMove = isMoveable(entity.object)
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
    started = true
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

function removeCigBox(index) {
    var selectedObject = scene.getObjectByName(cigBoxes.meshes[index].name);
    scene.remove(selectedObject)
    wins += 1
    cigBoxes.meshes.splice(index, 1)
    cigBoxes.limits.splice(index, 1)
    cigBoxes.num_in.splice(index, 1)
    if(cigBoxes.meshes.length == 0) {
        gen_cig_box_meshes()
    }
    gen_cig_bodies(7)
    gen_cig_meshes()
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
var num_frames = 0
function animate() {
    num_frames += 1
    requestAnimationFrame( animate );
    updatePhysics();
    if(checkForWin()) {
        //resetCigs()
        win_box.innerHTML = '<span style="font-size:20px;font-color:green">boxes complete: '+wins+'</span><br>'
    }
    var time_left = 60.0*60.0*8.0*(timer-Date.now())/day_length
    if(num_frames % 3 == 0){
        if(started && time_left >= 0){
            var seconds = sprintf("%02d", time_left % 60)
            var minutes = sprintf("%02d", Math.floor(time_left/60) % 60)
            var hours = sprintf("%02d", Math.floor(time_left/3600))
            timer_box.innerHTML = '<span style="font-size:20px">Day left: '+hours+":"+minutes+":"+seconds+'</span>'
            instruction_box.style.display = "none"
        }
        else if(started) {
            var name = getName()
            var key = getCookie("key")
            var occupation = getOccupation()
            $.post(url=window.origin+"/scoreboard/data", data={name:name, key:""+key, occupation: occupation, num_boxes: ""+wins}, success=getScoreboard())
            timer = Date.now()+day_length
        }
    }
    render();
}

function getScoreboard() {
    window.location = window.origin+"/scoreboard"
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
    /*if(score_box == undefined) {
        return false
    }*/
    for(var mesh_i in cigs.meshes){
        if(cigs.meshes[mesh_i] == undefined) {
            continue
        }
        for(var box_i in cigBoxes.limits) {
            var limits = cigBoxes.limits[box_i]
            var conds = [min(limits[1]) <= cigs.meshes[mesh_i].position.y,
                         cigs.meshes[mesh_i].position.y <= max(limits[1]),
                         min(limits[2]) <= cigs.meshes[mesh_i].position.z,
                         cigs.meshes[mesh_i].position.z<= max(limits[2])]

            var win_cond = true
            for(var cond_i in conds) {
                win_cond = win_cond && conds[cond_i]
            }

            if( win_cond) {
                removeCig(mesh_i)
                cigBoxes.num_in[box_i] += 1
                if(cigBoxes.num_in[box_i]>4) {
                    removeCigBox(box_i)
                }
                return true
            }
        }
    }

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
    gen_cig_bodies(cigNums)

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