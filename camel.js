/**
 * ************************************************************************************
 * Javascript Document
 * 
 * Library Classes Name: Camel
 * 
 * Developer: Vu Huy Cuong
 * 
 * Email: vuhuycuong291987@gmail.com
 * 
 * Website: bapquadgames.com
 * ************************************************************************************
 */

var CAMEL_WEBGL = 'experimental-webgl', 
	CAMEL_VERTEX = 'x-shader/x-vertex', 
	CAMEL_FRAGMENT = 'x-shader/x-fragment', 
	CAMEL_ATTRIB = 0, 
	CAMEL_UNIFORM = 1, 
	CAMEL_QUEUE_IMAGE = 0, 
	CAMEL_QUEUE_SOUND = 1,
	CAMEL_QUEUE_XHTTP = 2,
	CAMEL_QUEUE_VIDEO = 3;
var CAMEL_MATH_EPSILON = 0.000001;
var NULL = null, 
	TRUE = true, 
	FALSE = false, 
	INFINITY = -9999999, 
	EMPTY = '', 
	UNSET = undefined;
var GL_COLOR_BUFFER_BIT = 16384, 
	GL_DEPTH_BUFFER_BIT = 256; 
	
/**
 * New function for Math
 */
/**
 * Convert the angle to radian
 * 
 * Return the number of radian
 */
Math.degToRad = function(angle) 
{
	return angle*Math.PI/180;
};

var Camel = function(CANVASElementID, Settings, Extensions, numberHolder) 
{
	this.id 		= CANVASElementID;
	this.element	= document.getElementById(this.id);
	this.gl 		= NULL;
	this.context 	= NULL;
	
	this.lastTime	= 0;
	this.clearColor = new Array(3);
	
	this.renderHolder = (numberHolder == UNSET) ? new Array(8) : new Array(numberHolder);
	try 
	{
		this.gl = this.element.getContext(CAMEL_WEBGL, Settings);
		this.gl.engine = this;
		this.context = this.getWGL();
		var lim = Extensions.length;
		for(var i=0; i<lim; i++)
			this.gl.getExtension(Extensions[i]);
	}
	catch(e) 
	{
		Camel.Alert("Could not initialize WebGL. Maybe browser not support WebGL compatible.");
		return FALSE;
	}
};

Camel.prototype.getWidth = function() 
{
	return this.element.width;
};

Camel.prototype.getHeight = function() 
{
	return this.element.height;
};

Camel.prototype.getBrowserWidth = function() 
{
	return window.innerWidth;
};

Camel.prototype.getBrowserHeight = function() 
{
	return window.innerHeight;
};

Camel.prototype.sizeFitBrowser = function() 
{
	this.element.width =  window.innerWidth;
	this.element.height = window.innerHeight;
	this.element.style.width = window.innerWidth+'px';
	this.element.style.height = window.innerHeight+'px';
	return;
};

Camel.prototype.setClearColor = function(r, g, b) 
{
	this.clearColor[0] = r/255;
	this.clearColor[1] = g/255;
	this.clearColor[2] = b/255;
	return this;
}

Camel.prototype.getGLSL = function(ScriptID) 
{
	var c, d, sc, sd;
	sc = document.getElementById(ScriptID);
	if(!sc)
		return NULL;
	c = EMPTY;
	d = sc.firstChild;
	while(d) 
	{
		c += d.textContent;
		d = d.nextSibling;
	}
	if(sc.type == CAMEL_VERTEX) 
	{
		sd = this.gl.createShader(this.gl.VERTEX_SHADER);
	}
	else if(sc.type = CAMEL_FRAGMENT) 
	{
		sd = this.gl.createShader(this.gl.FRAGMENT_SHADER);
	}
	else 
	{
		return NULL;
	}
	this.gl.shaderSource(sd, c);
	this.gl.compileShader(sd);
	if(!this.gl.getShaderParameter(sd, this.gl.COMPILE_STATUS)) 
	{
		Camel.Alert('You have a problem: \n' + this.gl.getShaderInfoLog(sd));
		return NULL;
	}
	return sd;
};

