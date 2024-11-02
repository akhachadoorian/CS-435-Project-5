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
var vTexIDs = [];
// var vBuffer; // vertex buffer
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
    vec3(0.0, 1.0, 3.0), // lower y value
    vec3(0.0, -0.1, 3.0),  // B
    vec3(0.0, -2.0, 3.0),  // underside
    vec3(-3.0, 3.0, 3.0),  // look at right wall
    vec3(0.0, 3.0, 3.0),   // at origins 
    vec3(3.0, 3.0, 3.0),   // look at left wall
    vec3(3.0, 2.0, 3.0),   // look at left wall
]; // holds all possible camera positions

var eyeIndex = 0; // holds the index for the camera position

var eye = eyePositions[6]; // holds the camera position for rendering FIXME:
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

function configureTexture( image, uniformVarName, textureUnit, uniformLoc ) {
    // console.log("uniformVarName: " + uniformVarName);

    texture = gl.createTexture();
    gl.activeTexture(textureUnit); 
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, uniformVarName), uniformLoc);
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
var wXMax = 2.0;
var wXMin = -2.0;
var wYMax = 2.0;
var wYMin = -2.0;
var wZMax = 2.0;
var wZMin = -2.0;
var diff = 0.2;

var vertexes = [
    // OUTER WALL
    vec4(wXMin, wYMin, wZMin, 1.0), // 0
    vec4(wXMin, wYMax, wZMin, 1.0), // 1
    vec4(wXMax, wYMax, wZMin, 1.0), // 2
    vec4(wXMax, wYMin, wZMin, 1.0), // 3
    vec4(wXMax, wYMin, wZMax, 1.0), // 4
    vec4(wXMax, wYMax, wZMax, 1.0), // 5
    vec4(wXMin, wYMax, wZMax, 1.0), // 6
    vec4(wXMin, wYMin, wZMax, 1.0), // 7

    // INNER WALL
    vec4(wXMin + diff, wYMin, wZMin + diff, 1.0), // 8
    vec4(wXMin + diff, wYMax, wZMin + diff, 1.0), // 9
    vec4(wXMax - diff, wYMax, wZMin + diff, 1.0), // 10
    vec4(wXMax - diff, wYMin, wZMin + diff, 1.0), // 11
    vec4(wXMax - diff, wYMin, wZMax, 1.0), // 12
    vec4(wXMax - diff, wYMax, wZMax, 1.0), // 13
    vec4(wXMin + diff, wYMax, wZMax, 1.0), // 14
    vec4(wXMin + diff, wYMin, wZMax, 1.0), // 15

    vec4(wXMin, wYMin - diff, wZMin, 1.0), // 16
    vec4(wXMax, wYMin - diff, wZMin, 1.0), // 17
    vec4(wXMax, wYMin - diff, wZMax, 1.0), // 18
    vec4(wXMin, wYMin - diff, wZMax, 1.0), // 19
]



function Walls() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(1.0, 0.0, 0.0, 1.0); // FIXME: REMOVE?
    this.texture = [];
    this.texID = 0.0;

    this.texIndexes = [0, 1, 2, 0, 2, 3];

    this.indexes = [
        // OUTSIDE WALLS
        [0, 1, 2, 0, 2, 3], // back wall
        [4, 5, 2, 4, 2, 3], // right wall
        [0, 1, 6, 0, 6, 7], // left wall

        // INSIDE WALLS
        [8, 9, 10, 8, 10, 11], // back wall
        [12, 13, 10, 12, 10, 11], // right wall
        [8, 9, 14, 8, 14, 15], // left  wall

        // FRONT CONNECTION
        [7, 6, 14, 7, 14, 15], // left front wall
        [4, 5, 13, 4, 13, 12], // right front wall

        // TOP CONNECTIONS
        [9, 1, 6, 9, 6, 14], // top left wall
        [2, 10, 13, 2, 13, 5], // top right wall
        [10, 2,  1, 10, 1, 9] // top back wall
    ];

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        // console.log("numPositions: " + this.numPositions)
        return this.numPositions;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        for (var i = 0; i < this.indexes.length; i++) {
            for (var j = 0; j < this.indexes[i].length; j++) {
                this.positions.push(vertexes[this.indexes[i][j]]);
                this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }
    }

    this.drawWalls = function() {
        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);
            this.numPositions++;

            let t = parseFloat(this.texID).toFixed(1);
            vTexIDs.push(t);
        }
    }
}

