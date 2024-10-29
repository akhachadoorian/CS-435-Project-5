/*
    CS 435
    Project 4
    Alex Khachadoorian
    FIXME: description
*/

"use strict"

///////////////////////////////////
/*       GLOBAL VARIABLES        */
///////////////////////////////////

var canvas; 
var gl;
var numPositions = 0; 
var thetaLoc; // theta location

// ROTATION VARIABLES
var flag = false; // whether or not the object should rotate
var theta = [0, 0, 0]; // holds amount rotated around each axis (x, y, z)
var axis = 1; // this holds the axis index that the object is rotation around (0 -> x, 1-> y, 2-> z)
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

// BUFFER VARIABLES
var vPosition = [];; //holds all the vertex positions
var vColor = []; //holds all the vertex colors
var cBuffer;  // color buffer
var vBuffer; // vertex buffer

var positionsArray = [];
var normalsArray = [];
var viewerPos;
var modelViewMatrix, projectionMatrix;
var program;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 100.0;

///////////////////////////////////
/*       GLOBAL FUNCTIONS        */
///////////////////////////////////

///////////////////////////////////
/*           CLASSES             */
///////////////////////////////////
var topZ = 0.1;
var bottomZ = -0.1;

var vertices = [
    // TOP
    vec4(-1.0, 1.0, topZ, 1.0), // 0 
    vec4(-0.25, 1.0, topZ, 1.0), // 1
    vec4(0.25, 1.0, topZ, 1.0), // 2
    vec4(1.0, 1.0, topZ, 1.0), // 3
    vec4(1.0, 0.0, topZ, 1.0), // 4
    vec4(1.0, -1.0, topZ, 1.0), // 5
    vec4(0.25, -1, topZ, 1.0), // 6
    vec4(0.25, 0.0, topZ, 1.0), // 7
    vec4(-0.25, 0.0, topZ, 1.0), // 8
    vec4(-0.25, -1, topZ, 1.0), // 9
    vec4(-1, -1, topZ, 1.0), // 10
    vec4(-1.0, 0.0, topZ, 1.0), // 11 
    
    // BOTTOM 
    vec4(-1.0, 1.0, bottomZ, 1.0), // 12
    vec4(-0.25, 1.0, bottomZ, 1.0), // 13
    vec4(0.25, 1.0, bottomZ, 1.0), // 14
    vec4(1.0, 1.0, bottomZ, 1.0), // 15
    vec4(1.0, 0.0, bottomZ, 1.0), // 16
    vec4(1.0, -1.0, bottomZ, 1.0), // 17
    vec4(0.25, -1, bottomZ, 1.0), // 18
    vec4(0.25, 0.0, bottomZ, 1.0), // 19
    vec4(-0.25, 0.0, bottomZ, 1.0), // 20
    vec4(-0.25, -1, bottomZ, 1.0), // 21
    vec4(-1, -1, bottomZ, 1.0), // 22
    vec4(-1.0, 0.0, bottomZ, 1.0), // 23 
    
];

var indexes = [
    [11, 9, 10, 11, 9, 8], // 1
    [0, 8, 11, 0, 8, 1], // 2
    [1, 7, 8, 1, 7, 2], // 3
    [2, 4, 7, 2, 4, 3], // 4
    [7, 5, 6, 7, 5, 4], // 5

    [23, 21, 22, 23, 21, 20], // 1
    [12, 20, 23, 12, 20, 13], // 2
    [13, 19, 20, 13, 19, 14], // 3
    [14, 16, 19, 14, 16, 15], // 4
    [19, 17, 18, 19, 17, 16], // 5

    [0, 13, 12, 0, 13, 1], // a
    [1, 14, 13, 1, 14, 2], // b
    [2, 15, 14, 2, 15, 3], // c
    [3, 16, 15, 3, 16, 4], // d
    [4, 17, 16, 4, 17, 5], // e
    [5, 18, 17, 5, 18, 6], // f
    [6, 19, 18, 6, 19, 7], // g
    [7, 20, 19, 7, 20, 8], // h
    [8, 21, 20, 8, 21, 9], // i
    [9, 22, 21, 9, 22, 10], // j
    [10, 23, 22, 10, 23, 11], // k
    [11, 12, 23, 11, 12, 0], // l
];

function Floor() {
    this.numPositions = 0;
    this.positions = [];
    this.norms = [];

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        return this.numPositions;
    }
    
    this.init = function() {
        // console.log(indexes.length);
        for (var i = 0; i < indexes.length; i++) {
            var norm = this.calcNorm(indexes[i][0], indexes[i][1], indexes[i][2]);

            for (var j = 0; j < 6; j++) {
                this.positions.push(vertices[indexes[i][j]]);
                this.norms.push(norm);
            }
            console.log(i);
        }

    }

    this.drawFloor = function() {
        // GET TRANSFORMATION MATRIX
        var m = this.determineTransformationMatrix();

        for (var i = 0; i < this.positions.length; i++) {
            var temp = mult(m, this.positions[i]);
            positionsArray.push(temp);
            this.numPositions++;
        }

        for (var i = 0; i < this.norms.length; i++) {
            normalsArray.push(this.norms[i]);
        }
    }

    this.calcNorm = function(a, b, c) {
        var t1 = subtract(vertices[b], vertices[a]);
        var t2 = subtract(vertices[c], vertices[b]);
        var normal = cross(t1, t2);
        normal = vec3(normal);

        return normal
    }

    // CALCULATE TRANSFORMATION MATRIX
    this.determineTransformationMatrix = function() {
        // SET UP VARIABLES
        var m = mat4(); // identity matrix that will be the translation matrix
        var r, s, t; // variables corresponding to each transformation

        // DETERMINE MATRIX FOR EACH TRANSFORMATION
        t = translate(0, 0, 0); // translation matrix -> move slightly up
        r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
        s = scale(0.75, 0.75, 1); // scaling matrix -> 

        // DETERMINE TRANSFORMATION MATRIX
        m = mult(m, r); 
        m = mult(m, s);
        m = mult(m, t);

        return m; // return calculated matrix
    }
}


///////////////////////////////////
/*    MAIN & RENDER FUNCTION     */
///////////////////////////////////

window.onload = function initialize() {
    // GET CANVAS
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't a2ailable");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 0.0);

    gl.enable(gl.DEPTH_TEST);

    // 
    var floor = new Floor();
    floor.init();
    floor.drawFloor();
    numPositions = numPositions + floor.getNumPositions();
    console.log(numPositions);



    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0);

    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    // FIXME: remove
    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
       lightPosition );

    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"), materialShininess);

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),
       false, flatten(projectionMatrix));

    // DRAW
    render();
}

var render = function(){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0;
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));

    //console.log(modelView);

    gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uModelViewMatrix"), false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);


    requestAnimationFrame(render);
}