Camel.prototype.buildScene = function(renderer, startCB, updateCB, renderCB, beforeRenderCB) 
{
	var scene = new Camel.Scene(startCB, updateCB, renderCB, beforeRenderCB);
	scene.addRenderer(renderer);
	return scene;
};

Camel.prototype.orderRender = function(renderer) 
{
	if(renderer == UNSET) 
	{
		return false;
	}
	else 
	{
		var lim = this.renderHolder.length;
		for(var i=0; i<lim; i++)
			if(this.renderHolder[i] == UNSET) 
			{
				this.renderHolder[i] = renderer;
				break;
			}
		return renderer; 
	}
};

Camel.prototype.buildRender = function(shaders, constants, startCB) 
{
	if(Array.isArray(shaders) && this.gl) 
	{
		var gl = this.gl, 
			p = gl.createProgram(), 
			s = shaders, 
			c = constants;
		var lim = s.length;
		for(var i=0;i<lim;i++)
			gl.attachShader(p, s[i]);
		gl.linkProgram(p);
		if(!gl.getProgramParameter(p, gl.LINK_STATUS)) 
		{
			Camel.Alert('Could not initialize shader!');
			return NULL;
		}
		else 
		{
			var renderer = new Object();
			renderer.gl = gl;
			renderer.program = p;
			renderer.sceneHolder = new Array(8);
			for(x in c) 
			{
				switch(c[x]) 
				{
					case CAMEL_ATTRIB:
						renderer[x] = gl.getAttribLocation(p, x);
						gl.enableVertexAttribArray(renderer[x]);
						break;
					case CAMEL_UNIFORM:
					default:
						renderer[x] = gl.getUniformLocation(p, x);
						break;
				}
			}
			
			renderer.start = startCB;
			
			renderer.use = function() 
			{
				this.gl.useProgram(this.program);
			};
			
			renderer.orderScene = function(scene) 
			{
				var lim = this.sceneHolder.length;
				for(var i=0; i<lim; i++) 
				{
					if(this.sceneHolder[i] == UNSET) 
					{
						this.sceneHolder[i] = scene;
						break;
					}
				}
			};
			return this.orderRender(renderer);
		}
	}
	else 
	{
		return NULL;
	}
};

Camel.prototype.createVAB = function(vArr) 
{
	var vBuf = this.gl.createBuffer();
	this.gl.bindBuffer(
		this.gl.ARRAY_BUFFER, 
		vBuf
	);
	this.gl.bufferData(
		this.gl.ARRAY_BUFFER, 
		new Float32Array(vArr), 
		this.gl.STATIC_DRAW
	);
	return vBuf;
};

Camel.prototype.createIAB = function(iArr) 
{
	var iBuf = this.gl.createBuffer();
	this.gl.bindBuffer(
		this.gl.ELEMENT_ARRAY_BUFFER, 
		iBuf
	);
	this.gl.bufferData(
		this.gl.ELEMENT_ARRAY_BUFFER, 
		new Uint32Array(iArr), 
		this.gl.STATIC_DRAW
	);
	return iBuf;
};

Camel.prototype.createTexture = function(asset) 
{
	asset.Texture = NULL;
	var t = this.gl.createTexture();
	this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, TRUE);
	this.gl.bindTexture(this.gl.TEXTURE_2D, t);
	this.gl.texImage2D(
		this.gl.TEXTURE_2D, 
		0, 
		this.gl.RGBA, 
		this.gl.RGBA, 
		this.gl.UNSIGNED_BYTE, 
		asset.Asset
	);
	this.gl.texParameteri(
		this.gl.TEXTURE_2D, 
		this.gl.TEXTURE_MAG_FILTER, 
		this.gl.LINEAR
	);
	this.gl.texParameteri(
		this.gl.TEXTURE_2D, 
		this.gl.TEXTURE_MIN_FILTER, 
		this.gl.LINEAR
	);
	this.gl.generateMipmap(this.gl.TEXTURE_2D);
	this.gl.bindTexture(this.gl.TEXTURE_2D, NULL);
	asset.Texture = t;
	return asset;
};

