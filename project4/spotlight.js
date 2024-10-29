/*
    CS 435
    Project 4
    Alex Khachadoorian
    This program draws a c shaped room with floors and walls. 
    There is a spotlight that can be adjusted to see the lighting effects on the room.
    The viewer can also move to different locations around the room to see the different effects better.

    h ____ g ____ d ____ b
    |                    |
    |                    |
    |      f ____ e      |
    |      |      |      |
    |      |      |      |
    i ____ j      a ____ c

    a -> 0
    b -> 1
    c -> 2
    d -> 3
    e -> 4
    f -> 5
    g -> 6
    h -> 7
    i -> 8
    j -> 9

    0-9 -> FLOOR TOP / WALL BOTTOM
    10-19 -> FLOOR BOTTOM
    20-29 -> WALL TOP
    30-39 -> INNER WALL TOP
    40-49 -> INNER WALL BOTTOM

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
var vPosition = [];; // holds all the vertex positions
var vBuffer; // vertex buffer
var normals = []; // holds all the normals for the vertexes
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
var normalMatrix; //holds the normal matrix
///////////////////////////////////

///////////////////////////////////
// LIGHT VARIABLES  
var lightPositions = [
    vec4(-1.35, 1.0, 0.35, 1.0),  // 1
    vec4(-1.35, 1.0, -0.95, 1.0), // 2
    vec4(0.0, 1.0, -0.95, 1.0),   // 3
    vec4(1.35, 1.0, -0.95, 1.0),  // 4
    vec4(1.35, 1.0, 0.35, 1.0),   // 5
]; // holds all possible light positions

var lightPosition = lightPositions[0]; // holds the light position for rendering

// LIGHTS
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0); // ambient light
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0); // diffuse light
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0); // specular light

// MATERIAL 
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0); // ambient light on material
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0); // diffuse light on material
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0); // specular light on material
var materialShininess = 20.0; // materials shininess (semi-shiny)

// DIRECTION
var lightX = 0.0; // light in x direction -> none in x direction
var lightY = -1.0; // light in y direction -> light directly down in y direction
var lightZ = 0.0; // light in z direction -> none in z direction
var lightDirection = vec3(lightX, lightY, lightZ); // holds vector representing light direction
var cutoffAngle = 20; // holds the cut off angle of spot light in degrees

// SHADER VARIABLES
var lightPosLoc; // holds light position uniform variable location
var lightDirectionLoc; // holds light direction uniform variable location
var cutOffAngleLoc; // holds cutoff angle uniform variable location
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

///////////////////////////////////
// ROOM VARIABLES
var floorXs = [2.0, 0.75, -0.75, -2.0,]; // holds the x values for the floor
var floorZs = [1.25, 0.0, -1.25]; // holds the z values for the floor
var floorTopY = 0.0; // holds the y value for the top part of floor
var floorBottomY = -0.2; // holds the y value for the bottom part of floor

var wallTopY = 0.5; // holds the y value for the top of wall
var innerWallDiff = 0.1; // hold the difference in x & z for inner wall 

var vertices = [
    // FLOOR TOP / WALL BOTTOM
    vec4(floorXs[1], floorTopY, floorZs[0], 1.0), // 0
    vec4(floorXs[0], floorTopY, floorZs[2], 1.0), // 1
    vec4(floorXs[0], floorTopY, floorZs[0], 1.0), // 2
    vec4(floorXs[1], floorTopY, floorZs[2], 1.0), // 3

    vec4(floorXs[1], floorTopY, floorZs[1], 1.0), // 4
    vec4(floorXs[2], floorTopY, floorZs[1], 1.0), // 5
    vec4(floorXs[2], floorTopY, floorZs[2], 1.0), // 6

    vec4(floorXs[3], floorTopY, floorZs[2], 1.0), // 7
    vec4(floorXs[3], floorTopY, floorZs[0], 1.0), // 8
    vec4(floorXs[2], floorTopY, floorZs[0], 1.0), // 9

    // FLOOR BOTTOM
    vec4(floorXs[1], floorBottomY, floorZs[0], 1.0), // 10
    vec4(floorXs[0], floorBottomY, floorZs[2], 1.0), // 11
    vec4(floorXs[0], floorBottomY, floorZs[0], 1.0), // 12
    vec4(floorXs[1], floorBottomY, floorZs[2], 1.0), // 13 

    vec4(floorXs[1], floorBottomY, floorZs[1], 1.0), // 14
    vec4(floorXs[2], floorBottomY, floorZs[1], 1.0), // 15
    vec4(floorXs[2], floorBottomY, floorZs[2], 1.0), // 16

    vec4(floorXs[3], floorBottomY, floorZs[2], 1.0), // 17
    vec4(floorXs[3], floorBottomY, floorZs[0], 1.0), // 18
    vec4(floorXs[2], floorBottomY, floorZs[0], 1.0), // 19

    // WALL TOP
    vec4(floorXs[1], wallTopY, floorZs[0], 1), // 20
    vec4(floorXs[0], wallTopY, floorZs[2], 1), // 21
    vec4(floorXs[0], wallTopY, floorZs[0], 1), // 22
    vec4(floorXs[1], wallTopY, floorZs[2], 1.0), // 23 

    vec4(floorXs[1], wallTopY, floorZs[1], 1.0), // 24
    vec4(floorXs[2], wallTopY, floorZs[1], 1.0), // 25
    vec4(floorXs[2], wallTopY, floorZs[2], 1.0), // 26

    vec4(floorXs[3], wallTopY, floorZs[2], 1.0), // 27
    vec4(floorXs[3], wallTopY, floorZs[0], 1.0), // 28
    vec4(floorXs[2], wallTopY, floorZs[0], 1.0), // 29

    // INNER WALL TOP
    vec4(floorXs[1] + innerWallDiff, wallTopY, floorZs[0] - innerWallDiff, 1), // 30
    vec4(floorXs[0] - innerWallDiff, wallTopY, floorZs[2] + innerWallDiff, 1), // 31
    vec4(floorXs[0] - innerWallDiff, wallTopY, floorZs[0] - innerWallDiff, 1), // 32
    vec4(floorXs[1], wallTopY, floorZs[2] + innerWallDiff, 1.0), // 33 

    vec4(floorXs[1]+ innerWallDiff, wallTopY, floorZs[1] - innerWallDiff, 1.0), // 34
    vec4(floorXs[2] - innerWallDiff, wallTopY, floorZs[1] - innerWallDiff, 1.0), // 35
    vec4(floorXs[2], wallTopY, floorZs[2] + innerWallDiff, 1.0), // 36

    vec4(floorXs[3] + innerWallDiff, wallTopY, floorZs[2] + innerWallDiff, 1.0), // 37
    vec4(floorXs[3] + innerWallDiff, wallTopY, floorZs[0] - innerWallDiff, 1.0), // 38
    vec4(floorXs[2] - innerWallDiff, wallTopY, floorZs[0] - innerWallDiff, 1.0), // 39
    
    // INNER WALL BOTTOM
    vec4(floorXs[1] + innerWallDiff, floorTopY, floorZs[0] - innerWallDiff, 1), // 40
    vec4(floorXs[0] - innerWallDiff, floorTopY, floorZs[2] + innerWallDiff, 1), // 41
    vec4(floorXs[0] - innerWallDiff, floorTopY, floorZs[0] - innerWallDiff, 1), // 42
    vec4(floorXs[1], floorTopY, floorZs[2] + innerWallDiff, 1.0), // 43 

    vec4(floorXs[1] + innerWallDiff, floorTopY, floorZs[1] - innerWallDiff, 1.0), // 44
    vec4(floorXs[2] - innerWallDiff, floorTopY, floorZs[1] - innerWallDiff, 1.0), // 45
    vec4(floorXs[2], floorTopY, floorZs[2] + innerWallDiff, 1.0), // 46

    vec4(floorXs[3] + innerWallDiff, floorTopY, floorZs[2] + innerWallDiff, 1.0), // 47
    vec4(floorXs[3] + innerWallDiff, floorTopY, floorZs[0] - innerWallDiff, 1.0), // 48
    vec4(floorXs[2] - innerWallDiff, floorTopY, floorZs[0] - innerWallDiff, 1.0), // 49
]; // holds all the possible vertices for the room
///////////////////////////////////

///////////////////////////////////
/*       GLOBAL FUNCTIONS        */
///////////////////////////////////

