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
var vBuffer, cBuffer, tBuffer, tIDBuffer;

// var normals = []; // holds all the normals for the vertexes
///////////////////////////////////

///////////////////////////////////
// PERSPECTIVE VARIABLES
var near = -20; // near plane is 10 units behind the camera
var far = 20; // far plane is 10 units in front of the camera
var theLeft = -5.0; // left is 3 units left of the origin
var theRight = 5.0; // right is 3 units right of the origin
var theTop = 5.0; // top is 3 units above of the origin
var theBottom = -5.0; // bottom is 3 units below the origin
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
    vec3(0.0, 1.0, 5.0), // lower y value
    vec3(-5.0, 5.0, 5.0),  // look at right wall
    vec3(0.0, 5.0, 5.0),   // at origins 
    vec3(5.0, 5.0, 5.0),   // look at left wall
    vec3(0.0, -5.0, 5.0),  // underside
]; // holds all possible camera positions

var eyeIndex = 0; // holds the index for the camera position

var eye = eyePositions[0]; // holds the camera position for rendering FIXME:
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

var screenOptions = [
    "black",
    "s1",
    "s2",
    "s3",
];

var screenIndex = 0; // FIXME:
var powerOn = false; // FIXME:
var play = false;

var w, f, t, tv;


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

function reDrawScreen() {
    numPositions = 0;
    vPositions = [];
    vColors = [];
    vTexCoords = [];
    vTexIDs = [];

    w.drawWalls();
    numPositions = numPositions + w.getNumPositions();
    f.drawFloor();
    numPositions = numPositions + f.getNumPositions();
    t.drawTable();
    numPositions = numPositions + t.getNumPositions();
    console.log(screenOptions[screenIndex])
    tv.drawTV(screenOptions[screenIndex]);
    numPositions = numPositions + tv.getNumPositions();

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vPositions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors), gl.STATIC_DRAW );

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vTexCoords), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, tIDBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTexIDs), gl.STATIC_DRAW);
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
var wXMax = 4.0;
var wXMin = -4.0;
var wYMax = 4.0;
var wYMin = -4.0;
var wZMax = 4.0;
var wZMin = -4.0;
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

var tXMax = 3.0;
var tXMin = -3.0;
var tYMax = -1.0;
var tYMin = -4.0;
var tZMin = -3.0;
var tZMax = 1.0;
var tableWidth = 0.5;
var legWidth = 0.2;

