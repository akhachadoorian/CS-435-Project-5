/*
    CS 435
    Project 5
    Alex Khachadoorian
    This project outputs a room that consists of 3 brick walls and a carpeted floor and within the room is a wood table with a tv on it.
    There is a menu on the right to turn the tv on and off, pause and play the show, and move the show onto the next or previous frame.
    There is also a menu to change the viewer position to see different aspects of the room better.
*/

"use strict"

///////////////////////////////////
/*       GLOBAL VARIABLES        */
///////////////////////////////////

var canvas; 
var gl;
var numPositions = 0; 
var program;
var animationDelay = 500;

///////////////////////////////////

// BUFFER VARIABLES
var vPositions = []; // holds all the vertex positions
var vColors = []; // holds all the vertex colors
var vTexCoords = []; // holds all the vertex texture coordinates
var vTexIDs = []; // holds all the vertex texture IDs
var vBuffer, cBuffer, tBuffer, tIDBuffer;  // all the buffers

///////////////////////////////////

// PERSPECTIVE VARIABLES
var near = -20; // near plane is 10 units behind the camera
var far = 20; // far plane is 10 units in front of the camera
var theLeft = -5.0; // left is 3 units left of the origin
var theRight = 5.0; // right is 3 units right of the origin
var theTop = 5.0; // top is 3 units above of the origin
var theBottom = -5.0; // bottom is 3 units below the origin
///////////////////////////////////

// VIEW VARIABLES
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc; // view variable locations in shaders
var modelViewMatrix; //  holds the model view matrix
var projectionMatrix; // holds the projection matrix

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

var eye = eyePositions[0]; // holds the camera position for rendering 
var at = vec3(0.0, 0.0, 0.0); // holds camera aim -> at origin
var up = vec3(0.0, 1.0, 0.0); // holds up vector -> positive y direction

///////////////////////////////////

// TEXTURE VARIABLE
var texture; 