Camel.prototype.createRTT = function(width, height, red, green, blue, alpha) 
{
	var rb = this.gl.createRenderbuffer();
	this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rb);
	this.gl.renderbufferStorage(
		this.gl.RENDERBUFFER, 
		this.gl.DEPTH_COMPONENT16 , 
		width, 
		height
	);

	var rt = this.gl.createTexture();
	this.gl.bindTexture(this.gl.TEXTURE_2D, rt);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	this.gl.texImage2D(
		this.gl.TEXTURE_2D, 
		0, 
		this.gl.RGBA, 
		width, 
		height, 
		0, 
		this.gl.RGBA, 
		this.gl.UNSIGNED_BYTE, 
		NULL
	);

	var fbuff = this.gl.createFramebuffer();
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbuff);
	this.gl.framebufferTexture2D(
		this.gl.FRAMEBUFFER, 
		this.gl.COLOR_ATTACHMENT0, 
		this.gl.TEXTURE_2D, 
		rt, 
		0
	);
	this.gl.framebufferRenderbuffer(
		this.gl.FRAMEBUFFER, 
		this.gl.DEPTH_ATTACHMENT, 
		this.gl.RENDERBUFFER, 
		rb
	);
	fbuff.RTTW = width;
	fbuff.RTTH = height;
	fbuff.clearColor = {
		red: red, 
		green : green, 
		blue : blue, 
		alpha : alpha
	};
	fbuff.Texture = rt;

	this.gl.bindTexture(this.gl.TEXTURE_2D, NULL);
	this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, NULL);
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, NULL);

	return fbuff;
};

Camel.prototype.openRTT = function(frameBuffer) 
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
	this.gl.clearColor(
		frameBuffer.clearColor.red, 
		frameBuffer.clearColor.green, 
		frameBuffer.clearColor.blue, 
		frameBuffer.clearColor.alpha
	);
	this.gl.viewport(
		0.0, 
		0.0, 
		frameBuffer.RTTW, 
		frameBuffer.RTTH
	);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	return;
};

Camel.prototype.closeRTT = function() 
{
	this.gl.flush();
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, NULL);
	return;
};

Camel.prototype.getWGL = function() 
{
	return this.getContext();
};

Camel.prototype.getContext = function() 
{
	return this.gl;
};

Camel.prototype.buildBefore = function(beforeCB) 
{
	this.gl.enable(this.gl.DEPTH_TEST);
	this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
	this.gl.depthFunc(this.gl.LEQUAL);
	this.gl.clearDepth(1.0);

	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	this.gl.frontFace(this.gl.CCW);
	
	this.beforeCycle = beforeCB;
};

Camel.prototype.cycle = function(time) 
{
	var dt = time - this.lastTime;
	this.lastTime = time;
	var lim = this.renderHolder.length;
	for(var i=0; i<lim; i++) 
	{
		if(this.renderHolder[i] == UNSET) 
			break;
			
		var limscn = this.renderHolder[i].sceneHolder.length;
		for(var j=0; j<limscn; j++) 
		{
			if(this.renderHolder[i].sceneHolder[j] != UNSET) 
			{
				this.renderHolder[i].sceneHolder[j].update(dt);
			}
		}

		if(i == 0) 
		{
			if(this.beforeCycle != UNSET)
				this.beforeCycle();

			this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0);
			this.gl.viewport(0.0, 0.0, this.getWidth(), this.getHeight());
			this.gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		}
		
		for(var j=0; j<limscn; j++) 
		{
			if(this.renderHolder[i].sceneHolder[j] != UNSET) 
			{
				if(this.renderHolder[i].sceneHolder[j].visible 
				&& this.renderHolder[i].sceneHolder[j].render != NULL 
				&& !this.renderHolder[i].sceneHolder[j].disable) 
				{
					this.renderHolder[i].start();
					this.renderHolder[i].sceneHolder[j].render(this.renderHolder[i]);
				}
			}
		}
		
		if(i == 0)
		{
			this.gl.flush();
		}
	}
}

