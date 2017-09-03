// Initialize Three.js
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var cig_box = [
{"verts":[-1.0,-1.0,-1.0, // triangle 1 : begin
    -1.0,-1.0, 1.0,
    -1.0, 1.0, 1.0, // triangle 1 : end
    1.0, 1.0,-1.0, // triangle 2 : begin
    -1.0,-1.0,-1.0,
    -1.0, 1.0,-1.0, // triangle 2 : end
    1.0,-1.0, 1.0,
    -1.0,-1.0,-1.0,
    1.0,-1.0,-1.0,
    1.0, 1.0,-1.0,
    1.0,-1.0,-1.0,
    -1.0,-1.0,-1.0,
    -1.0,-1.0,-1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0,-1.0,
    1.0,-1.0, 1.0,
    -1.0,-1.0, 1.0,
    -1.0,-1.0,-1.0,
    -1.0, 1.0, 1.0,
    -1.0,-1.0, 1.0,
    1.0,-1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0,-1.0,-1.0,
    1.0, 1.0,-1.0,
    1.0,-1.0,-1.0,
    1.0, 1.0, 1.0,
    1.0,-1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0,-1.0,
    -1.0, 1.0,-1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0,-1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0,-1.0, 1.0
],
"faces":[
0, 1, 2,
3, 4, 5,
6, 7, 8,
9, 10, 11,
12, 13, 14,
15, 16, 17,
//18, 19, 20,
21, 22, 23,
24, 25, 26,
27, 28, 29,
30, 31, 32,
//33, 34, 35,
],
"offset":[-0.6374034157303371,-0.5318040449438204,-0.12628506031460668]},
]

var cigBoxGeometry = new THREE.Geometry();

var cig_boxBody = new CANNON.Body({
	mass: 1
});
for(var i=0; i<cig_box.length; i++){

	var rawVerts = cig_box[i].verts;
	var rawFaces = cig_box[i].faces;
	var rawOffset = cig_box[i].offset;

	var verts=[], faces=[], offset;
    var scale = 0.25
	// Get vertices
	for(var j in rawVerts) {
	    rawVerts[j] *= scale
	}
	console.log(rawVerts)
	for(var j=0; j<rawVerts.length; j+=3){
	    cigBoxGeometry.vertices.push(new THREE.Vector3(rawVerts[j], rawVerts[j+1], rawVerts[j+2]))
	    verts.push(new CANNON.Vec3(rawVerts[j], rawVerts[j+1], rawVerts[j+2]));
	}

	// Get faces
	for(var j=0; j<rawFaces.length; j+=3){
	    cigBoxGeometry.faces.push(new THREE.Face3(rawFaces[j],rawFaces[j+1],rawFaces[j+2]))
	    faces.push([rawFaces[j],rawFaces[j+1],rawFaces[j+2]]);
	}

	// Get offset
	offset = new CANNON.Vec3(rawOffset[0],rawOffset[1],rawOffset[2]);

	// Construct polyhedron
	var cig_boxPart = new CANNON.ConvexPolyhedron(verts,faces);

	// Add to compound
	cig_boxBody.addShape(cig_boxPart,offset);
}