var vertexesTable = [
    // TOP OF TABLE
    vec4(tXMin, tYMax, tZMax, 1.0), // 0
    vec4(tXMin, tYMax, tZMin, 1.0), // 1
    vec4(tXMax, tYMax, tZMin, 1.0), // 2
    vec4(tXMax, tYMax, tZMax, 1.0), // 3

    // BOTTOM OF TABLE 
    vec4(tXMin, tYMax - tableWidth, tZMax, 1.0), // 4
    vec4(tXMin, tYMax - tableWidth, tZMin, 1.0), // 5
    vec4(tXMax, tYMax - tableWidth, tZMin, 1.0), // 6
    vec4(tXMax, tYMax - tableWidth, tZMax, 1.0), // 7

    // BACK RIGHT LEG
    vec4(tXMax - legWidth, tYMax - tableWidth, tZMin, 1.0), // 8
    vec4(tXMax - legWidth, tYMax - tableWidth, tZMin + legWidth, 1.0), // 9
    vec4(tXMax, tYMax - tableWidth, tZMin + legWidth, 1.0), // 10

    vec4(tXMax, tYMin, tZMin, 1.0),  // 11
    vec4(tXMax - legWidth, tYMin, tZMin, 1.0), // 12
    vec4(tXMax - legWidth, tYMin, tZMin + legWidth, 1.0), // 13
    vec4(tXMax, tYMin, tZMin + legWidth, 1.0), // 14

    // BACK LEFT LEG
    vec4(tXMin + legWidth, tYMax - tableWidth, tZMin, 1.0), // 15
    vec4(tXMin + legWidth, tYMax - tableWidth, tZMin + legWidth, 1.0), // 16
    vec4(tXMin, tYMax - tableWidth, tZMin + legWidth, 1.0), // 17

    vec4(tXMin + legWidth, tYMin, tZMin, 1.0), // 18
    vec4(tXMin + legWidth, tYMin, tZMin + legWidth, 1.0), // 19
    vec4(tXMin, tYMin, tZMin + legWidth, 1.0), // 20
    vec4(tXMin, tYMin, tZMin, 1.0), // 21

    // FRONT LEFT LEG
    vec4(tXMin, tYMax - tableWidth, tZMax - legWidth, 1.0), // 22
    vec4(tXMin + legWidth, tYMax - tableWidth, tZMax - legWidth, 1.0), // 23
    vec4(tXMin + legWidth, tYMax - tableWidth, tZMax, 1.0), // 24

    vec4(tXMin, tYMin, tZMax, 1.0), // 25
    vec4(tXMin, tYMin, tZMax - legWidth, 1.0), // 26
    vec4(tXMin + legWidth, tYMin, tZMax - legWidth, 1.0), // 27
    vec4(tXMin + legWidth, tYMin, tZMax, 1.0), // 28
    
    // FRONT LEFT LEG
    vec4(tXMax, tYMax - tableWidth, tZMax - legWidth, 1.0), // 29
    vec4(tXMax - legWidth, tYMax - tableWidth, tZMax - legWidth, 1.0), // 30
    vec4(tXMax - legWidth, tYMax - tableWidth, tZMax, 1.0), // 31

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

var tvXMax = 2.5;
var tvXMin = -2.5;
var tvYMax = 2.5;
var tvYMin = -1.0;
var tvZMax = 0.5;
var tvZMin = -2.5;

var vcrSize = 0.5;
var screenBorder = 0.3;

var vertexesTV = [
    // FRONT
    vec4( tvXMin, tvYMin, tvZMax, 1.0), // 0
    vec4( tvXMin, tvYMin + vcrSize, tvZMax, 1.0), // 1
    vec4( tvXMin, tvYMax, tvZMax, 1.0), // 2
    vec4( tvXMax, tvYMax, tvZMax, 1.0), // 3
    vec4( tvXMax, tvYMin + vcrSize, tvZMax, 1.0), // 4
    vec4( tvXMax, tvYMin, tvZMax, 1.0), // 5

    // BACK
    vec4( tvXMin, tvYMin, tvZMin, 1.0), // 6
    vec4( tvXMin, tvYMin + vcrSize, tvZMin, 1.0), // 7
    vec4( tvXMin, tvYMax - 2.0, tvZMin, 1.0), // 8
    vec4( tvXMax, tvYMax - 2.0, tvZMin, 1.0), // 9
    vec4( tvXMax, tvYMin + vcrSize, tvZMin, 1.0), // 10
    vec4( tvXMax, tvYMin, tvZMin, 1.0), // 11

    // SCREEN
    vec4( tvXMin + screenBorder, tvYMin + vcrSize + screenBorder, tvZMax + 0.1, 1.0),  // 12
    vec4( tvXMin + screenBorder, tvYMax - screenBorder, tvZMax + 0.1, 1.0),  // 13
    vec4( tvXMax - screenBorder, tvYMax - screenBorder, tvZMax + 0.1, 1.0),  // 14
    vec4( tvXMax - screenBorder, tvYMin + vcrSize + screenBorder, tvZMax + 0.1, 1.0),  // 15
]

function Buttons() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = [];
    this.color = vec4(0.161, 0.161, 0.161, 1.0); // FIXME: REMOVE?

    this.getPositions = function() {
        return this.positions;
    }

    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        this.vcrTape();

        var t = translate(-8.0, -4.4, 0.0);
        this.squareButton(t);
        
        t = translate(-10.5, -4.4, 0.0);
        this.squareButton(t);

        t = translate(-13.0, -4.4, 0.0);
        this.squareButtonRed(t);

    }

    this.vcrTape = function() {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            var t = translate(0.8, -4.7, 0.0);
            var s = scale(1.2, 0.15, 1.0);
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(this.color);
        }
    }

    this.squareButton = function(t) {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // var t = translate(0.8, -4.7, 0.0);
            var s = scale(0.16, 0.16, 1.0);
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(this.color);
        }
    }

    this.squareButtonRed = function(t) {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // var t = translate(0.8, -4.7, 0.0);
            var s = scale(0.16, 0.16, 1.0);
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(vec4(0.5, 0.0, 0.0, 1.0));
        }
    }
}