function Floor() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(1.0, 0.0, 0.0, 1.0); // FIXME: REMOVE?
    this.texture = [];
    this.texID = 1.0;

    this.indexes = [
        [7, 3, 4, 7, 0, 3],
        [19, 17, 18, 19, 16, 17],

        [19, 4, 18, 19, 7, 4],
    ];

    this.texCIndex = [0, 2, 3, 0, 1, 2];

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        // console.log("numPositions: " + this.numPositions)
        return this.numPositions;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        for (var i = 0; i < this.indexes.length; i++) {
            for (var j = 0; j < this.indexes[i].length; j++) {
                this.positions.push(vertexes[this.indexes[i][j]]);
                this.texture.push(texCoord[this.texCIndex[j]]);

                // console.log("index: "+  this.indexes[i][j])
                // console.log(texCoord[this.indexes[i][j] % 4]);
            }
        }
    }

    this.drawFloor = function() {
        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);
            this.numPositions++;

            let t = parseFloat(this.texID).toFixed(1);
            vTexIDs.push(t);
        }
    }
}

var tXMax = 1.5;
var tXMin = -1.5;
var tYMax = 0.0;
var tYMin = -2.0;
var tZMin = -1.0;
var tZMax = 1.0;
var legWidth = 0.2;

var vertexesTable = [
    // TOP OF TABLE
    vec4(tXMin, tYMax, tZMax, 1.0), // 0
    vec4(tXMin, tYMax, tZMin, 1.0), // 1
    vec4(tXMax, tYMax, tZMin, 1.0), // 2
    vec4(tXMax, tYMax, tZMax, 1.0), // 3

    // BOTTOM OF TABLE 
    vec4(tXMin, tYMax - diff, tZMax, 1.0), // 4
    vec4(tXMin, tYMax - diff, tZMin, 1.0), // 5
    vec4(tXMax, tYMax - diff, tZMin, 1.0), // 6
    vec4(tXMax, tYMax - diff, tZMax, 1.0), // 7

    // BACK RIGHT LEG
    vec4(tXMax - legWidth, tYMax - diff, tZMin, 1.0), // 8
    vec4(tXMax - legWidth, tYMax - diff, tZMin + legWidth, 1.0), // 9
    vec4(tXMax, tYMax - diff, tZMin + legWidth, 1.0), // 10

    vec4(tXMax, tYMin, tZMin, 1.0),  // 11
    vec4(tXMax - legWidth, tYMin, tZMin, 1.0), // 12
    vec4(tXMax - legWidth, tYMin, tZMin + legWidth, 1.0), // 13
    vec4(tXMax, tYMin, tZMin + legWidth, 1.0), // 14

    // BACK LEFT LEG
    vec4(tXMin + legWidth, tYMax - diff, tZMin, 1.0), // 15
    vec4(tXMin + legWidth, tYMax - diff, tZMin + legWidth, 1.0), // 16
    vec4(tXMin, tYMax - diff, tZMin + legWidth, 1.0), // 17

    vec4(tXMin + legWidth, tYMin, tZMin, 1.0), // 18
    vec4(tXMin + legWidth, tYMin, tZMin + legWidth, 1.0), // 19
    vec4(tXMin, tYMin, tZMin + legWidth, 1.0), // 20
    vec4(tXMin, tYMin, tZMin, 1.0), // 21

    // FRONT LEFT LEG
    vec4(tXMin, tYMax - diff, tZMax - legWidth, 1.0), // 22
    vec4(tXMin + legWidth, tYMax - diff, tZMax - legWidth, 1.0), // 23
    vec4(tXMin + legWidth, tYMax - diff, tZMax, 1.0), // 24

    vec4(tXMin, tYMin, tZMax, 1.0), // 25
    vec4(tXMin, tYMin, tZMax - legWidth, 1.0), // 26
    vec4(tXMin + legWidth, tYMin, tZMax - legWidth, 1.0), // 27
    vec4(tXMin + legWidth, tYMin, tZMax, 1.0), // 28
    
    // FRONT LEFT LEG
    vec4(tXMax, tYMax - diff, tZMax - legWidth, 1.0), // 29
    vec4(tXMax - legWidth, tYMax - diff, tZMax - legWidth, 1.0), // 30
    vec4(tXMax - legWidth, tYMax - diff, tZMax, 1.0), // 31

    vec4(tXMax, tYMin, tZMax, 1.0), // 32
    vec4(tXMax, tYMin, tZMax - legWidth, 1.0), // 33
    vec4(tXMax - legWidth, tYMin, tZMax - legWidth, 1.0), // 34
    vec4(tXMax - legWidth, tYMin, tZMax, 1.0), // 35
];