Camel.Alert = function(param) 
{
	alert(param);
	return param;
};

Camel.Log = function(param) 
{
	console.log(param);
	return param;
};

/**________________________________________________________________________
 * 
 * The Vec2 of Camel
 */
Camel.Vec2 = function(x, y) 
{
	this.vec = new Float32Array(2);
	this.vec[0] = x;
	this.vec[1] = y;
};
Camel.Vec2.prototype.loadFloat = function() 
{
	return this.vec;
}

/**________________________________________________________________________
 * 
 * The Vec3 of Camel
 */
Camel.Vec3 = function(x, y, z) 
{
	this.vec = new Float32Array(3);
	this.vec[0] = x;
	this.vec[1] = y;
	this.vec[2] = z;
};
Camel.Vec3.prototype.loadFloat = function() 
{
	return this.vec;
}

/**________________________________________________________________________
 * 
 * The Vec4 of Camel
 */
Camel.Vec4 = function(x, y, z, w) 
{
	this.vec = new Float32Array(4);
	this.vec[0] = x;
	this.vec[1] = y;
	this.vec[2] = z;
	this.vec[3] = w;
};
Camel.Vec4.prototype.loadFloat = function() 
{
	return this.vec;
}

/**________________________________________________________________________
 * 
 * The Mx44 of Camel
 */
Camel.Mx44 = function() 
{
	this.mx = new Float32Array(16);	
};
Camel.Mx44.prototype.loadMXFloat = function() 
{
	return this.mx;
};
Camel.Mx44.prototype.identity = function(m) 
{
	if(m != undefined)
	{
		m = new Float32Array(16);
		m[0]=1.0;	m[1]=0.0; m[2]=0.0; m[3]=0.0;
		m[4]=0.0;	m[5]=1.0; m[6]=0.0; m[7]=0.0;
		m[8]=0.0;	m[9]=0.0; m[10]=1.0; m[11]=0.0;
		m[12]=0.0; m[13]=0.0; m[14]=0.0; m[15]=1.0;
		return m;
	}
	else 
	{
		this.mx[0]=1.0;	this.mx[1]=0.0; this.mx[2]=0.0; this.mx[3]=0.0;
		this.mx[4]=0.0;	this.mx[5]=1.0; this.mx[6]=0.0; this.mx[7]=0.0;
		this.mx[8]=0.0;	this.mx[9]=0.0; this.mx[10]=1.0; this.mx[11]=0.0;
		this.mx[12]=0.0; this.mx[13]=0.0; this.mx[14]=0.0; this.mx[15]=1.0;
		return this;
	}
};

/**________________________________________________________________________
 * 
 * The Perspective of Camel
 */
Camel.Perspective = function(angle, aspect, near, far)
{
	this.mx = new Float32Array(16);
	this.initialize(angle, aspect, near, far);
};
Camel.Perspective.prototype.loadMXFloat = function() 
{
	return this.mx;
};
Camel.Perspective.prototype.initialize = function(angle, aspect, near, far) 
{
	return this.integrate(angle, aspect, near, far);
};
Camel.Perspective.prototype.set = function(angle, aspect, near, far) 
{
	return this.integrate(angle, aspect, near, far);
};
Camel.Perspective.prototype.integrate = function(angle, aspect, near, far) 
{
	var tan = Math.tan(Math.degToRad(0.5*angle)) , 
		A = -(far+near)/(far-near) , 
		B = (-2*far*near)/(far-near);
	for(var i=0;i<16;i++)
		if(i==0) this.mx[i] = 0.5/tan;
		else if(i==5) this.mx[i] = 0.5*aspect/tan;	
		else if(i==10) this.mx[i] = A;	
		else if(i==11) this.mx[i] = -1;
		else if(i==14) this.mx[i] = B;
		else this.mx[i] = 0.0;
	return this;
};