var texCoord = [ // holds vertex positions for texture
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

///////////////////////////////////

// TV VARIABLES
var screenOptions = [ // holds different frames
    "black",
    "starting duel",
    "sabers hitting",
    "anakin in lava",
];

var screenIndex = 0; // which state screen is in
var powerOn = false; // holds whether the tv is on or off
var play = false; // holds whether the tv show is playing

var wall, floor, table, tv; // holds the corresponding object's variables

///////////////////////////////////

// GENERAL SHAPE VARIABLES
var xMax = 1; // x max
var xMin = -1; // x min
var yMax = 1; // y max
var yMin = -1; // y min
var zValue = 0.6; // z value

var generalVerticesSquare = [ // vertices for a square
    vec4(xMin, yMin, zValue, 1.0), // bottom left
    vec4(xMin, yMax, zValue, 1.0), // top left
    vec4(xMax, yMax, zValue, 1.0), // top right

    vec4(xMin, yMin, zValue, 1.0), // bottom left
    vec4(xMax, yMax, zValue, 1.0), // top right
    vec4(xMax, yMin, zValue, 1.0), // bottom right
];

var generalVerticesTriangle = [ // vertices for a triangle
    vec4(xMin, yMin, zValue, 1.0), // bottom left
    vec4(xMax, yMin, zValue, 1.0), // bottom right
    vec4((xMin + xMax) / 2, yMax, zValue, 1.0), // top point
];

///////////////////////////////////

// COLOR VARIABLES
var squareColor = vec4(0.0, 0.0, 0.0, 1.0);
var triangleColor = vec4(0.824, 0.706, 0.549, 1.0);

var squareBladeColor = vec4(1.0, 0.0, 0.0, 1.0);
var triangleBladeColor = vec4(0.0, 0.0, 1.0, 1.0);

///////////////////////////////////

///////////////////////////////////
/*       GLOBAL FUNCTIONS        */
///////////////////////////////////

// FUNCTION TO CONFIGURE TEXTURE
// image -> texture image
// uniformVarName -> name of the corresponding uniform variable
// textureUnit -> active texture unit name
// uniformLoc -> location of texture uniform variable
function configureTexture( image, uniformVarName, textureUnit, uniformLoc ) {
    // CREATE TEXTURE
    texture = gl.createTexture();

    gl.activeTexture(textureUnit); 
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // SEND TO UNIFORM VARIABLE
    gl.uniform1i(gl.getUniformLocation(program, uniformVarName), uniformLoc);
}

// FUNCTION TO REDRAW TV SCREEN
function reDrawScreen() {
    // RESET BUFFER VARIABLES
    numPositions = 0;
    vPositions = [];
    vColors = [];
    vTexCoords = [];
    vTexIDs = [];

    // REDRAW OBJECTS
    wall.drawWalls();
    floor.drawFloor();
    table.drawTable();
    tv.drawTV(screenOptions[screenIndex]);

    // GET NEW NUMBER OF POSITIONS
    numPositions = numPositions + wall.getNumPositions();
    numPositions = numPositions + floor.getNumPositions();
    numPositions = numPositions + table.getNumPositions();
    numPositions = numPositions + tv.getNumPositions();

    // REBIND VERTEX BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vPositions), gl.STATIC_DRAW);

    // REBIND COLOR BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors), gl.STATIC_DRAW );

    // REBIND TEXTURE COORDINATE BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vTexCoords), gl.STATIC_DRAW);

    // REBIND TEXTURE ID BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, tIDBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTexIDs), gl.STATIC_DRAW);
}

// FUNCTION TO DETERMINE THE TRANSFORMATION MATRIX
// rotation -> rotation matrix
// scale -> scaling matrix
// translation -> translation matrix
function determineTransformationMatrix(rotation, scaling, translation) {
    // SET UP VARIABLES
    var m = mat4(); // identity matrix that will be the translation matrix

    // DETERMINE TRANSFORMATION MATRIX
    m = mult(m, rotation); 
    m = mult(m, scaling);
    m = mult(m, translation);

    return m; // return calculated matrix
} 

// FUNCTION TO DRAW SQUARAKIN
// positions -> holds corresponding position array
// colors -> holds corresponding color array
// diffTranslation -> holds different translation matrix
// rotateSquare -> whether or not to rotate square
// burning -> whether or not the square is burning
function drawSquare(positions, colors, diffTranslation, rotateSquare, burning) {
    // SETUP TRANSLATION VARIABLES
    var t = translate(-2.5, 2.0, 0.1); // translation matrix -> more left and up
    var r = rotate(0, 0, 0, 1); // rotation matrix -> nothing
    var s = scale(0.5, 0.5, 1); // scaling matrix -> shrink by half

    if (diffTranslation != false ) { // if different translation matrix is entered
        t = diffTranslation;
    } 

    if (rotateSquare) { // if rotating true
        r = rotate(-10, 0, 0, 1);
    }

    // GET TRANSLATION MATRIX
    var m = determineTransformationMatrix(r, s, t);

    // SETUP BURN VERTEX COLORS
    var burn = [ // holds vertex colors if burning
        vec4(0.788, 0.173, 0.0, 1.0),
        squareColor,
        squareColor,
        vec4(0.788, 0.173, 0.0, 1.0),
        squareColor,
        squareColor,
    ]

    // FILL PARAMETER ARRAYS
    for (var j = 0; j < generalVerticesSquare.length; j++) {
        var temp = mult(m, generalVerticesSquare[j]);
        positions.push(temp);

        // PUSH CORRECT COLOR
        if (burning) {
            colors.push(burn[j]);
        }
        else {
            colors.push(squareColor);
        }
    }
}

// FUNCTION TO DRAW TRIANGOBI
// positions -> holds corresponding position array
// colors -> holds corresponding color array
// diffTranslation -> holds different translation matrix
function drawTriangle(positions, colors, diffTranslation) {
    // SETUP TRANSLATION VARIABLES
    var t = translate(1.2, 2.0, 0.1); // translation matrix -> move right and up
    var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
    var s = scale(0.5, 0.5, 1); // scaling matrix -> shrink by half

    if (diffTranslation != false ) { // if different translation matrix is entered
        t = diffTranslation;
    }

    // DETERMINE TRANSFORMATION MATRIX
    var m = determineTransformationMatrix(r, s, t);

    // FILL PARAMETER ARRAYS
    for (var i = 0; i < generalVerticesTriangle.length; i++) {
        var temp = mult(m, generalVerticesTriangle[i]);
        positions.push(temp);
        colors.push(triangleColor);
    }
}

///////////////////////////////////
/*           CLASSES             */
///////////////////////////////////

// CLASS TO DRAW BRICK WALLS
function Walls() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(0.0, 0.0, 0.0, 0.0); // holds wall color
    this.texture = []; // temporary array to hold the texture coordinates
    this.texID = 0.0; // texture id to tell fragment shader to use brick texture
    this.texIndexes = [0, 1, 2, 0, 2, 3]; // texture coordinate indexes

    // VERTEX MAXES AND MINS
    this.wXMax = 4.0;
    this.wXMin = -4.0;
    this.wYMax = 4.0;
    this.wYMin = -4.0;
    this.wZMax = 4.0;
    this.wZMin = -4.0;

    this.diff = 0.2; // difference between inner and outer wall

    this.vertexesWall = [
        // OUTER WALL
        vec4(this.wXMin, this.wYMin, this.wZMin, 1.0), // 0
        vec4(this.wXMin, this.wYMax, this.wZMin, 1.0), // 1
        vec4(this.wXMax, this.wYMax, this.wZMin, 1.0), // 2
        vec4(this.wXMax, this.wYMin, this.wZMin, 1.0), // 3
        vec4(this.wXMax, this.wYMin, this.wZMax, 1.0), // 4
        vec4(this.wXMax, this.wYMax, this.wZMax, 1.0), // 5
        vec4(this.wXMin, this.wYMax, this.wZMax, 1.0), // 6
        vec4(this.wXMin, this.wYMin, this.wZMax, 1.0), // 7
    
        // INNER WALL
        vec4(this.wXMin + this.diff, this.wYMin, this.wZMin + this.diff, 1.0), // 8
        vec4(this.wXMin + this.diff, this.wYMax, this.wZMin + this.diff, 1.0), // 9
        vec4(this.wXMax - this.diff, this.wYMax, this.wZMin + this.diff, 1.0), // 10
        vec4(this.wXMax - this.diff, this.wYMin, this.wZMin + this.diff, 1.0), // 11
        vec4(this.wXMax - this.diff, this.wYMin, this.wZMax, 1.0), // 12
        vec4(this.wXMax - this.diff, this.wYMax, this.wZMax, 1.0), // 13
        vec4(this.wXMin + this.diff, this.wYMax, this.wZMax, 1.0), // 14
        vec4(this.wXMin + this.diff, this.wYMin, this.wZMax, 1.0), // 15
    ]

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
        return this.numPositions;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
        for (var i = 0; i < this.indexes.length; i++) {
            for (var j = 0; j < this.indexes[i].length; j++) {
                this.positions.push(this.vertexesWall[this.indexes[i][j]]);
                this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }
    }

    // DRAW WALLS
    this.drawWalls = function() {
        // COPY POSITIONS, COLORS, TEXTURE COORDINATES, AND TEXTURE IDs TO BUFFER ARRAYS
        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);

            this.numPositions++; // increment number of positions to match the position being added

            // PUSH TEXTURE ID
            let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
            vTexIDs.push(t);
        }
    }
}

