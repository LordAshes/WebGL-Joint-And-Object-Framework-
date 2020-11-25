    var gl;

    function initGL(canvas)
	{
        try 
		 {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } 
		 catch (e)
		 {
        }
        if (!gl) 
		 {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }

    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k)
		 {
            if (k.nodeType == 3)
			 {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment")
		 {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } 
		 else if (shaderScript.type == "x-shader/x-vertex")
		 {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } 
		 else 
		 {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		 {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    function initShaders() 
	{
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
		 {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    }


    function handleLoadedTexture(texture)
	{
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();

    function mvPushMatrix()
	{
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }

    function mvPopMatrix() 
	{
        if (mvMatrixStack.length == 0) 
		 {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }

    function setMatrixUniforms()
	{
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }

    function degToRad(degrees)
	{
        return degrees * Math.PI / 180;
    }
	
	var PressedKeys = {};
	var KeyEventType = 0;

    function KeyDownEvent(event)
	{
	    // alert(event.keyCode);
        PressedKeys[event.keyCode] = true;
		if(KeyEventType>0){ProcessKeys(event.keyCode,1);}
    }

    function KeyUpEvent(event)
	{
        PressedKeys[event.keyCode] = false;
		if(KeyEventType>0){ProcessKeys(event.keyCode,0);}
    }

    function DrawScene()
	{
		// Clear GL Surface
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Prepare Perspective Transformation
		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 150.0, pMatrix);

		// Draw All Objects
		mat4.identity(mvMatrix);
		Objects.Draw();
    }

    function Tick()
	{	 
		// Handle Keys
		if(KeyEventType==0){ProcessKeys();}
  
		// Draw World
		DrawScene();
		
		// Perform Animation Changes
		Animate();
		
		// Request Next Tick
		requestAnimFrame(Tick);
    }

    function webGLStart()
	{
		
        var Canvas = document.getElementById("canvas-main");
		
        initGL(Canvas);
        initShaders();		
		initObjects();
		
		gl.enable(gl.DEPTH_TEST);

		document.onkeydown = KeyDownEvent;
		document.onkeyup = KeyUpEvent;
		
		Tick();
	}