function Table() {
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(1.0, 0.0, 0.0, 1.0); // FIXME: REMOVE?
    this.texture = [];
    this.texID = 2.0;

    this.indexes = [
        // TABLE TOP
        [0, 1, 2, 0, 2, 3], // top of table
        [4, 5, 6, 4, 6, 7], // underside of table

        // TABLE TOP CONNECTIONS
        [4, 0, 3, 4, 3, 7], // front of table
        [7, 3, 2, 7, 2, 6], // right side
        [5, 1, 0, 5, 0, 4], // left side
        [6, 2, 1, 6, 1, 5], // back side
        
        // BACK RIGHT LEG
        [12, 8, 6, 12, 6, 11], // back side
        [12, 8, 9, 12, 9, 13], // left side
        [13, 9, 10, 13, 10, 14], // front side
        [14, 10, 6, 14, 6, 11], // right side

        // BACK LEFT LEG
        [21, 5, 15, 21, 15, 18], // back side
        [21, 5, 17, 21, 17, 20], // left side
        [20, 17, 16, 20, 16, 19], // front side
        [19, 16, 15, 19, 15, 18], // right side

        // FRONT LEFT LEG
        [27, 23, 22, 27, 22, 26],
        [26, 22, 4, 26, 4, 25],
        [25, 4, 24, 25, 24, 28],
        [28, 24, 23, 28, 23, 27],

        // FRONT RIGHT LEG
        [33, 29, 30, 33, 30, 34],
        [34, 30, 31, 34, 31, 35],
        [35, 31, 7, 35, 7, 32],
        [32, 7, 29, 32, 29, 33],
    ];

    this.texIndexes = [0, 1, 2, 0, 2, 3];

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        // console.log("numPositions: " + this.numPositions)
        return this.numPositions;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        for (var i = 0; i < this.indexes.length; i++) {
            for (var j = 0; j < this.indexes[i].length; j++) {
                this.positions.push(vertexesTable[this.indexes[i][j]]);
                this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }
    }

    this.drawTable = function() {
        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);
            this.numPositions++;

            let t = parseFloat(this.texID).toFixed(1);
            vTexIDs.push(t);
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
    // w.drawWalls();
    // numPositions = numPositions + w.getNumPositions();

    var f = new Floor();
    f.init();
    // f.drawFloor();
    // numPositions = numPositions + f.getNumPositions();

    var t = new Table();
    t.init();
    t.drawTable();

    numPositions = numPositions + t.getNumPositions();

    // SET UP PROGRAM
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ///////////////////////////////////
    /*    SET UP SHADER VARIABLES    */
    ///////////////////////////////////

    
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

    var tIDBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tIDBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTexIDs), gl.STATIC_DRAW);

    var textIDLoc = gl.getAttribLocation(program, "aTexID");
    gl.vertexAttribPointer(textIDLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textIDLoc);
    

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

    var image0 = document.getElementById("texImage0");
    configureTexture(image0, "uTextureMap0", gl.TEXTURE0, 0);

    var image1 = document.getElementById("texImage1");
    configureTexture(image1, "uTextureMap1", gl.TEXTURE1, 1);

    var image2 = document.getElementById("texImage2");
    configureTexture(image2, "uTextureMap2", gl.TEXTURE2, 2);


    // console.log(vTexIDs);

    // DRAW
    render();
}

// RENDER FUNCTION
var render = function() {
    // console.log("Render function called");

    // CLEAR BITS
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    

    // gl.drawElements(gl.TRIANGLES, 0, numWallPositions);

    // DRAW FLOOR AND WALLS
    gl.drawArrays( gl.TRIANGLES, 0, numPositions);



}