// CLASS TO DRAW CARPET FLOOR
function Floor() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(0.0, 0.0, 0.0, 0.0); // holds floor color
    this.texture = []; // temporary array to hold the texture coordinates
    this.texID = 1.0; // texture id to tell fragment shader to use carpet texture
    this.texCIndex = [0, 2, 3, 0, 1, 2]; // texture coordinate indexes

    // VERTEX MAXES AND MINS
    this.fXMax = 4.0;
    this.fXMin = -4.0;
    this.fYMax = 4.0;
    this.fYMin = -4.0;
    this.fZMax = 4.0;
    this.fZMin = -4.0;

    this.diff = 0.2; // difference between upper and lower floor

    this.vertexesFloor = [
        // UPPER FLOOR
        vec4(this.fXMin, this.fYMin, this.fZMin, 1.0), // 0
        vec4(this.fXMax, this.fYMin, this.fZMin, 1.0), // 1
        vec4(this.fXMax, this.fYMin, this.fZMax, 1.0), // 2
        vec4(this.fXMin, this.fYMin, this.fZMax, 1.0), // 3

        // LOWER FLOOR
        vec4(this.fXMin, this.fYMin - this.diff, this.fZMin, 1.0), // 4
        vec4(this.fXMax, this.fYMin - this.diff, this.fZMin, 1.0), // 5 
        vec4(this.fXMax, this.fYMin - this.diff, this.fZMax, 1.0), // 6
        vec4(this.fXMin, this.fYMin - this.diff, this.fZMax, 1.0), // 7
    ]

    this.indexes = [
        // FLOORS
        [3, 1, 2, 3, 0, 1], // upper floor
        [7, 5, 6, 7, 4, 5], // lower floor

        // CONNECTIONS
        [7, 2, 6, 7, 3, 2], // front
        [6, 1, 5, 6, 2, 1], // right
        [5, 0, 3, 5, 1, 0], // back
        [4, 3, 7, 4, 0, 3], // left
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
        // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
        for (var i = 0; i < this.indexes.length; i++) {
            for (var j = 0; j < this.indexes[i].length; j++) {
                this.positions.push(this.vertexesFloor[this.indexes[i][j]]);
                this.texture.push(texCoord[this.texCIndex[j]]);
            }
        }
    }

    // DRAW FLOOR
    this.drawFloor = function() {
        // COPY POSITIONS, COLORS, TEXTURE COORDINATES, AND TEXTURE IDs TO BUFFER ARRAYS
        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);

            this.numPositions++; // increment number of positions to match the position being added

            // PUSH TEXTURE ID
            let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
            vTexIDs.push(t);
        }
    }
}

// CLASS TO DRAW WOOD TABLE
function Table() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.color = vec4(0.0, 0.0, 0.0, 1.0); // holds table color
    this.texture = []; // temporary array to hold the texture coordinates
    this.texID = 2.0; // texture id to tell fragment shader to use wood texture
    this.texIndexes = [0, 1, 2, 0, 2, 3];

    // VERTEX MAXES AND MINS
    this.tXMax = 3.0;
    this.tXMin = -3.0;
    this.tYMax = -1.0;
    this.tYMin = -4.0;
    this.tZMin = -3.0;
    this.tZMax = 1.0;

    this.tableWidth = 0.5; 
    this.legWidth = 0.5;

    this.vertexesTable = [
        // TOP OF TABLE
        vec4(this.tXMin, this.tYMax, this.tZMax, 1.0), // 0
        vec4(this.tXMin, this.tYMax, this.tZMin, 1.0), // 1
        vec4(this.tXMax, this.tYMax, this.tZMin, 1.0), // 2
        vec4(this.tXMax, this.tYMax, this.tZMax, 1.0), // 3
    
        // BOTTOM OF TABLE 
        vec4(this.tXMin, this.tYMax - this.tableWidth, this.tZMax, 1.0), // 4
        vec4(this.tXMin, this.tYMax - this.tableWidth, this.tZMin, 1.0), // 5
        vec4(this.tXMax, this.tYMax - this.tableWidth, this.tZMin, 1.0), // 6
        vec4(this.tXMax, this.tYMax - this.tableWidth, this.tZMax, 1.0), // 7
    
        // BACK RIGHT LEG
        vec4(this.tXMax - this.legWidth, this.tYMax - this.tableWidth, this.tZMin, 1.0), // 8
        vec4(this.tXMax - this.legWidth, this.tYMax - this.tableWidth, this.tZMin + this.legWidth, 1.0), // 9
        vec4(this.tXMax, this.tYMax - this.tableWidth, this.tZMin + this.legWidth, 1.0), // 10
    
        vec4(this.tXMax, this.tYMin, this.tZMin, 1.0),  // 11
        vec4(this.tXMax - this.legWidth, this.tYMin, this.tZMin, 1.0), // 12
        vec4(this.tXMax - this.legWidth, this.tYMin, this.tZMin + this.legWidth, 1.0), // 13
        vec4(this.tXMax, this.tYMin, this.tZMin + this.legWidth, 1.0), // 14
    
        // BACK LEFT LEG
        vec4(this.tXMin + this.legWidth, this.tYMax - this.tableWidth, this.tZMin, 1.0), // 15
        vec4(this.tXMin + this.legWidth, this.tYMax - this.tableWidth, this.tZMin + this.legWidth, 1.0), // 16
        vec4(this.tXMin, this.tYMax - this.tableWidth, this.tZMin + this.legWidth, 1.0), // 17
    
        vec4(this.tXMin + this.legWidth, this.tYMin, this.tZMin, 1.0), // 18
        vec4(this.tXMin + this.legWidth, this.tYMin, this.tZMin + this.legWidth, 1.0), // 19
        vec4(this.tXMin, this.tYMin, this.tZMin + this.legWidth, 1.0), // 20
        vec4(this.tXMin, this.tYMin, this.tZMin, 1.0), // 21
    
        // FRONT LEFT LEG
        vec4(this.tXMin, this.tYMax - this.tableWidth, this.tZMax - this.legWidth, 1.0), // 22
        vec4(this.tXMin + this.legWidth, this.tYMax - this.tableWidth, this.tZMax - this.legWidth, 1.0), // 23
        vec4(this.tXMin + this.legWidth, this.tYMax - this.tableWidth, this.tZMax, 1.0), // 24
    
        vec4(this.tXMin, this.tYMin, this.tZMax, 1.0), // 25
        vec4(this.tXMin, this.tYMin, this.tZMax - this.legWidth, 1.0), // 26
        vec4(this.tXMin + this.legWidth, this.tYMin, this.tZMax - this.legWidth, 1.0), // 27
        vec4(this.tXMin + this.legWidth, this.tYMin, this.tZMax, 1.0), // 28
        
        // FRONT LEFT LEG
        vec4(this.tXMax, this.tYMax - this.tableWidth, this.tZMax - this.legWidth, 1.0), // 29
        vec4(this.tXMax - this.legWidth, this.tYMax - this.tableWidth, this.tZMax - this.legWidth, 1.0), // 30
        vec4(this.tXMax - this.legWidth, this.tYMax - this.tableWidth, this.tZMax, 1.0), // 31
    
        vec4(this.tXMax, this.tYMin, this.tZMax, 1.0), // 32
        vec4(this.tXMax, this.tYMin, this.tZMax - this.legWidth, 1.0), // 33
        vec4(this.tXMax - this.legWidth, this.tYMin, this.tZMax - this.legWidth, 1.0), // 34
        vec4(this.tXMax - this.legWidth, this.tYMin, this.tZMax, 1.0), // 35
    ];

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
        [27, 23, 22, 27, 22, 26], // back side
        [26, 22, 4, 26, 4, 25], // left side
        [25, 4, 24, 25, 24, 28], // front side
        [28, 24, 23, 28, 23, 27], // right side

        // FRONT RIGHT LEG
        [33, 29, 30, 33, 30, 34], // back side
        [34, 30, 31, 34, 31, 35], // left side
        [35, 31, 7, 35, 7, 32], // front side
        [32, 7, 29, 32, 29, 33], // right side
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
        // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
        for (var i = 0; i < this.indexes.length; i++) {
            for (var j = 0; j < this.indexes[i].length; j++) {
                this.positions.push(this.vertexesTable[this.indexes[i][j]]);
                this.texture.push(texCoord[this.texIndexes[j]]);
            }
        }
    }

    // DRAW TABLE
    this.drawTable = function() {
        // COPY POSITIONS, COLORS, TEXTURE COORDINATES, AND TEXTURE IDs TO BUFFER ARRAYS
        for (var i = 0; i < this.positions.length; i++) {
            vPositions.push(this.positions[i]);
            vColors.push(this.color);
            vTexCoords.push(this.texture[i]);

            this.numPositions++; // increment number of positions to match the position being added

            // PUSH TEXTURE ID
            let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
            vTexIDs.push(t);
        }
    }
}