// FUNCTION TO CONVERT DEGREES TO RADIANS
// angle -> angle in degrees
function degreeToRadians(angle) {
    return angle * (Math.PI / 180);
}

///////////////////////////////////
/*           CLASSES             */
///////////////////////////////////

// CLASS TO DRAW FLOOR
function Floor() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPosition
    this.positions = []; // temporary array to hold the vertices
    this.norms = []; // temporary array to hold the normals

    this.floorIndexes = [
        // TOP FLOOR
        [0, 1, 2, 0, 3, 1], // rectangle acbd
        [4, 6, 3, 5, 6, 4], // square defg
        [6, 8, 7, 6, 9, 8], // rectangle gjih
    
        // BOTTOM FLOOR
        [12, 11, 10, 11, 13, 10], // rectangle acbd
        [13, 16, 14, 14, 16, 15], // square defg
        [17, 18, 16, 18, 19, 16], // rectangle gjih
        
        // CONNECT FLOORS   
        [0, 10, 12, 0, 12, 2], // ac face
        [8, 18, 19, 8, 19, 9], // ij face
        [14, 15, 5, 5, 14, 4], // fe face
        [9, 19, 15, 9, 15, 5], // fj face
        [14, 10, 0, 0, 14, 4], // ae face
        [12, 11, 2, 2, 11, 1], // bc face
        [7, 17, 18, 7, 18, 8], // hi face
        [1, 11, 17, 1, 17, 7], // bh face
    ]; // holds the indexes for the vertices array relating to the floor

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
        // GET VERTICES POSITIONS AND NORMALS FOR FLOOR
        for (var i = 0; i < this.floorIndexes.length; i++) {
            var norm = this.calcNorm(this.floorIndexes[i][0], this.floorIndexes[i][1], this.floorIndexes[i][2]); //calculate norm for these vertices

            for (var j = 0; j < this.floorIndexes[i].length; j++) {
                this.positions.push(vertices[this.floorIndexes[i][j]]); // add vertices positions
                this.norms.push(norm); // add norms
            }
        }
    }

    // DRAW FLOORS   
    this.drawFloor = function() {
        // COPY POSITIONS AND NORMALS TO BUFFER ARRAYS
        for (var i = 0; i < this.positions.length; i++) {
            vPosition.push(this.positions[i]);
            normals.push(this.norms[i]);

            this.numPositions++; // increment number of positions to match the position being added
        }
    }

    // CALCULATE NORM VECTOR
    // point1 -> first point of triangle
    // point2 -> second point of triangle
    // point3 -> third point of triangle
    this.calcNorm = function(point1, point2, point3) {
        // CALCULATE 2 VECTORS RELATING TO POINTS
        var vector1 = subtract(vertices[point1], vertices[point3]);
        var vector2 = subtract(vertices[point3], vertices[point2]);
        
        // DETERMINE NORM BY FINDING NORMALIZED CROSS PRODUCT
        var normal = normalize(cross(vector1, vector2));

        // CONVERT TO VEC4 
        normal = vec4(normal[0], normal[1], normal[2], 0.0);

        return normal
    }
}