function TV() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = [];
    this.colorTV = vec4(0.161, 0.161, 0.161, 1.0); // FIXME: REMOVE?
    this.colorVCR = vec4(0.329, 0.329, 0.329, 1.0);
    this.colorScreen = vec4(0.0, 0.0, 0.0, 1.0);
    this.texture = [];
    this.texID = -1.0;
    this.texIndexes = [0, 1, 2, 0, 2, 3];

    this.tvBasePositions = [];
    this.tvBaseColors = [];
    this.blackScreenPositions = [];
    this.blackScreenColors = [];
    this.screen1Positions = [];
    this.screen1Colors = [];
    this.screen2Positions = [];
    this.screen2Colors = [];
    this.screen3Positions = [];
    this.screen3Colors = [];

    this.vrcIndexes = [
        [6, 7, 10, 6, 10, 11], // back
        [5, 4, 10, 5, 10, 11], // right
        [6, 7, 1, 6, 1, 0], // left
        [0, 1, 4, 0, 4, 5], // front
    ];

    this.tvBaseIndexes = [
        [7, 8, 9, 7, 9, 10], // back 
        [4, 3, 9, 4, 9, 10], // right
        [7, 8, 2, 7, 2, 1], // left
        [1, 2, 3, 1, 3, 4], // front
        [2, 8, 9, 2, 9, 3], // top
    ];

    this.screenIndexes = [
        [12, 13, 14, 12, 14, 15],
    ];

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
    this.init = function() {
        for (var i = 0; i < this.vrcIndexes.length; i++) {
            for (var j = 0; j < this.vrcIndexes[i].length; j++) {
                this.tvBasePositions.push(vertexesTV[this.vrcIndexes[i][j]]);
                this.tvBaseColors.push(this.colorVCR);
                // this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }

        for (var i = 0; i < this.tvBaseIndexes.length; i++) {
            for (var j = 0; j < this.tvBaseIndexes[i].length; j++) {
                this.tvBasePositions.push(vertexesTV[this.tvBaseIndexes[i][j]]);
                this.tvBaseColors.push(this.colorTV);
                // this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }

        this.initScreens();

        var buttons = new Buttons();
        buttons.init();
        var btnsColors = buttons.getColors();
        var btnsPositions = buttons.getPositions();

        for (var i = 0; i < btnsPositions.length; i++) {
            this.tvBasePositions.push(btnsPositions[i]);
            this.tvBaseColors.push(btnsColors[i]);
        }
        
    }

    this.initScreens = function() {
        // BLACK SCREEN
        for (var i = 0; i < this.screenIndexes.length; i++) {
            for (var j = 0; j < this.screenIndexes[i].length; j++) {
                this.blackScreenPositions.push(vertexesTV[this.screenIndexes[i][j]]);
                this.blackScreenColors.push(this.colorScreen);
                // this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }

        // SCREEN 1
        var s1 = new Screen1();
        s1.init();
        this.screen1Colors = s1.getColors();
        this.screen1Positions = s1.getPositions();

        var s2 = new Screen2();
        s2.init();
        this.screen2Colors = s2.getColors();
        this.screen2Positions = s2.getPositions();

        var s3 = new Screen3();
        s3.init();
        this.screen3Colors = s3.getColors();
        this.screen3Positions = s3.getPositions();

    }

    this.drawTV = function(screenType) {
        for (var i = 0; i < this.tvBasePositions.length; i++) {
            vPositions.push(this.tvBasePositions[i]);
            vColors.push(this.tvBaseColors[i]);
            // vTexCoords.push(this.texture[i]);
            this.numPositions++;

            let t = parseFloat(this.texID).toFixed(1);
            vTexIDs.push(t);
        }

        this.drawScreens(screenType);
        
    }

    this.drawScreens = function(screenType) {
        if (screenType == "black") {
            console.log("black");
            for (var i = 0; i < this.blackScreenPositions.length; i++) {
                vPositions.push(this.blackScreenPositions[i]);
                vColors.push(this.blackScreenColors[i]);
                this.numPositions++;

                let t = parseFloat(this.texID).toFixed(1);
                vTexIDs.push(t);
            }
        }
        else if (screenType == "s1") {
            for (var i = 0; i < this.screen1Positions.length; i++) {
                vPositions.push(this.screen1Positions[i]);
                vColors.push(this.screen1Colors[i]);
                this.numPositions++;

                let t = parseFloat(this.texID).toFixed(1);
                vTexIDs.push(t);
            }
        }
        else if (screenType == "s2") {
            for (var i = 0; i < this.screen2Positions.length; i++) {
                vPositions.push(this.screen2Positions[i]);
                vColors.push(this.screen2Colors[i]);
                this.numPositions++;

                let t = parseFloat(this.texID).toFixed(1);
                vTexIDs.push(t);
            }
        }
        else if (screenType == "s3") {
            for (var i = 0; i < this.screen3Positions.length; i++) {
                vPositions.push(this.screen3Positions[i]);
                vColors.push(this.screen3Colors[i]);
                this.numPositions++;

                let t = parseFloat(this.texID).toFixed(1);
                vTexIDs.push(t);
            }
        }
    }
}

var sXMax = tvXMax - screenBorder;
var sXMin = tvXMin + screenBorder;
var sYMax = tvYMax - screenBorder;
var sYMin =  tvYMin + vcrSize + screenBorder;
var sZMax = tvZMax + 0.1;

var squareXMax = 1;
var squareXMin = -1;
// var squareXMin = sXMin + 1.1;
// console.log("squareXMin: " + squareXMin);
var squareYMax = 1;
// var squareYMax = sYMax;
// console.log("squareYMax: " + squareYMax);
var squareYMin = -1;
// var squareYMin = sYMin;
// console.log("squareYMin: " + squareYMin);

var xMax = 1;
var xMin = -1;
var yMax = 1;
var yMin = -1;
// var zMin = ;

var generalVerticesSquare = [
    vec4(xMin, yMin, sZMax, 1.0), // 
    vec4(xMin, yMax, sZMax, 1.0), // 
    vec4(xMax, yMax, sZMax, 1.0), // 

    vec4(xMin, yMin, sZMax, 1.0), // 
    vec4(xMax, yMax, sZMax, 1.0), // 
    vec4(xMax, yMin, sZMax, 1.0), // 
];

var generalVerticesTriangle = [
    vec4(xMin, yMin, sZMax, 1.0), // 0
    vec4(xMax, yMin, sZMax, 1.0), // 1
    vec4((xMin + xMax) / 2, yMax, sZMax, 1.0), //
];

var squareColor = vec4(0.0, 0.0, 0.0, 1.0);// 0.4, 0.451, 1.0, 1.0);
var triangleColor = vec4(0.824, 0.706, 0.549, 1.0);// vec4(0.855, 0.753, 1.0, 1.0);



function LavaAndGround() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = [];
    this.colors = [];
    

    this.lavaAndGroundVertices = [
        vec4( sXMin, sYMin, sZMax, 1.0), // 0
        vec4( sXMin, sYMax, sZMax, 1.0), // 1
        vec4( sXMax, sYMax, sZMax, 1.0), // 2
        vec4( sXMax, sYMin, sZMax, 1.0), // 3
    
        vec4( sXMin, (sYMin + sYMax) / 2, sZMax, 1.0), // 4
        vec4( sXMax, (sYMin + sYMax) / 2, sZMax, 1.0), // 5

        vec4((sXMin - sXMin) - 1.0, (sYMin + sYMax) / 2, sZMax, 1.0), // 6
        vec4(sXMin - sXMin, sYMin, sZMax, 1.0), // 7

        vec4((sXMin - sXMin) - 0.2, (sYMin + sYMax) / 2, sZMax, 1.0), // 8
        vec4((sXMin - sXMin), sYMin, sZMax, 1.0), // 9
        vec4(sXMin - (sXMin / 2), sYMin, sZMax, 1.0), // 10
    ];

    // this.lavaColor = vec4(0.612, 0.878, 1.0, 1.0);
    this.lavaColorLight = vec4(0.918, 0.361, 0.059, 1.0);
    this.lavaColorDark = vec4(0.788, 0.173, 0.0, 1.0);
    // this.groundColor = vec4(0.71, 1, 0.51, 1.0);
    this.groundColor = vec4(0.141, 0.078, 0.031, 1.0);//0.11, 0.11, 0.11, 1.0);
    
    this.lavaIndexes1 = [
        [0, 4, 5],
        // [4, 1, 5],
        [1, 4, 5],
        [1, 2, 5],
    ];

    this.lavaColors = [
        this.lavaColorDark,
        this.lavaColorLight,
        this.lavaColorLight,
        this.lavaColorLight,
        this.lavaColorDark,
        this.lavaColorDark,
        this.lavaColorDark,
        this.lavaColorDark,
        this.lavaColorDark,
        this.lavaColorDark,
        this.lavaColorDark,
    ];

    this.lavaIndexes2 = [
        [8, 0, 9],
        [8, 4, 0],
        [4, 1, 2],
        [4, 2, 5],
    ];

    this.groundIndexes1 = [
        [0, 6, 7],
        [7, 6, 5],
        [7, 5, 3],
    ];

    this.groundIndexes2 = [
        [10, 8, 9],
        [9, 8, 5],
        [9, 5, 3],
    ];
    
    

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    this.getNumPositions = function() {
        return this.numPositions;
    }

    this.getPositions = function() {
        return this.positions;
    }

    this.getColors = function() {
        return this.colors;
    }

    this.init = function(groundP) {
        // GROUND
        if (groundP) {
            for (var i = 0; i < this.groundIndexes1.length; i++) {
                for (var j = 0; j < this.groundIndexes1[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.groundIndexes1[i][j]]);
                    this.colors.push(this.groundColor);
                }
            }


            // LAVA
            for (var i = 0; i < this.lavaIndexes1.length; i++) {
                for (var j = 0; j < this.lavaIndexes1[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.lavaIndexes1[i][j]]);
                    this.colors.push(this.lavaColors[this.lavaIndexes1[i][j]]);
                    
                    
                }
            }
            
        }
        else {
            for (var i = 0; i < this.groundIndexes2.length; i++) {
                for (var j = 0; j < this.groundIndexes2[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.groundIndexes2[i][j]]);
                    this.colors.push(this.groundColor);
                }
            }

            // LAVA
            for (var i = 0; i < this.lavaIndexes2.length; i++) {
                for (var j = 0; j < this.lavaIndexes2[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.lavaIndexes2[i][j]]);
                    this.colors.push(this.lavaColors[this.lavaIndexes2[i][j]]);
                }
            }
            
        }

        // var t = translate(-6.0, 10.0, 0.1);
        // var r = rotate(-5, 0, 0, 1);
        // var c = vec4(0.788, 0.173, 0.0, 1.0);
        // this.lava(t, r, c);
    }

    this.lava = function(t, r, color) {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // var t = translate(0.8, -4.7, 0.0);
            var s = scale(0.26, 0.2, 1.0);
            // var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(color);
        }
    }
}