// CLASS TO DRAW TV BUTTONS AND VCR
function ButtonsAndVCR() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = []; // temporary array to hold the vertex colors
    this.color = vec4(0.161, 0.161, 0.161, 1.0); // holds button/vcr color (dark gray)

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET POSITION ARRAY
    this.getPositions = function() {
        return this.positions;
    }

    // GET COLOR ARRAY
    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        // DRAW VCR SLOT
        this.vcrSlot();

        // DRAW 2 SQUARE BUTTONS
        var t = translate(-8.0, -4.4, 0.0); // translation matrix -> move right and down
        this.squareButton(t);
        
        t = translate(-10.5, -4.4, 0.0); // translation matrix -> move right and down
        this.squareButton(t);

        // DRAW POWER BUTTON
        t = translate(-13.0, -4.4, 0.0); // translation matrix -> move right and down
        this.powerButton(t);

    }

    // FUNCTION TO DRAW VCRSLOT
    this.vcrSlot = function() {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // DETERMINE TRANSFORMATION MATRIX
            var t = translate(0.8, -4.7, 0.0); // move right and down
            var s = scale(1.2, 0.15, 1.0); // scaling matrix -> stretch in x direction and shrink in y
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);

            // COPY POSITIONS AND TEXTURES TO ARRAYS
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(this.color);
        }
    }

    // FUNCTION TO DRAW A SQUARE BUTTON
    // t -> translation matrix
    this.squareButton = function(t) {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // DETERMINE TRANSFORMATION MATRIX
            var s = scale(0.16, 0.16, 1.0); // scaling matrix -> shrink in x and y direction
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);

            // COPY POSITIONS AND TEXTURES TO ARRAYS
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(this.color);
        }
    }

    // FUNCTION TO DRAW POWER BUTTON
    // t -> translation matrix
    this.powerButton = function(t) {
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // DETERMINE TRANSFORMATION MATRIX
            var s = scale(0.16, 0.16, 1.0); // scaling matrix -> shrink in x and y direction
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);

            // COPY POSITIONS AND TEXTURES TO ARRAYS
            var temp = mult(m, generalVerticesSquare[i]);
            this.positions.push(temp);
            this.colors.push(vec4(0.5, 0.0, 0.0, 1.0)); // dark red color
        }
    }
}