/**________________________________________________________________________
 * 
 * The Camera of Camel
 */
Camel.Camera = function(eye, look, up) 
{
	this.eye = eye.loadFloat();		//: Camel::Vec3
	this.look = look.loadFloat();	//: Camel::Vec3 
	this.up = up.loadFloat(); 		//: Camel::Vec3
	this.mx = new Float32Array(16);
	this.integrate();
}; 
Camel.Camera.prototype.loadMXFloat = function() 
{
	return this.mx;
};
Camel.Camera.prototype.identity = function() 
{
	this.mx[0]=1.0;	this.mx[1]=0.0; this.mx[2]=0.0; this.mx[3]=0.0;
	this.mx[4]=0.0;	this.mx[5]=1.0; this.mx[6]=0.0; this.mx[7]=0.0;
	this.mx[8]=0.0;	this.mx[9]=0.0; this.mx[10]=1.0; this.mx[11]=0.0;
	this.mx[12]=0.0; this.mx[13]=0.0; this.mx[14]=0.0; this.mx[15]=1.0;
	return this;
};
Camel.Camera.prototype.integrate = function() 
{
	var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
	eyex = this.eye[0],eyey = this.eye[1],eyez = this.eye[2],
	upx = this.up[0],upy = this.up[1],upz = this.up[2],
	lookx = this.look[0],looky = this.look[1],lookz = this.look[2];

	if (Math.abs(eyex - lookx) < CAMEL_MATH_EPSILON &&
		Math.abs(eyey - looky) < CAMEL_MATH_EPSILON &&
		Math.abs(eyez - lookz) < CAMEL_MATH_EPSILON) {
		return this.identity().loadFloat();
	}

	z0 = eyex - lookx;
	z1 = eyey - looky;
	z2 = eyez - lookz;

	len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	z0 *= len;
	z1 *= len;
	z2 *= len;

	x0 = upy * z2 - upz * z1;
	x1 = upz * z0 - upx * z2;
	x2 = upx * z1 - upy * z0;
	len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	if (!len) {
		x0 = 0;
		x1 = 0;
		x2 = 0;
	} else {
		len = 1 / len;
		x0 *= len;
		x1 *= len;
		x2 *= len;
	}

	y0 = z1 * x2 - z2 * x1;
	y1 = z2 * x0 - z0 * x2;
	y2 = z0 * x1 - z1 * x0;

	len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	if (!len) {
		y0 = 0;
		y1 = 0;
		y2 = 0;
	} else {
		len = 1 / len;
		y0 *= len;
		y1 *= len;
		y2 *= len;
	}

	this.mx[0] = x0;
	this.mx[1] = y0;
	this.mx[2] = z0;
	this.mx[3] = 0;
	this.mx[4] = x1;
	this.mx[5] = y1;
	this.mx[6] = z1;
	this.mx[7] = 0;
	this.mx[8] = x2;
	this.mx[9] = y2;
	this.mx[10] = z2;
	this.mx[11] = 0;
	this.mx[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	this.mx[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	this.mx[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	this.mx[15] = 1;

	return this;
};

Camel.mx4 = { 
	/**
	 * Create the new Matrix4x4.
	 * 
	 * Return the new matrix4x4
	 */
	create : function() 
	{
		return [1, 0, 0, 0, 
				0, 1, 0, 0, 
				0, 0, 1, 0, 
				0, 0, 0, 1];
	},
	
	/**
	 * Create the new Projection Matrix4x4
	 * 
	 * Return the new matrix of projection
	 */
	perspective : function(angle, a, zMin, zMax) 
	{
		var tan=Math.tan(Math.degToRad(0.5*angle)),
			A=-(zMax+zMin)/(zMax-zMin),
			B=(-2*zMax*zMin)/(zMax-zMin);

	    return [
			0.5/tan,0 ,			0, 0,
			0, 		0.5*a/tan,	0, 0,
			0, 		0,         	A, -1,
			0,		0,			B, 0
	    ];
	}, 
	lookAt : function (out, eye, at, up) {
	    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
	        eyex = eye[0],
	        eyey = eye[1],
	        eyez = eye[2],
	        upx = up[0],
	        upy = up[1],
	        upz = up[2],
	        atx = at[0],
	        aty = at[1],
	        atz = at[2];

	    if (Math.abs(eyex - atx) < CAMEL_MATH_EPSILON &&
	        Math.abs(eyey - aty) < CAMEL_MATH_EPSILON &&
	        Math.abs(eyez - atz) < CAMEL_MATH_EPSILON) {
	        return Camel.mx4.identity(out);
	    }

	    z0 = eyex - atx;
	    z1 = eyey - aty;
	    z2 = eyez - atz;

	    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	    z0 *= len;
	    z1 *= len;
	    z2 *= len;

	    x0 = upy * z2 - upz * z1;
	    x1 = upz * z0 - upx * z2;
	    x2 = upx * z1 - upy * z0;
	    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	    if (!len) {
	        x0 = 0;
	        x1 = 0;
	        x2 = 0;
	    } else {
	        len = 1 / len;
	        x0 *= len;
	        x1 *= len;
	        x2 *= len;
	    }

	    y0 = z1 * x2 - z2 * x1;
	    y1 = z2 * x0 - z0 * x2;
	    y2 = z0 * x1 - z1 * x0;

	    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	    if (!len) {
	        y0 = 0;
	        y1 = 0;
	        y2 = 0;
	    } else {
	        len = 1 / len;
	        y0 *= len;
	        y1 *= len;
	        y2 *= len;
	    }

	    out[0] = x0;
	    out[1] = y0;
	    out[2] = z0;
	    out[3] = 0;
	    out[4] = x1;
	    out[5] = y1;
	    out[6] = z1;
	    out[7] = 0;
	    out[8] = x2;
	    out[9] = y2;
	    out[10] = z2;
	    out[11] = 0;
	    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	    out[15] = 1;

	    return out;
	},
	
	reset : function(m) 
	{
		m[0]=1, m[1]=0, m[2]=0, m[3]=0,
		m[4]=0, m[5]=1, m[6]=0, m[7]=0,
		m[8]=0, m[9]=0, m[10]=1, m[11]=0,
		m[12]=0, m[13]=0, m[14]=0, m[15]=1;
	}, 
	
	identity : function(m) 
	{
		if(m != undefined)
			var m = new Array(16);
		m[0]=1, m[1]=0, m[2]=0, m[3]=0,
		m[4]=0, m[5]=1, m[6]=0, m[7]=0,
		m[8]=0, m[9]=0, m[10]=1, m[11]=0,
		m[12]=0, m[13]=0, m[14]=0, m[15]=1;
		return m;
	}, 
	
	rotateX: function(m, angle) 
	{
		var c=Math.cos(angle);
		var s=Math.sin(angle);
		var mv1=m[1], mv5=m[5], mv9=m[9];
		m[1]=m[1]*c-m[2]*s;
		m[5]=m[5]*c-m[6]*s;
		m[9]=m[9]*c-m[10]*s;

		m[2]=m[2]*c+mv1*s;
		m[6]=m[6]*c+mv5*s;
		m[10]=m[10]*c+mv9*s;
	},
	rotateY: function(m, angle) 
	{
		var c=Math.cos(angle);
		var s=Math.sin(angle);
		var mv0=m[0], mv4=m[4], mv8=m[8];
		m[0]=c*m[0]+s*m[2];
		m[4]=c*m[4]+s*m[6];
		m[8]=c*m[8]+s*m[10];

		m[2]=c*m[2]-s*mv0;
		m[6]=c*m[6]-s*mv4;
		m[10]=c*m[10]-s*mv8;
	},

	rotateZ: function(m, angle) 
	{
		var c=Math.cos(angle);
		var s=Math.sin(angle);
		var mv0=m[0], mv4=m[4], mv8=m[8];
		m[0]=c*m[0]-s*m[1];
		m[4]=c*m[4]-s*m[5];
		m[8]=c*m[8]-s*m[9];

		m[1]=c*m[1]+s*mv0;
		m[5]=c*m[5]+s*mv4;
		m[9]=c*m[9]+s*mv8;
	},
	
	translateZ: function(m, t) 
	{
		m[14]+=t;
	},
	 
	translateY: function(m, t){
		m[13]+=t;
	},
	 
	translateX: function(m, t){
		m[12]+=t;
	}
};

Camel.GetHttpRequest = function() 
{
	this._suc = NULL;
	this._err = NULL;
	this._xhr = NULL;
	this._m = 'GET';
};

Camel.GetHttpRequest.prototype.addEventListener = function(e, callback, t) 
{
	switch(e) 
	{
		case 'error':
			this._err = callback;
			break;
		case 'ready':
		default:
			this._suc = callback;
			break;
	}
	return;
};

Camel.GetHttpRequest.prototype.getXHR = function() 
{
	return this._xhr;
};

Camel.GetHttpRequest.prototype.Url = function(URLRequest) 
{
	var ent = this;
	this._xhr = new XMLHttpRequest();
	this._xhr.open(this._m, URLRequest, TRUE);
	this._xhr.onreadystatechange = function() 
	{
		if(this.readyState == 4 && this.status == 200) 
		{
			ent._suc(this);
		}
		else if(this.status == 404) 
		{
			ent._err(this);
		}
	}
	this._xhr.send();
	return;
};

Camel.AssetManager = function(ImageExt, SoundExt, XhttpExt, VideoExt) {
	this.QueueType = [
		ImageExt, 
		SoundExt,
		XhttpExt,
		VideoExt, 
	];
	this.errorCount = 0;
	this.successCount = 0;
	this.AssetList = new Array();
};

Camel.AssetManager.prototype.getErrorNumber = function() 
{
	return this.errorCount;
};

Camel.AssetManager.prototype.getSuccessNumber = function() 
{
	return this.successCount;
};

Camel.AssetManager.prototype.getAssetList = function() 
{
	return this.AssetList;
};

Camel.AssetManager.prototype.isComplete = function() 
{
	return this.AssetList.length == (this.errorCount+this.successCount);
};

Camel.AssetManager.prototype.getProgress = function() 
{
	return (this.errorCount+this.successCount)*100/this.AssetList.length;
};

Camel.AssetManager.prototype.getType = function(Path) 
{
	var ExtensionRegular = /(?:\.([^.]+))?$/;
	var ExtensionStr = ExtensionRegular.exec(Path)[1];
	var Extension = 0;
	for(var i=0;i<this.QueueType.length;i++) {
		if(this.QueueType[i].indexOf(ExtensionStr) != -1) {
			Extension = i;
			break;
		}
	}
	return Extension;
};

Camel.AssetManager.prototype.isQueued = function(Path) 
{
	var lim = this.AssetList.length;
	for(var i=0; i<lim; i++) {
		if(this.AssetList[i].Path == Path) {
			return i;
		}
	}
	return -1;
};

Camel.AssetManager.prototype.QueueFile = function(Path) 
{
	var isQueued = this.isQueued(Path);
	if(isQueued != -1)
		return;
	var FilePoint;
	var Type = this.getType(Path);
	switch(Type) {
		case CAMEL_QUEUE_IMAGE:
			FilePoint = new Image();
			break;
		case CAMEL_QUEUE_VIDEO:
			FilePoint = document.createElement("video");
			FilePoint.autoplay = TRUE;
			break;
		case CAMEL_QUEUE_SOUND:
			FilePoint = new Audio();
			break;
		case CAMEL_QUEUE_XHTTP:
			FilePoint = new Camel.GetHttpRequest();
			break;
		default:
			break;
	}
	this.AssetList.push({Path:Path, Asset:FilePoint, Type:Type, Ready:false});
	return;
};

Camel.AssetManager.prototype.QueueDownloadFile = function(Index, Type) 
{		
	var File = this.AssetList[Index];
	var Manager = this;
	var ErrorEventFlag = "error";
	if(Type == CAMEL_QUEUE_SOUND 
	|| Type == CAMEL_QUEUE_VIDEO)
		var CompleteEventFlag = "canplaythrough";
	else if(Type == CAMEL_QUEUE_IMAGE) 
		var CompleteEventFlag = "load";
	else 
		var CompleteEventFlag = "ready";
	// Tracking Success State
	File.Asset.addEventListener(CompleteEventFlag, function() 
	{
		File.Ready = true;
		Manager.successCount += 1;
	}, false);
	// Tracking Failure State
	File.Asset.addEventListener(ErrorEventFlag, function() 
	{
		File.Ready = false;
		Manager.errorCount += 1;
	}, false);
	if(typeof(File.Asset.src) != 'undefined')
	{			
		File.Asset.src = File.Path;
	}
	else
	{
		File.Asset.Url(File.Path);
	}
	return;
};

Camel.AssetManager.prototype.QueueDownloadAll = function() 
{
	var lim = this.AssetList.length;
	for(var i=0; i<lim; i++) 
	{
		this.QueueDownloadFile(i, this.AssetList[i].Type);
	}
	return;
};

Camel.AssetManager.prototype.getAsset = function(Path) 
{
	var Index = this.isQueued(Path);
	if(Index != -1) 
		return this.AssetList[Index];
	else 
	{
		this.QueueFile(Path);
		var Type = this.getType(Path);
		this.QueueDownloadFile(this.AssetList.length-1, Type);
		return this.getAsset(Path);
	}
};

Camel.Scene = function(startCB, updateCB, renderCB, beforeRenderCB) 
{
	this.visible	= true;
	this.disable	= false;
	this.particleHolder = new Array(32);
	this.start = startCB;
	this.update	= updateCB;
	this.render	= renderCB;
	this.beforeRender = beforeRenderCB;
};

Camel.Scene.prototype.Enable = function() 
{
	this.disable = false;
};

Camel.Scene.prototype.Disable = function() 
{
	this.disable = true;
};

Camel.Scene.prototype.addRenderer = function(renderer) 
{
	renderer.orderScene(this);
	return this;
};

Camel.Scene.prototype.pass = function(renderer) 
{
	if(this.visible && this.render != NULL && !this.disable) 
	{
		renderer.start();
		this.render(renderer);
	}
};

Camel.Transform = function() 
{
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	
	this.angleX = 0.0;
	this.angleY = 0.0;
	this.angleZ = 0.0;
	
	this.scaleX = 1.0;
	this.scaleY = 1.0;
	this.scaleZ = 1.0;
};

Camel.Light = function() 
{
	this.__proto__ = new Camel.Transform();	
};

Camel.PointLight = function() 
{
	this.__proto__ = new Camel.Light();
};

Camel.DirectLight = function() 
{
	this.__proto__ = new Camel.Light();
};

Camel.Material = function() 
{
	this.alpha = 1.0;
	this.map = {
		diffuse : NULL, 
		ambient : NULL, 
		specular : NULL, 
	};
	this.color = {
		diffuse : {r:128, g:128, b:128}, 
		ambient : {r:128, g:128, b:128}, 
		specular : {r:128, g:128, b:128}, 
	};
};

Camel.Geometry = function() 
{
	this.vertices = NULL;
	this.indices = NULL;
};

Camel.Particle = function() 
{
	this.__proto__ = new Camel.Transform();
	this.__proto__.__proto__ = new Camel.Material();
	this.__proto__.__proto__.__proto__ = new Camel.Geometry();
};