function Lightsaber(bladeColor) {
    this.lightsaberHandleColor = vec4(0.769,0.769,0.769, 1.0);
    this.bladeColor = bladeColor;
    this.positions = [];
    this.colors = [];

    this.p = [];

    this.getPositions = function() {
        return this.positions;
    }

    this.getColors = function() {
        // console.log(this.colors);
        return this.colors;
    }

    this.init = function() {
        // for (var i = 0; i < generalVerticesTriangle.length; i++) {
        //     var t = translate(0, 10.0, 0.1);
        //     var s = scale(0.2, 0.2, 1);
        //     var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
        //     var m = determineTransformationMatrix(r, s, t);
        //     var temp = mult(m, generalVerticesTriangle[i]);
        //     this.p.push(temp);
        //     this.colors.push(this.lightsaberHandleColor);

        // }

        for (var i = 0; i < generalVerticesSquare.length; i++) {
            var t = translate(0, 2.0, 0.02);
            var s = scale(0.2, 0.6, 1);
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            var temp = mult(m, generalVerticesSquare[i]);
            this.p.push(temp);
            this.colors.push(this.bladeColor );
        }

        for (var i = 0; i < generalVerticesSquare.length; i++) {
            var t = translate(0, 0.7, 0.1);
            var s = scale(0.2, 0.4, 1);
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            var temp = mult(m, generalVerticesSquare[i]);
            this.p.push(temp);
            this.colors.push(this.lightsaberHandleColor);
        }

        // for (var i = 0; i < generalVerticesSquare.length; i++) {
        //     var t = translate(0, 2.0, 0.1);
        //     var s = scale(0.2, 0.2, 1);
        //     var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
        //     var m = determineTransformationMatrix(r, s, t);
        //     var temp = mult(m, generalVerticesSquare[i]);
        //     this.p.push(temp);
        //     this.colors.push(this.lightsaberHandleColor);
        // }
    }

    this.drawSword = function(t, r) {
        // console.log(t)
        for (var i = 0; i < this.p.length; i++) {
            // console.log(r)
            var s = scale(0.5, 0.5, 1); // scaling matrix -> increase in size by half
            var m = determineTransformationMatrix(r, s, t);

            var temp = mult(m, this.p[i]);
            this.positions.push(temp);
        }
    }
}