// CLASS TO DRAW TV
function TV() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.colorTV = vec4(0.161, 0.161, 0.161, 1.0); // TV color (dark gray)
    this.colorVCR = vec4(0.329, 0.329, 0.329, 1.0); // VCR band color (light gray)
    this.colorScreen = vec4(0.0, 0.0, 0.0, 1.0); // screen color (black)

    // VERTEX MAXES AND MINS
    this.tvXMax = 2.5;
    this.tvXMin = -2.5;
    this.tvYMax = 2.5;
    this.tvYMin = -1.0;
    this.tvZMax = 0.5;
    this.tvZMin = -2.5;

    this.vcrSize = 0.5; // height of vcr band
    this.screenBorder = 0.3; // width of screen 

    this.vertexesTV = [
        // FRONT
        vec4( this.tvXMin, this.tvYMin, this.tvZMax, 1.0), // 0
        vec4( this.tvXMin, this.tvYMin + this.vcrSize, this.tvZMax, 1.0), // 1
        vec4( this.tvXMin, this.tvYMax, this.tvZMax, 1.0), // 2
        vec4( this.tvXMax, this.tvYMax, this.tvZMax, 1.0), // 3
        vec4( this.tvXMax, this.tvYMin + this.vcrSize, this.tvZMax, 1.0), // 4
        vec4( this.tvXMax, this.tvYMin, this.tvZMax, 1.0), // 5
    
        // BACK
        vec4( this.tvXMin, this.tvYMin, this.tvZMin, 1.0), // 6
        vec4( this.tvXMin, this.tvYMin + this.vcrSize, this.tvZMin, 1.0), // 7
        vec4( this.tvXMin, this.tvYMax - 2.0, this.tvZMin, 1.0), // 8
        vec4( this.tvXMax, this.tvYMax - 2.0, this.tvZMin, 1.0), // 9
        vec4( this.tvXMax, this.tvYMin + this.vcrSize, this.tvZMin, 1.0), // 10
        vec4( this.tvXMax, this.tvYMin, this.tvZMin, 1.0), // 11
    
        // SCREEN
        vec4( this.tvXMin + this.screenBorder, this.tvYMin + this.vcrSize + this.screenBorder, this.tvZMax + 0.1, 1.0),  // 12
        vec4( this.tvXMin + this.screenBorder, this.tvYMax - this.screenBorder, this.tvZMax + 0.1, 1.0),  // 13
        vec4( this.tvXMax - this.screenBorder, this.tvYMax - this.screenBorder, this.tvZMax + 0.1, 1.0),  // 14
        vec4( this.tvXMax - this.screenBorder, this.tvYMin + this.vcrSize + this.screenBorder, this.tvZMax + 0.1, 1.0),  // 15
    ]

    // POSITION ARRAYS
    this.tvPositions = []; 
    this.blackScreenPositions = [];
    this.startingDuelPositions = []; // frame 1
    this.sabersHittingPositions = []; // frame 2
    this.inLavaPositions = []; // frame 3

    // COLORS ARRAYS
    this.tvColors = [];
    this.blackScreenColors = [];
    this.startingDuelColors = []; // frame 1
    this.sabersHittingColors = []; // frame 2
    this.inLavaColors = []; // frame 3

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
        // GET VERTEX POSITIONS AND TEXTURE COORDINATES FOR VCR BAND
        for (var i = 0; i < this.vrcIndexes.length; i++) {
            for (var j = 0; j < this.vrcIndexes[i].length; j++) {
                this.tvPositions.push(this.vertexesTV[this.vrcIndexes[i][j]]);
                this.tvColors.push(this.colorVCR);
            }
        }

        // GET VERTEX POSITIONS AND TEXTURE COORDINATES FOR TV
        for (var i = 0; i < this.tvBaseIndexes.length; i++) {
            for (var j = 0; j < this.tvBaseIndexes[i].length; j++) {
                this.tvPositions.push(this.vertexesTV[this.tvBaseIndexes[i][j]]);
                this.tvColors.push(this.colorTV);
            }
        }

        // GET VERTEX POSITIONS AND TEXTURE COORDINATES FOR TV SCREENS
        this.initScreens();

        // GET VERTEX POSITIONS AND TEXTURE COORDINATES FOR BUTTONS AND VCR SLOT
        var btns = new ButtonsAndVCR();
        btns.init();
        var btnsColors = btns.getColors();
        var btnsPositions = btns.getPositions();

        for (var i = 0; i < btnsPositions.length; i++) {
            this.tvPositions.push(btnsPositions[i]);
            this.tvColors.push(btnsColors[i]);
        }
        
    }

    // INITIALIZE SCREENS FUNCTION 
    this.initScreens = function() {
        // BLACK SCREEN
        for (var i = 0; i < this.screenIndexes.length; i++) {
            for (var j = 0; j < this.screenIndexes[i].length; j++) {
                this.blackScreenPositions.push(this.vertexesTV[this.screenIndexes[i][j]]);
                this.blackScreenColors.push(this.colorScreen);
            }
        }

        // SCREEN VERTEX MAXES AND MINS
        var sXMax = this.tvXMax - this.screenBorder;
        var sXMin = this.tvXMin + this.screenBorder;
        var sYMax = this.tvYMax - this.screenBorder;
        var sYMin = this.tvYMin + this.vcrSize + this.screenBorder;
        var sZValue = this.tvZMax + 0.1;


        // FRAME 1 -> STARTING DUEL
        var startDuel = new DuelStart(sXMax, sXMin, sYMax, sYMin, sZValue);
        startDuel.init();
        this.startingDuelColors = startDuel.getColors();
        this.startingDuelPositions = startDuel.getPositions();

        // FRAME 2 -> LIGHTSABERS HITTING
        var saberHit = new SabersHitting(sXMax, sXMin, sYMax, sYMin, sZValue);
        saberHit.init();
        this.sabersHittingColors = saberHit.getColors();
        this.sabersHittingPositions = saberHit.getPositions();

        // FRAME 3 -> ANAKIN IN THE LAVA
        var inLava = new InLava(sXMax, sXMin, sYMax, sYMin, sZValue);
        inLava.init();
        this.inLavaColors = inLava.getColors();
        this.inLavaPositions = inLava.getPositions();

    }

    // FUNCTION TO DRAW TV
    // frameType -> which frame to display on screen
    this.drawTV = function(frameType) {
        // COPY POSITIONS, COLORS, AND TEXTURE IDs TO BUFFER ARRAYS
        for (var i = 0; i < this.tvPositions.length; i++) {
            vPositions.push(this.tvPositions[i]);
            vColors.push(this.tvColors[i]);

            this.numPositions++; // increment number of positions to match the position being added

            // PUSH TEXTURE ID
            let t = parseFloat(this.texID).toFixed(1);; // make sure its float with one decimal
            vTexIDs.push(t);
        }

        // DRAW CORRESPONDING SCREEN
        this.drawScreen(frameType);
        
    }

    // FUNCTION TO DRAW SCREEN
    // frameType -> which frame to display on screen
    this.drawScreen = function(frameType) {
        // COPY POSITIONS, COLORS, TEXTURE COORDINATES, AND TEXTURE IDs TO BUFFER ARRAYS FOR SPECIFIC FRAME
        if (frameType == "black") {
            for (var i = 0; i < this.blackScreenPositions.length; i++) {
                vPositions.push(this.blackScreenPositions[i]);
                vColors.push(this.blackScreenColors[i]);

                this.numPositions++; // increment number of positions to match the position being added

                // PUSH TEXTURE ID
                let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
                vTexIDs.push(t);
            }
        }
        else if (frameType == "starting duel") {
            for (var i = 0; i < this.startingDuelPositions.length; i++) {
                vPositions.push(this.startingDuelPositions[i]);
                vColors.push(this.startingDuelColors[i]);
                
                this.numPositions++; // increment number of positions to match the position being added

                // PUSH TEXTURE ID
                let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
                vTexIDs.push(t);
            }
        }
        else if (frameType == "sabers hitting") {
            for (var i = 0; i < this.sabersHittingPositions.length; i++) {
                vPositions.push(this.sabersHittingPositions[i]);
                vColors.push(this.sabersHittingColors[i]);
                
                this.numPositions++; // increment number of positions to match the position being added

                // PUSH TEXTURE ID
                let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
                vTexIDs.push(t);
            }
        }
        else if (frameType == "anakin in lava") {
            for (var i = 0; i < this.inLavaPositions.length; i++) {
                vPositions.push(this.inLavaPositions[i]);
                vColors.push(this.inLavaColors[i]);

                this.numPositions++; // increment number of positions to match the position being added

                // PUSH TEXTURE ID
                let t = parseFloat(this.texID).toFixed(1); // make sure its float with one decimal
                vTexIDs.push(t);
            }
        }
    }
}