// CLASS TO DRAW WALLS
function Walls() {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////
    this.numPositions = 0; // number of vertices added to the vPosition
    this.positions = []; // temporary array to hold the vertices
    this.norms = []; // temporary array to hold the normals

    this.wallIndexes = [
        // OUTER WALL
        [20, 0, 2, 20, 2, 22], // ac wall
        [22, 2, 1, 22, 1, 21], // cb wall
        [21, 1, 7, 21, 7, 27], // bh wall
        [27, 7, 8, 27, 8, 28], // hi wall
        [28, 8, 9, 28, 9, 29], // ij wall
        [29, 9, 5, 29, 5, 25], // jf wall
        [4, 5, 25, 25, 4, 24], // fe wall
        [24, 4, 0, 24, 0, 20], // ea wall

        // INNER WALL
        [40, 42, 30, 30, 42, 32], // ac wall
        [42, 41, 32, 32, 41, 31], // cb wall
        [41, 47, 31, 31, 47, 37], // bh wall
        [47, 48, 37, 37, 48, 38], // hi wall
        [48, 49, 38, 38, 49, 39], // ij wall
        [49, 45, 39, 39, 45, 35], // jf wall
        [35, 44, 45, 35, 44, 34], // fe wall
        [44, 40, 34, 34, 40, 30], // ea wall

        // CONNECT WALLS
        [30, 32, 22, 22, 30, 20], // ac face
        [32, 31, 21, 21, 32, 22], // cb face
        [31, 37, 27, 27, 31, 21], // bh face
        [37, 38, 28, 28, 37, 27], // hi face
        [38, 39, 29, 29, 38, 28], // ij face
        [39, 35, 25, 25, 39, 29], // jf face
        [35, 34, 24, 24, 35, 25], // fe face
        [34, 30, 20, 20, 34, 24], // ea face
    ]; // holds the indexes for the vertices array relating to the walls

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
        // GET VERTICES POSITIONS AND NORMALS FOR WALLS
        for (var i = 0; i < this.wallIndexes.length; i++) {
            var norm = this.calcNorm(this.wallIndexes[i][0], this.wallIndexes[i][1], this.wallIndexes[i][2]); //calculate norm for these vertices

            for (var j = 0; j < this.wallIndexes[i].length; j++) {
                this.positions.push(vertices[this.wallIndexes[i][j]]); // add vertices positions
                this.norms.push(norm); // add norms
            }
        }
    }

    // DRAW WALLS
    this.drawWalls = function() {
        // COPY POSITIONS AND NORMALS TO BUFFER ARRAYS
        for (var i = 0; i < this.positions.length; i++) {
            vPosition.push(this.positions[i]);
            normals.push(this.norms[i]);

            this.numPositions++; // increment number of positions to match the position being added
        }
    }

    // CALCULATE NORM VECTOR
    // point1 -> first point of triangle
    // point2 -> second point of triangle
    // point3 -> third point of triangle
    this.calcNorm = function(point1, point2, point3) {
        // CALCULATE 2 VECTORS RELATING TO POINTS
        var vector1 = subtract(vertices[point1], vertices[point3]);
        var vector2 = subtract(vertices[point3], vertices[point2]);
        
        // DETERMINE NORM BY FINDING NORMALIZED CROSS PRODUCT
        var normal = normalize(cross(vector1, vector2));

        // CONVERT TO VEC4 
        normal = vec4(normal[0], normal[1], normal[2], 0.0);

        return normal
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
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // DRAW FLOOR AND WALLS
    var floor = new Floor();
    floor.init();
    floor.drawFloor();
    
    var wall = new Walls();
    wall.init();
    wall.drawWalls();
    
    // GET NUMBER OF POSITIONS
    numPositions = numPositions + floor.getNumPositions();
    numPositions = numPositions + wall.getNumPositions();

    ///////////////////////////////////
    /*      BUTTONS & SELECTS        */
    ///////////////////////////////////

    // SELECTS
    // SPOTLIGHT POSITION
    document.getElementById("spotlight_pos").onchange = function() { 
        // UPDATE LIGHT POSITION BASED ON SELECT CHANGE
        if (document.getElementById("spotlight_pos").value == "1") {
            lightPosition = lightPositions[0];
        }
        else if (document.getElementById("spotlight_pos").value == "2") {
            lightPosition = lightPositions[1];
        }
        else if (document.getElementById("spotlight_pos").value == "3") {
            lightPosition = lightPositions[2];
        }
        else if (document.getElementById("spotlight_pos").value == "4") {
            lightPosition = lightPositions[3];
        }
        else if (document.getElementById("spotlight_pos").value == "5") {
            lightPosition = lightPositions[4];
        }

        // RESET SPOTLIGHT AIM AND CUTOFF
        lightX = 0.0;
        lightY = -1.0;
        lightZ = 0.3;

        cutoffAngle = 20;

        // RERENDER CANVAS
        render();
    }

    // CAMERA POSITION
    document.getElementById("viewer_pos").onchange = function() {
        //UPDATE CAMERA POSITION BASED ON SELECT CHANGE
        if (document.getElementById("viewer_pos").value == "A") {
            eye = eyePositions[0];
            eyeIndex = 0;
        }
        else if (document.getElementById("viewer_pos").value == "B") {
            eye = eyePositions[1];
            eyeIndex = 1;
        }
        else if (document.getElementById("viewer_pos").value == "C") {
            eye = eyePositions[2];
            eyeIndex = 2;
        }
        else if (document.getElementById("viewer_pos").value == "D") {
            eye = eyePositions[3];
            eyeIndex = 3;
        }
        else if (document.getElementById("viewer_pos").value == "E") {
            eye = eyePositions[4];
            eyeIndex = 4;
        }
        else if (document.getElementById("viewer_pos").value == "F") {
            eye = eyePositions[5];
            eyeIndex = 5;
        }
    
        // RESET SPOTLIGHT AIM AND CUTOFF
        lightX = 0.0;
        lightY = -1.0;
        lightZ = 0.3;

        cutoffAngle = 20;
    
        // RERENDER CANVAS
        render();
    }

    // BUTTONS
    // INCREASE CUTOFF ANGLE
    document.getElementById("increase_co_angle").onclick = function() {
        // MAKE SURE MAX IS NOT REACHED THEN INCREASE
        if (cutoffAngle != 90) {
            cutoffAngle += 5; // increase by 5 degrees
        }

        // RERENDER
        render();
    }

    // DECREASE CUTOFF ANGLE
    document.getElementById("decrease_co_angle").onclick = function() {
        // MAKE SURE MIN IS NOT REACHED THEN DECREASE
        if (cutoffAngle != 0) {
            cutoffAngle -= 5; // decrease by 5 degrees
        }

        // RERENDER
        render();
    }

    // SPOTLIGHT AIM UP
    document.getElementById("up_aim").onclick = function() {
        // DETERMINE EFFECT BASED ON CAMERA POSITION
        if (eyeIndex == 0 || eyeIndex == 1 || eyeIndex == 2) { // camera is at A, B, or C
            if (lightZ != 3) { // if not at max value
                lightZ += 0.1;  // increase z to move light up
            }
        }
        else if (eyeIndex == 3 || eyeIndex == 4 || eyeIndex == 5) { // camera is at D, E, or F
            if (lightZ != -3) { // if not a max value
                lightZ -= 0.1;  // decrease z to move light up
            }
        }

        // RERENDER
        render();
    }

    // SPOTLIGHT AIM DOWN
    document.getElementById("down_aim").onclick = function() {
        // DETERMINE EFFECT BASED ON CAMERA POSITION
        if (eyeIndex == 0 || eyeIndex == 1 || eyeIndex == 2) { // camera is at A, B, or C
            if (lightZ != 3) { // if not at max value
                lightZ -= 0.1; // decrease z to move light down
            }
        }
        else if (eyeIndex == 3 || eyeIndex == 4 || eyeIndex == 5) { // camera is at D, E, or F
            if (lightZ != -3) { // if not at max value
                lightZ += 0.1; // increase z to move light down
            }
        }

        // RERENDER
        render();
    }

    // SPOTLIGHT AIM LEFT
    document.getElementById("left_aim").onclick = function() {
        // DETERMINE EFFECT BASED ON CAMERA POSITION
        if (eyeIndex == 0 || eyeIndex == 1 || eyeIndex == 2) { // camera is at A, B, or C
            if (lightX != 3) { // if not at max value
                lightX += 0.1; // decrease z to move light down
            }
        }
        else if (eyeIndex == 3 || eyeIndex == 4 || eyeIndex == 5) { // camera is at D, E, or F
            if (lightX != -3) { // if not at max value
                lightX += 0.1; // increase z to move light down
            }
        }

        // RERENDER
        render();
    }

    // SPOTLIGHT AIM RIGHT
    document.getElementById("right_aim").onclick = function() {
        // DETERMINE EFFECT BASED ON CAMERA POSITION
        if (eyeIndex == 0 || eyeIndex == 1 || eyeIndex == 2) { // camera is at A, B, or C
            if (lightX != 3) { // if not at max value
                lightX -= 0.1; // decrease z to move light down
            }
        }
        else if (eyeIndex == 3 || eyeIndex == 4 || eyeIndex == 5) { // camera is at D, E, or F
            if (lightX != -3) { // if not at max value
                lightX += 0.1; // increase z to move light down
            }
        }

        // RERENDER
        render();
    }
    ///////////////////////////////////

    // CALCULATE LIGHT PRODUCTS    
    var ambientProduct = mult(lightAmbient, materialAmbient); // ambient product
    var diffuseProduct = mult(lightDiffuse, materialDiffuse); // diffuse product
    var specularProduct = mult(lightSpecular, materialSpecular); // specular product

    // SET UP PROGRAM
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ///////////////////////////////////
    /*    SET UP SHADER VARIABLES    */
    ///////////////////////////////////

    // CREATE & BIND NORMALS BUFFER
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    // SET NORMAL ATTRIBUTE VARIABLE
    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    // CREATE & BIND VERTEX BUFFER
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vPosition), gl.STATIC_DRAW);

    // SET POSITION ATTRIBUTE VARIABLE
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // SET AMBIENT PRODUCT UNIFORM VARIABLE
    var ambientLoc = gl.getUniformLocation(program, "uAmbientProduct");
    gl.uniform4fv(ambientLoc, flatten(ambientProduct));

    // SET DIFFUSE PRODUCT UNIFORM VARIABLE
    var diffuseLoc = gl.getUniformLocation(program,"uDiffuseProduct");
    gl.uniform4fv(diffuseLoc, flatten(diffuseProduct));

    // SET SPECULAR PRODUCT UNIFORM VARIABLE
    var specularLoc = gl.getUniformLocation(program,"uSpecularProduct");
    gl.uniform4fv(specularLoc, flatten(specularProduct));

    // SET SHININESS UNIFORM VARIABLE
    var shininessLoc = gl.getUniformLocation(program,"uShininess");
    gl.uniform1f(shininessLoc, materialShininess);

    // GET UNIFORM VARIABLE LOCATIONS
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
    lightPosLoc = gl.getUniformLocation(program,"uLightPosition");
    lightDirectionLoc = gl.getUniformLocation(program, "lightDirection");
    cutOffAngleLoc = gl.getUniformLocation(program, "cutoffAngle");
    ///////////////////////////////////

    // DRAW
    render();
}

// RENDER FUNCTION
var render = function() {
    // CLEAR BITS
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // CALCULATE CUTOFF ANGLE IN RADIANS
    var cutOffRadian = Math.cos(degreeToRadians(cutoffAngle));

    // CALCULATE MATRIXES
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(theLeft, theRight, theBottom, theTop, near, far);
    normalMatrix = inverse(transpose(modelViewMatrix));

    ///////////////////////////////////
    /*      SET SHADER VARIABLES     */
    ///////////////////////////////////

    gl.uniform4fv(lightPosLoc,flatten(lightPosition)); // set light position
    gl.uniform3fv(lightDirectionLoc, vec3(lightX, lightY, lightZ)); // set light direction
    gl.uniform1f(cutOffAngleLoc, cutOffRadian); // set cutoff angle
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) ); // set modelViewMatrix
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix)); // set projectionMatrix
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) ); // set normal 

    // DRAW FLOOR AND WALLS
    gl.drawArrays( gl.TRIANGLES, 0, numPositions);

}