function determineTransformationMatrix(r, s, t) {
    // SET UP VARIABLES
    var m = mat4(); // identity matrix that will be the translation matrix

    // DETERMINE TRANSFORMATION MATRIX
    m = mult(m, r); 
    m = mult(m, s);
    m = mult(m, t);

    return m; // return calculated matrix
} 

function drawSquare(positions, colors, diffTranslation, rotateS, burning) {
    var t = translate(-2.5, 2.0, 0.1); // translation matrix -> 
    var r = rotate(0, 0, 0, 1); // rotation matrix -> 
    var s = scale(0.5, 0.5, 1); // scaling matrix -> 

    if (diffTranslation != false ) {
        t = diffTranslation;
    } 

    if (rotateS) {
        r = rotate(-10, 0, 0, 1);
    }

    var burn = [
        vec4(0.788, 0.173, 0.0, 1.0),
        squareColor,
        squareColor,
        vec4(0.788, 0.173, 0.0, 1.0),
        squareColor,
        squareColor,
    ]

    var m = determineTransformationMatrix(r, s, t);

    for (var j = 0; j < generalVerticesSquare.length; j++) {
        var temp = mult(m, generalVerticesSquare[j]);
        positions.push(temp);
        if (burning) {
            colors.push(burn[j]);
        }
        else {
            colors.push(squareColor);
        }
        
    }
}