// CLASS TO DRAW LAVA AND GROUND
// sXMax -> screen max x
// sXMin -> screen min x
// sYMax -> screen max y
// sYMin -> screen min y
// sZValue -> screen z value
function LavaAndGround(sXMax, sXMin, sYMax, sYMin, sZValue) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = []; // temporary array to hold the vertex colors
    
    this.lavaAndGroundVertices = [
        vec4( sXMin, sYMin, sZValue, 1.0), // 0
        vec4( sXMin, sYMax, sZValue, 1.0), // 1
        vec4( sXMax, sYMax, sZValue, 1.0), // 2
        vec4( sXMax, sYMin, sZValue, 1.0), // 3
    
        vec4( sXMin, (sYMin + sYMax) / 2, sZValue, 1.0), // 4
        vec4( sXMax, (sYMin + sYMax) / 2, sZValue, 1.0), // 5

        vec4((sXMin - sXMin) - 1.0, (sYMin + sYMax) / 2, sZValue, 1.0), // 6
        vec4(sXMin - sXMin, sYMin, sZValue, 1.0), // 7

        vec4((sXMin - sXMin) - 0.2, (sYMin + sYMax) / 2, sZValue, 1.0), // 8
        vec4((sXMin - sXMin), sYMin, sZValue, 1.0), // 9
        vec4(sXMin - (sXMin / 2), sYMin, sZValue, 1.0), // 10
    ];

    // COLORS
    this.lavaColorLight = vec4(0.918, 0.361, 0.059, 1.0); // brighter orange
    this.lavaColorDark = vec4(0.788, 0.173, 0.0, 1.0); // darker orange/red
    this.groundColor = vec4(0.141, 0.078, 0.031, 1.0); // dark brown
    
    this.lavaColors = [ // vertex colors
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

    this.lavaIndexes1 = [ // holds first variation of lava vertices
        [0, 4, 5],
        [1, 4, 5],
        [1, 2, 5],
    ];

    this.lavaIndexes2 = [ // holds second variation of lava vertices
        [8, 0, 9],
        [8, 4, 0],
        [4, 1, 2],
        [4, 2, 5],
    ];

    this.groundIndexes1 = [ // holds first variation of ground vertices
        [0, 6, 7],
        [7, 6, 5],
        [7, 5, 3],
    ];

    this.groundIndexes2 = [ // holds second variation of ground vertices
        [10, 8, 9],
        [9, 8, 5],
        [9, 5, 3],
    ];
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET POSITIONS ARRAY
    this.getPositions = function() {
        return this.positions;
    }

    // GET COLOR ARRAY
    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    // basicGroundSetup -> whether basic ground or not (true/false)
    this.init = function(basicGroundSetup) {
        // DETERMINE GROUND AND LAVA SETUP
        if (basicGroundSetup) {
            // GROUND
            // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
            for (var i = 0; i < this.groundIndexes1.length; i++) {
                for (var j = 0; j < this.groundIndexes1[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.groundIndexes1[i][j]]);
                    this.colors.push(this.groundColor);
                }
            }


            // LAVA
            // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
            for (var i = 0; i < this.lavaIndexes1.length; i++) {
                for (var j = 0; j < this.lavaIndexes1[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.lavaIndexes1[i][j]]);
                    this.colors.push(this.lavaColors[this.lavaIndexes1[i][j]]);
                    
                    
                }
            }
            
        }
        else {
            // GROUND
            // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
            for (var i = 0; i < this.groundIndexes2.length; i++) {
                for (var j = 0; j < this.groundIndexes2[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.groundIndexes2[i][j]]);
                    this.colors.push(this.groundColor);
                }
            }

            // LAVA
            // GET VERTEX POSITIONS AND TEXTURE COORDINATES 
            for (var i = 0; i < this.lavaIndexes2.length; i++) {
                for (var j = 0; j < this.lavaIndexes2[i].length; j++) {
                    this.positions.push(this.lavaAndGroundVertices[this.lavaIndexes2[i][j]]);
                    this.colors.push(this.lavaColors[this.lavaIndexes2[i][j]]);
                }
            }
        }
    }

}


// CLASS TO DRAW A LIGHTSABER
// bladeColor -> holds lightsaber color (vec4)
function Lightsaber(bladeColor) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.lightsaberColor = vec4(0.769,0.769,0.769, 1.0); // holds handle color (light gray)
    this.bladeColor = bladeColor; // holds lightsaber blade color
    this.positions = []; // temporary array to hold the vertices
    this.colors = []; // temporary array to hold the vertex colors

    this.p = []; // temporary array to hold saber before transformation

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET POSITIONS ARRAY
    this.getPositions = function() {
        return this.positions;
    }

    // GET POSITIONS COLOR
    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        // GET VERTEX POSITIONS AND TEXTURE COORDINATES FOR BLADE
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // DETERMINE TRANSFORMATION MATRIX
            var t = translate(0, 2.0, 0.02); // translation matrix -> move up and slightly away from camera
            var s = scale(0.2, 0.6, 1); // scaling matrix -> shrink in x and y direction
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            
            // PUSH TO TEMP ARRAYS
            var temp = mult(m, generalVerticesSquare[i]);
            this.p.push(temp);
            this.colors.push(this.bladeColor );
        }

        // GET VERTEX POSITIONS AND TEXTURE COORDINATES FOR HANDLE
        for (var i = 0; i < generalVerticesSquare.length; i++) {
            // DETERMINE TRANSFORMATION MATRIX
            var t = translate(0, 0.7, 0.1); // translation matrix -> move up and slightly away from camera
            var s = scale(0.2, 0.4, 1); // scaling matrix -> shrink in x and y direction
            var r = rotate(0, 0, 1, 0); // rotation matrix -> nothing
            
            var m = determineTransformationMatrix(r, s, t);
            
            // PUSH TO TEMP ARRAYS
            var temp = mult(m, generalVerticesSquare[i]);
            this.p.push(temp);
            this.colors.push(this.lightsaberColor);
        }

    }

    // FUNCTION TO DRAW LIGHTSABER
    // t -> translation matrix
    // r -> rotation matrix
    this.drawLightsaber = function(t, r) {
        for (var i = 0; i < this.p.length; i++) {
            // DETERMINE TRANSFORMATION MATRIX
            var s = scale(0.5, 0.5, 1); // scaling matrix -> increase in size by half
            var m = determineTransformationMatrix(r, s, t);

            // PUSH TO POSITION ARRAY
            var temp = mult(m, this.p[i]);
            this.positions.push(temp);
        }
    }
}

