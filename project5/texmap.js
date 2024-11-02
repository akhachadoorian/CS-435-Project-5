/*
    CS 435
    Project 5
    Alex Khachadoorian
    FIXME: description
    py -m http.server
*/

"use strict"

///////////////////////////////////
/*       GLOBAL VARIABLES        */
///////////////////////////////////

var canvas; 
var gl;
var numPositions = 0; 
var numWallPositions; //FIXME:
var program;

///////////////////////////////////
// BUFFER VARIABLES
var vPositions = []; // holds all the vertex positions
var vColors = [];
var vTexCoords = [];
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
    vec3(-3.0, 3.0, 3.0),  // look at right wall
    vec3(0.0, 3.0, 3.0),   // at origins 
    vec3(3.0, 3.0, 3.0),   // look at left wall
]; // holds all possible camera positions

var eyeIndex = 0; // holds the index for the camera position

var eye = eyePositions[5]; // holds the camera position for rendering FIXME:
var at = vec3(0.0, 0.0, 0.0); // holds camera aim -> at origin
var up = vec3(0.0, 1.0, 0.0); // holds up vector -> positive y direction
///////////////////////////////////


var texture;
// var texSize = 64;

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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexMap"), 0);
}

///////////////////////////////////
/*           CLASSES             */
///////////////////////////////////
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

//
var wMaxX = 2.0;
var wMinX = -2.0;
var wMaxY = 2.0;
var wMinY = -2.0;
var wMaxZ = 2.0;
var wMinZ = -2.0;
var wallDiff = 0.2;

var fTopY;
var fBottomY;



var vertexes = [
    // OUTER WALL
    vec4(wMinX, wMinY, wMinZ, 1.0), // 0
    vec4(wMinX, wMaxY, wMinZ, 1.0), // 1
    vec4(wMaxX, wMaxY, wMinZ, 1.0), // 2
    vec4(wMaxX, wMinY, wMinZ, 1.0), // 3
    vec4(wMaxX, wMinY, wMaxZ, 1.0), // 4
    vec4(wMaxX, wMaxY, wMaxZ, 1.0), // 5
    vec4(wMinX, wMaxY, wMaxZ, 1.0), // 6
    vec4(wMinX, wMinY, wMaxZ, 1.0), // 7

    // INNER WALL
    vec4(wMinX + wallDiff, wMinY, wMinZ + wallDiff, 1.0), // 8
    vec4(wMinX + wallDiff, wMaxY, wMinZ + wallDiff, 1.0), // 9
    vec4(wMaxX - wallDiff, wMaxY, wMinZ + wallDiff, 1.0), // 10
    vec4(wMaxX - wallDiff, wMinY, wMinZ + wallDiff, 1.0), // 11
    vec4(wMaxX - wallDiff, wMinY, wMaxZ, 1.0), // 12
    vec4(wMaxX - wallDiff, wMaxY, wMaxZ, 1.0), // 13
    vec4(wMinX + wallDiff, wMaxY, wMaxZ, 1.0), // 14
    vec4(wMinX + wallDiff, wMinY, wMaxZ, 1.0), // 15
]



function Walls() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(1.0, 0.0, 0.0, 1.0);
    this.texture = [];

    this.outsideIndexes = [
        [0, 1, 2, 0, 2, 3], // back wall
        [3, 2, 4, 2, 4, 5],
        [0, 1, 6, 0, 6, 7],

        [8, 9, 10, 8, 10, 11],
        [11, 10, 12, 10, 12, 13],
        [8, 9, 14, 8, 14, 15],

        [15, 14, 6, 15, 6, 7],
        [4, 5, 13, 4, 13, 12],

        [9, 1, 6, 9, 6, 14],
        [2, 10, 13, 2, 13, 5],
        [10, 2,  1, 10, 1, 9]
    ]

    // this.innerIndexes = [
    //     [0, 1, 2, 0, 2, 3],
    //     [3, 2, 4, 2, 4, 5],
    //     [0, 1, 6, 0, 6, 7]
    // ];
    


    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        console.log("numPositions: " + this.numPositions)
        return this.numPositions;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        for (var i = 0; i < this.outsideIndexes.length; i++) {
            for (var j = 0; j < this.outsideIndexes[i].length; j++) {
                this.positions.push(vertexes[this.outsideIndexes[i][j]]);
                this.texture.push(texCoord[this.outsideIndexes[i][j] % 4]);
            }
        }

        // for (var i = 0; i < this.innerIndexes.length; i++) {
        //     for (var j = 0; j < this.innerIndexes[i].length; j++) {
        //         this.positions.push(insideWallVertexes[this.innerIndexes[i][j]]);
        //         this.texture.push(texCoord[this.innerIndexes[i][j] % 4]);
        //     }
        // }
    }

    this.drawWalls = function() {
        // console.log(this.texture);

        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);
            this.numPositions++;
        }
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

    // SET UP CANVAS
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

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
    // console.log("vPositions:", vPositions);

    var w = new Walls();
    w.init();
    w.drawWalls();
    numWallPositions = w.numPositions();
    console.log(numWallPositions);
    // numPositions = numPositions + w.getNumPositions();
    // console.log("numPositions: " + numPositions);
    // console.log("vPositions:", vPositions);
    // console.log("vTexCoord:", vTexCoords);

    // SET UP PROGRAM
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ///////////////////////////////////
    /*    SET UP SHADER VARIABLES    */
    ///////////////////////////////////
    // vPositions = [
    //     vec4(0.0, 0.5, 0.0, 1.0), // top center
    //     vec4(-0.5, -0.5, 0.0, 1.0), // bottom left
    //     vec4(0.5, -0.5, 0.0, 1.0) // bottom right
    // ];
    // numPositions = 3;
    
    // vColors.push(vec4(1.0, 0.0, 0.0, 1.0));
    // vColors.push(vec4(1.0, 0.0, 0.0, 1.0));
    // vColors.push(vec4(1.0, 0.0, 0.0, 1.0));
    // console.log(vPositions);

    
    // CREATE & BIND VERTEX BUFFER
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vPositions), gl.STATIC_DRAW);

    // SET POSITION ATTRIBUTE VARIABLE
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    console.log("Position Location:", positionLoc);
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vTexCoords), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    



    // GET UNIFORM VARIABLE LOCATIONS
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    // CALCULATE MATRIXES
    modelViewMatrix = lookAt(eye, at , up);
    // console.log(modelViewMatrix)
    projectionMatrix = ortho(theLeft, theRight, theBottom, theTop, near, far);

    ///////////////////////////////////
    /*      SET SHADER VARIABLES     */
    ///////////////////////////////////

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) ); // set modelViewMatrix
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix)); // set projectionMatrix

    ///////////////////////////////////

    // DRAW
    render();
}

// RENDER FUNCTION
var render = function() {
    console.log("Render function called");

    // CLEAR BITS
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var image = document.getElementById("texImage1");
    configureTexture(image);

    gl.drawElements(gl.TRIANGLES, 0, numWallPositions);

    // DRAW FLOOR AND WALLS
    // gl.drawArrays( gl.TRIANGLES, 0, numPositions);



}