function drawTriangle(positions, colors, diffTranslation) {
    var t = translate(1.2, 2.0, 0.1);
    var r = rotate(0, 0, 1, 0);
    var s = scale(0.5, 0.5, 1);

    if (diffTranslation != false ) {
        t = diffTranslation;
    }
    var m = determineTransformationMatrix(r, s, t);

    for (var i = 0; i < generalVerticesTriangle.length; i++) {
        var temp = mult(m, generalVerticesTriangle[i]);
        positions.push(temp);
        colors.push(triangleColor);
    }
}


// var squareBladeColor = vec4(0.91, 1.0, 0.576, 1.0);
// var triangleBladeColor = vec4(1.0, 0.824, 0.949, 1.0);

var squareBladeColor = vec4(1.0, 0.0, 0.0, 1.0);
var triangleBladeColor = vec4(0.0, 0.0, 1.0, 1.0);

function Screen1() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = [];
    this.colors = [];
    this.sg = new LavaAndGround();
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    // this.getNumPositions = function() {
    //     return this.numPositions;
    // }

    this.getPositions = function() {
        // console.log("s1 positions");
        // console.log(this.positions)
        return this.positions;
    }

    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        this.sg.init(true);
        var sgPositions = this.sg.getPositions();
        var sgColors = this.sg.getColors();

        for (var j = 0; j < sgPositions.length; j++) {
            this.positions.push(sgPositions[j]);
            this.colors.push(sgColors[j]);
        }

        drawSquare(this.positions, this.colors, translate(-0.5, 2.0, 0.1), false, false);
        
        // this.drawSword();
        var anakinSaber = new Lightsaber(squareBladeColor);
        anakinSaber.init();

        var saberTranslate = translate(0.0, 2.0, 0.1);
        var saberRotate = rotate(10, 0, 0, 1);

        anakinSaber.drawSword(saberTranslate, saberRotate);
        var lightsaberHandleColor = anakinSaber.getColors();
        var swordPosition = anakinSaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberHandleColor[i]);
        }

        var swordTriangle = new Lightsaber(triangleBladeColor);
        swordTriangle.init();

        saberTranslate = translate(2.5, 1.5, 0.1);
        saberRotate = rotate(-10, 0, 0, 1);

        swordTriangle.drawSword(saberTranslate, saberRotate);
        lightsaberHandleColor = swordTriangle.getColors();
        swordPosition = swordTriangle.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberHandleColor[i]);
        }

        // triangle
        drawTriangle(this.positions, this.colors, translate(2.5, 2.0, 0.1));

    }


    determineTransformationMatrix = function(r, s, t) {
        // SET UP VARIABLES
        var m = mat4(); // identity matrix that will be the translation matrix

        // DETERMINE TRANSFORMATION MATRIX
        m = mult(m, r); 
        m = mult(m, s);
        m = mult(m, t);

        return m; // return calculated matrix
    }
}

