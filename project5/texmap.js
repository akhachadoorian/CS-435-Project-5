/*
    CS 435
    Project 5
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
var program;

///////////////////////////////////
// BUFFER VARIABLES
var vPosition = []; // holds all the vertex positions
var vColors = [];
var vBuffer; // vertex buffer
// var normals = []; // holds all the normals for the vertexes
///////////////////////////////////

///////////////////////////////////
// PERSPECTIVE VARIABLES
var near = -10; // near plane is 10 units behind the camera
var far = 10; // far plane is 10 units in front of the camera
var theLeft = -3.0; // left is 3 units left of the origin
var theRight = 3.0; // right is 3 units right of the origin
var theTop = 3.0; // top is 3 units above of the origin
var theBottom = -3.0; // bottom is 3 units below the origin
///////////////////////////////////

///////////////////////////////////
// VIEW VARIABLES
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc; // view variable locations in shaders
var modelViewMatrix; //  holds the model view matrix
var projectionMatrix; // holds the projection matrix
// var normalMatrix; //holds the normal matrix
///////////////////////////////////


///////////////////////////////////
// CAMERA VARIABLES
var eyePositions = [
    vec3(-3.0, 3.0, -3.0), // A
    vec3(0.0, 3.0, -3.0),  // B
    vec3(3.0, 3.0, -3.0),  // C
    vec3(-3.0, 3.0, 3.0),  // D
    vec3(0.0, 3.0, 3.0),   // E
    vec3(3.0, 3.0, 3.0),   // F
]; // holds all possible camera positions

var eyeIndex = 0; // holds the index for the camera position

var eye = eyePositions[0]; // holds the camera position for rendering
var at = vec3(0.0, 0.0, 0.0); // holds camera aim -> at origin
var up = vec3(0.0, 1.0, 0.0); // holds up vector -> positive y direction
///////////////////////////////////


var texture;
var texSize = 64;

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];



///////////////////////////////////
/*       GLOBAL FUNCTIONS        */
///////////////////////////////////

// FUNCTION TO CONVERT DEGREES TO RADIANS
// angle -> angle in degrees
function degreeToRadians(angle) {
    return angle * (Math.PI / 180);
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexMap"), 0);
}

///////////////////////////////////
/*           CLASSES             */
///////////////////////////////////

function Walls() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPosition
    this.positions = []; // temporary array to hold the vertices
    this.bottomY;
    this.topY;

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        return this.numPositions;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {}
}


///////////////////////////////////
/*    MAIN & RENDER FUNCTION     */
///////////////////////////////////

window.onload = function initialize() {
    // GET CANVAS
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't a2ailable");

    // SET UP CANVAS
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    
    // GET NUMBER OF POSITIONS
    // numPositions = numPositions + floor.getNumPositions();
    // numPositions = numPositions + wall.getNumPositions();

    ///////////////////////////////////
    /*      BUTTONS & SELECTS        */
    ///////////////////////////////////

    document.getElementById("power-on").onclick = function() {}
    document.getElementById("power-off").onclick = function() {}
    document.getElementById("pause").onclick = function() {}
    document.getElementById("play").onclick = function() {}
    document.getElementById("prev").onclick = function() {}
    document.getElementById("next").onclick = function() {}

    ///////////////////////////////////



    // SET UP PROGRAM
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ///////////////////////////////////
    /*    SET UP SHADER VARIABLES    */
    ///////////////////////////////////

    // CREATE & BIND VERTEX BUFFER
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vPosition), gl.STATIC_DRAW);

    // SET POSITION ATTRIBUTE VARIABLE
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    // var tBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    // var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    // gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(texCoordLoc);

    // var image = document.getElementById("texImage");
    // configureTexture(image);



    // GET UNIFORM VARIABLE LOCATIONS
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    ///////////////////////////////////

    // DRAW
    render();
}

// RENDER FUNCTION
var render = function() {
    // CLEAR BITS
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // CALCULATE MATRIXES
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(theLeft, theRight, theBottom, theTop, near, far);

    ///////////////////////////////////
    /*      SET SHADER VARIABLES     */
    ///////////////////////////////////

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) ); // set modelViewMatrix
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix)); // set projectionMatrix


    // DRAW FLOOR AND WALLS
    gl.drawArrays( gl.TRIANGLES, 0, numPositions);

}