// CLASS TO DRAW STARTING DUEL FRAME
// sXMax -> screen max x
// sXMin -> screen min x
// sYMax -> screen max y
// sYMin -> screen min y
// sZValue -> screen z value
function DuelStart(sXMax, sXMin, sYMax, sYMin, sZValue) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = []; // temporary array to hold the vertex colors
    this.lavaAndGround = new LavaAndGround(sXMax, sXMin, sYMax, sYMin, sZValue);
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET POSITIONS ARRAY
    this.getPositions = function() {
        return this.positions;
    }

    // GET POSITIONS COLOR
    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        // DRAW BACKGROUND
        this.lavaAndGround.init(true); // initialize lava and ground as basic 
        var lavaAndGroundPositions = this.lavaAndGround.getPositions();
        var lavaAndGroundColors = this.lavaAndGround.getColors();

        for (var j = 0; j < lavaAndGroundPositions.length; j++) {
            this.positions.push(lavaAndGroundPositions[j]);
            this.colors.push(lavaAndGroundColors[j]);
        }

        // DRAW SQUARAKIN
        drawSquare(this.positions, this.colors, translate(-0.5, 2.0, 0.1), false, false);
        
        // DRAW ANAKIN'S LIGHTSABER
        var anakinSaber = new Lightsaber(squareBladeColor);
        anakinSaber.init();

        var saberTranslate = translate(0.0, 2.0, 0.1);
        var saberRotate = rotate(10, 0, 0, 1);

        anakinSaber.drawLightsaber(saberTranslate, saberRotate);
        var lightsaberColor = anakinSaber.getColors();
        var swordPosition = anakinSaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberColor[i]);
        }

        // DRAW TRIANGOBI 
        drawTriangle(this.positions, this.colors, translate(2.5, 2.0, 0.1));

        // DRAW OBI WAN'S LIGHTSABER
        var obiwanSaber = new Lightsaber(triangleBladeColor);
        obiwanSaber.init();

        saberTranslate = translate(2.5, 1.5, 0.1);
        saberRotate = rotate(-10, 0, 0, 1);

        obiwanSaber.drawLightsaber(saberTranslate, saberRotate);
        lightsaberColor = obiwanSaber.getColors();
        swordPosition = obiwanSaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberColor[i]);
        }
    }
}

// CLASS TO DRAW LIGHTSABER'S HITTING FRAME
// sXMax -> screen max x
// sXMin -> screen min x
// sYMax -> screen max y
// sYMin -> screen min y
// sZValue -> screen z value
function SabersHitting(sXMax, sXMin, sYMax, sYMin, sZValue) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = []; // temporary array to hold the vertex colors
    this.lavaAndGround = new LavaAndGround(sXMax, sXMin, sYMax, sYMin, sZValue);
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET POSITIONS ARRAY
    this.getPositions = function() {
        return this.positions;
    }

    // GET POSITIONS COLOR
    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        // DRAW BACKGROUND
        this.lavaAndGround.init(true); // initialize lava and ground as basic 
        var lavaAndGroundPositions = this.lavaAndGround.getPositions();
        var lavaAndGroundColors = this.lavaAndGround.getColors();
        
        for (var j = 0; j < lavaAndGroundPositions.length; j++) {
            this.positions.push(lavaAndGroundPositions[j]);
            this.colors.push(lavaAndGroundColors[j]);
        }

        // DRAW SQUARAKIN
        drawSquare(this.positions, this.colors, translate(-1.5, 2.0, 0.1), false, false);
        
        // DRAW ANAKIN'S LIGHTSABER
        var anakinSaber = new Lightsaber(squareBladeColor);
        anakinSaber.init();

        var saberTranslate = translate(-2.0, 1.0, 0.1);
        var saberRotate = rotate(40, 0, 0, 1);

        anakinSaber.drawLightsaber(saberTranslate, saberRotate);
        var lightsaberColor = anakinSaber.getColors();
        var swordPosition = anakinSaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberColor[i]);
        }

        // DRAW TRIANGOBI
        drawTriangle(this.positions, this.colors, false);

        // DRAW OBI WAN'S LIGHTSABER
        var obiwanSaber = new Lightsaber(triangleBladeColor);
        obiwanSaber.init();

        saberTranslate = translate(1.5, 1.2, 0.1);
        saberRotate = rotate(-25, 0, 0, 1);

        obiwanSaber.drawLightsaber(saberTranslate, saberRotate);
        lightsaberColor = obiwanSaber.getColors();
        swordPosition = obiwanSaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberColor[i]);
        }
    }
}