function Screen2() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = [];
    this.colors = [];
    this.sg = new LavaAndGround();
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    // this.getNumPositions = function() {
    //     return this.numPositions;
    // }

    this.getPositions = function() {
        // console.log("s1 positions");
        // console.log(this.positions)
        return this.positions;
    }

    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        this.sg.init(true);
        var sgPositions = this.sg.getPositions();
        var sgColors = this.sg.getColors();
        
        for (var j = 0; j < sgPositions.length; j++) {
            this.positions.push(sgPositions[j]);
            this.colors.push(sgColors[j]);
        }

        drawSquare(this.positions, this.colors, translate(-1.5, 2.0, 0.1), false, false);
        
        // this.drawSword();
        var anakinSaber = new Lightsaber(squareBladeColor);
        anakinSaber.init();

        var saberTranslate = translate(-2.0, 1.0, 0.1);
        var saberRotate = rotate(40, 0, 0, 1);

        anakinSaber.drawSword(saberTranslate, saberRotate);
        var lightsaberHandleColor = anakinSaber.getColors();
        var swordPosition = anakinSaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberHandleColor[i]);
        }

        var swordTriangle = new Lightsaber(triangleBladeColor);
        swordTriangle.init();

        saberTranslate = translate(1.5, 1.2, 0.1);
        saberRotate = rotate(-25, 0, 0, 1);

        swordTriangle.drawSword(saberTranslate, saberRotate);
        lightsaberHandleColor = swordTriangle.getColors();
        swordPosition = swordTriangle.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberHandleColor[i]);
        }

        // triangle
        drawTriangle(this.positions, this.colors, false);

    }


    determineTransformationMatrix = function(r, s, t) {
        // SET UP VARIABLES
        var m = mat4(); // identity matrix that will be the translation matrix

        // DETERMINE TRANSFORMATION MATRIX
        m = mult(m, r); 
        m = mult(m, s);
        m = mult(m, t);

        return m; // return calculated matrix
    }
}

