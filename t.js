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
    ];

    
    this.tvXMax = 2.5;
    this.tvXMin = -2.5;
    this.tvYMax = 2.5;
    this.tvYMin = -1.0;
    this.tvZMax = 0.5;
    this.tvZMin = -2.5;

    this.vcrSize = 0.5;
    this.screenBorder = 0.3;