// DRAW ANAKIN IN THE LAVA
// sXMax -> screen max x
// sXMin -> screen min x
// sYMax -> screen max y
// sYMin -> screen min y
// sZValue -> screen z value
function InLava(sXMax, sXMin, sYMax, sYMin, sZValue) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPositions
    this.positions = []; // temporary array to hold the vertices
    this.colors = []; // temporary array to hold the vertex colors
    this.lavaAndGround = new LavaAndGround(sXMax, sXMin, sYMax, sYMin, sZValue);
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET POSITIONS ARRAY
    this.getPositions = function() {
        return this.positions;
    }

    // GET POSITIONS COLOR
    this.getColors = function() {
        return this.colors;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    // INITIALIZATION FUNCTION
    this.init = function() {
        // DRAW BACKGROUND
        this.lavaAndGround.init(false); // initialize lava and ground as other layout
        var lavaAndGroundPositions = this.lavaAndGround.getPositions();
        var lavaAndGroundColors = this.lavaAndGround.getColors();

        for (var j = 0; j < lavaAndGroundPositions.length; j++) {
            this.positions.push(lavaAndGroundPositions[j]);
            this.colors.push(lavaAndGroundColors[j]);
        }

        // DRAW SQUARAKIN
        drawSquare(this.positions, this.colors, false, true, true);
        
        // DRAW ANAKIN'S LIGHTSABER
        var lightsaber = new Lightsaber(squareBladeColor);
        lightsaber.init();

        var saberTranslate = translate(-2.0, 1.5, 0.1);
        var saberRotate = rotate(10, 0, 0, 1);

        lightsaber.drawLightsaber(saberTranslate, saberRotate);
        var lightsaberColor = lightsaber.getColors();
        var swordPosition = lightsaber.getPositions();
        
        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberColor[i]);
        }

        // DRAW TRIANGOBI
        drawTriangle(this.positions, this.colors, false);

        var obiwanSaber = new Lightsaber(triangleBladeColor);
        obiwanSaber.init();

        saberTranslate = translate(1.5, 1.2, 0.1);
        saberRotate = rotate(-25, 0, 0, 1);

        obiwanSaber.drawLightsaber(saberTranslate, saberRotate);
        lightsaberColor = obiwanSaber.getColors();
        swordPosition = obiwanSaber.getPositions();

        for (var i = 0; i < swordPosition.length; i++) {
            this.positions.push(swordPosition[i]);
            this.colors.push(lightsaberColor[i]);
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

    // DRAW OBJECTS
    wall = new Walls();
    wall.init();
    wall.drawWalls();

    floor = new Floor();
    floor.init();
    floor.drawFloor();

    table = new Table();
    table.init();
    table.drawTable();

    tv = new TV();
    tv.init();
    tv.drawTV(screenOptions[screenIndex]);


    // GET NUMBER OF POSITIONS
    numPositions = numPositions + wall.getNumPositions();
    numPositions = numPositions + floor.getNumPositions();
    numPositions = numPositions + table.getNumPositions();
    numPositions = numPositions + tv.getNumPositions();

    ///////////////////////////////////
    /*      BUTTONS & SELECTS        */
    ///////////////////////////////////

    // TURN ON TV BUTTON 
    document.getElementById("power-on").onclick = function() {
        if (!powerOn) {
            // UPDATE CORRESPONDING VARIABLES
            powerOn = true; // power is on
            play = true; // start show

            // REDRAW AND RERENDER 
            reDrawScreen();
            render()
        }
    }

    // TURN OFF TV BUTTON 
    document.getElementById("power-off").onclick = function() {
        if (powerOn) {
            // UPDATE CORRESPONDING VARIABLES
            powerOn = false; // power is off
            play = false;
            screenIndex = 0; // return to black screen

            // REDRAW AND RERENDER 
            reDrawScreen();
            render();
        }
    }

    // PAUSE SHOW BUTTON
    document.getElementById("pause").onclick = function() {
        if (powerOn) { // power must be on
             // UPDATE CORRESPONDING VARIABLES
            play = false; // stop frames from animating

            // RERENDER 
            render();
        }
    }

    // PLAY SHOW BUTTON
    document.getElementById("play").onclick = function() {
        if (powerOn) { // power must be on
             // UPDATE CORRESPONDING VARIABLES
            play = true; // set frames to animate

            // RERENDER 
            render();
        }
    }

    // PREVIOUS FRAME BUTTON
    document.getElementById("prev").onclick = function() {
        if (powerOn  && !play) {  // power must be on and show must be paused
            if (screenIndex - 1 < 1) { // if already at start
                screenIndex = 3 ; // loop back to end
            }
            else {
                screenIndex = screenIndex - 1; // decrease screen index
            }
            
            // REDRAW AND RERENDER 
            reDrawScreen();
            render()
        }
    }
    document.getElementById("next").onclick = function() {
        if (powerOn  && !play) {  // power must be on and show must be paused
            screenIndex = screenIndex % 3 + 1; // move to next frame unless at last frame, loop back to first

            // REDRAW AND RERENDER 
            reDrawScreen();
            render()
        }
    }

    // CAMERA POSITION SELECT
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

    // CREATE & BIND COLOR BUFFER
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vColors), gl.STATIC_DRAW );

    // SET COLOR ATTRIBUTE VARIABLE
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    // CREATE & BIND TEXTURE COORDINATES BUFFER
    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vTexCoords), gl.STATIC_DRAW);

    // SET TEXTURE COORDINATES  ATTRIBUTE VARIABLE
    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    // CREATE & BIND TEXTURE ID BUFFER
    tIDBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tIDBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTexIDs), gl.STATIC_DRAW);

    // SET TEXTURE ID ATTRIBUTE VARIABLE
    var textIDLoc = gl.getAttribLocation(program, "aTexID");
    gl.vertexAttribPointer(textIDLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textIDLoc);
    
    // GET UNIFORM VARIABLE LOCATIONS
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    ///////////////////////////////////

    ///////////////////////////////////
    /*        SETUP TEXTURES         */
    ///////////////////////////////////

    var brickTexture = document.getElementById("brickTexture");
    configureTexture(brickTexture, "uBrickTexture", gl.TEXTURE0, 0);

    var carpetTexture = document.getElementById("carpetTexture");
    configureTexture(carpetTexture, "uCarpetTexture", gl.TEXTURE1, 1);

    var woodTexture = document.getElementById("woodTexture");
    configureTexture(woodTexture, "uWoodTexture", gl.TEXTURE2, 2);

    ///////////////////////////////////

    // DRAW
    render();
}

// RENDER FUNCTION
var render = function() {
    console.log("Render function called");

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

    // DETERMINE IF FRAMES NEED TO BE ANIMATED OR STATIC    
    if (powerOn && play) {
        screenIndex = screenIndex % 3 + 1; // get the next screen index

        reDrawScreen(); // redraw screen

        gl.drawArrays( gl.TRIANGLES, 0, numPositions); // draw

        // request frame after animation delay
        setTimeout(() => {
            requestAnimationFrame(render);
        }, animationDelay);

    }
    else {
        gl.drawArrays( gl.TRIANGLES, 0, numPositions); // draw 
    }
}