function Screen3() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = [];
    this.colors = [];
    this.sg = new LavaAndGround();
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET THE NUMBER OF POSITIONS IN THE BUFFER THE SHAPE HAS
    // this.getNumPositions = function() {
    //     return this.numPositions;
    // }

    this.getPositions = function() {
        // console.log("s1 positions");
        // console.log(this.positions)
        return this.positions;
    }

    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        this.sg.init(false);
        var sgPositions = this.sg.getPositions();
        var sgColors = this.sg.getColors();

        for (var j = 0; j < sgPositions.length; j++) {
            this.positions.push(sgPositions[j]);
            this.colors.push(sgColors[j]);
        }

        drawSquare(this.positions, this.colors, false, true, true);
        
        // this.drawSword();
        var lightsaber = new Lightsaber(squareBladeColor);
        lightsaber.init();

        var saberTranslate = translate(-2.0, 1.5, 0.1);
        var saberRotate = rotate(10, 0, 0, 1);

        lightsaber.drawSword(saberTranslate, saberRotate);
        var lightsaberHandleColor = lightsaber.getColors();
        var swordPosition = lightsaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberHandleColor[i]);
        }

        var swordTriangle = new Lightsaber(triangleBladeColor);
        swordTriangle.init();

        saberTranslate = translate(1.5, 1.2, 0.1);
        saberRotate = rotate(-25, 0, 0, 1);

        swordTriangle.drawSword(saberTranslate, saberRotate);
        lightsaberHandleColor = swordTriangle.getColors();
        swordPosition = swordTriangle.getPositions();

        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberHandleColor[i]);
        }

        // triangle
        drawTriangle(this.positions, this.colors, false);

    }


    determineTransformationMatrix = function(r, s, t) {
        // SET UP VARIABLES
        var m = mat4(); // identity matrix that will be the translation matrix

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

    // SET UP CANVAS
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);


    
    // GET NUMBER OF POSITIONS
    // numPositions = numPositions + floor.getNumPositions();
    // numPositions = numPositions + wall.getNumPositions();
    w = new Walls();
    w.init();
    w.drawWalls();
    numPositions = numPositions + w.getNumPositions();

    f = new Floor();
    f.init();
    f.drawFloor();
    numPositions = numPositions + f.getNumPositions();

    t = new Table();
    t.init();
    t.drawTable();
    numPositions = numPositions + t.getNumPositions();

    tv = new TV();
    tv.init();
    tv.drawTV(screenOptions[screenIndex]);
    // tv.drawTV("black");
    // tv.drawTV("s1");
    numPositions = numPositions + tv.getNumPositions();

    ///////////////////////////////////
    /*      BUTTONS & SELECTS        */
    ///////////////////////////////////

    document.getElementById("power-on").onclick = function() {
        powerOn = true;
        // screenIndex++;
        screenIndex = 1; //FIXME: MAKE IT RETURN TO LAST PLACE?
        console.log("on " + screenIndex);

        reDrawScreen();
        render()
    }
    document.getElementById("power-off").onclick = function() {
        powerOn = false;
        screenIndex = 0;
        //FIXME: ADD TO WAY TO HOLD PREVIOUS INDEX
        reDrawScreen();
        render();
    }
    document.getElementById("pause").onclick = function() {
        // if (powerOn) {
        //     play = false;
        // }
        play = false;
        render();
    }
    document.getElementById("play").onclick = function() {
        // if (powerOn) {
        //     play = true;
        // }
        play = true;
        render();
    }
    document.getElementById("prev").onclick = function() {
        if (powerOn) {
            screenIndex = (screenIndex - 1 < 1) ? 3 : screenIndex - 1;
            reDrawScreen();
            render()
        }
    }
    document.getElementById("next").onclick = function() {
        if (powerOn) {
            screenIndex = screenIndex % 3 + 1; 
            reDrawScreen();
            render()
        }
    }

    // CAMERA POSITION
    document.getElementById("viewer_pos").onchange = function() {
        //UPDATE CAMERA POSITION BASED ON SELECT CHANGE
        if (document.getElementById("viewer_pos").value == "AtScreen") {
            eye = eyePositions[0];
            eyeIndex = 0;
        }
        else if (document.getElementById("viewer_pos").value == "AtRightWall") {
            eye = eyePositions[1];
            eyeIndex = 1;
        }
        else if (document.getElementById("viewer_pos").value == "AtScreenHigher") {
            eye = eyePositions[2];
            eyeIndex = 2;
        }
        else if (document.getElementById("viewer_pos").value == "AtLeftWall") {
            eye = eyePositions[3];
            eyeIndex = 3;
        }
        else if (document.getElementById("viewer_pos").value == "Underside") {
            eye = eyePositions[4];
            eyeIndex = 4;
        }

        // RERENDER CANVAS
        render();
    }

    ///////////////////////////////////
    // console.log("vPositions:", vPositions);

    

    // SET UP PROGRAM
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ///////////////////////////////////
    /*    SET UP SHADER VARIABLES    */
    ///////////////////////////////////

    
    // CREATE & BIND VERTEX BUFFER
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vPositions), gl.STATIC_DRAW);

    // SET POSITION ATTRIBUTE VARIABLE
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vTexCoords), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    tIDBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tIDBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTexIDs), gl.STATIC_DRAW);

    var textIDLoc = gl.getAttribLocation(program, "aTexID");
    gl.vertexAttribPointer(textIDLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textIDLoc);
    

    // GET UNIFORM VARIABLE LOCATIONS
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    

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

var animationDelay = 500;
// RENDER FUNCTION
var render = function() {
    console.log("Render function called");

    // CLEAR BITS
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // CALCULATE MATRIXES
    modelViewMatrix = lookAt(eye, at , up);
    // console.log(modelViewMatrix)
    projectionMatrix = ortho(theLeft, theRight, theBottom, theTop, near, far);

    ///////////////////////////////////
    /*      SET SHADER VARIABLES     */
    ///////////////////////////////////

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) ); // set modelViewMatrix
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix)); // set projectionMatrix

    if (powerOn && play) {
        console.log("play")
        screenIndex = screenIndex % 3 + 1; 
        
        reDrawScreen();
        gl.drawArrays( gl.TRIANGLES, 0, numPositions);
        setTimeout(() => {
            requestAnimationFrame(render);
        }, animationDelay);
        // requestAnimationFrame(render);
        // play = false;

    }
    else {
        gl.drawArrays( gl.TRIANGLES, 0, numPositions);
    }

    // gl.drawElements(gl.TRIANGLES, 0, numWallPositions);

    // DRAW FLOOR AND WALLS
    // gl.drawArrays( gl.TRIANGLES, 0, numPositions);
    // requestAnimationFrame(render);



}