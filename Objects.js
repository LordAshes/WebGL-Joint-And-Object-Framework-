var Current;
var ObjectList = [];
var ObjectListCount = 0;

var ObjectType = function(Name,ObjParent)
{
	this.Name=Name;
	this.parent=ObjParent;
	if(ObjParent!="World"){this.path=ObjParent.path+"|"+Name;}else{this.path=Name;}
	this.children={};
	this.contents={};
	this.x=0;
	this.y=0;
	this.z=0;
	this.rx=0;
	this.ry=0;
	this.rz=0;
	
	this.Join = function(name)
	{
	  this.children[name]= new ObjectType(name,this);
	  Current=this.children[name];
	  return name;
	}

	this.Snap = function(name)
	{
		if(this.children[key]==undefined)
		{
			return undefined;
		}
		delete this.children[key];
		Current=this;
		return key;
	}

	this.Child = function(key)
	{
		Current=this.children[key];
		return this.children[key];	   
	}
	
	this.Parent = function()
	{
		Current=Current.parent;
		return Current.parent;	   
	}

	this.Path = function()
	{
		return this.path;	   
	}
	
	this.Find = function(key)
	{
		// Search Children
		for(var JoinedChild in this.children)
		{
			if(JoinedChild==key)
			{
				Current = this.Child(JoinedChild);
				return this.Child(JoinedChild);
			}
		}
		
		// Search Children's Children
		var temp;
		for(var JoinedChild in this.children)
		{
			temp = this.Child(JoinedChild).Find(key);
			if(temp!=""){return temp;}
		}

		return "";
			
	}
	
	this.List = function(recursive)
	{
		if(recursive==undefined)
		{
			delete ObjectList;
			ObjectListCount = 0;
		}

		// Search Children
		for(var JoinedChild in this.children)
		{
			ObjectList[ObjectListCount++]=JoinedChild;
		}
		
		// Search Children's Children
		var temp;
		for(var JoinedChild in this.children)
		{
			this.Child(JoinedChild).List(1);
		}
		
		return ObjectList;		
	}
	
	this.Content = function(key,item)
	{
	  if(item!=undefined)
	  {
	    if(key=="Vertices")
		{
			this.contents['VertexPosBuffer'] = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.contents['VertexPosBuffer']);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(item), gl.STATIC_DRAW);
		}
		else if(key=="TextureCoords")
		{
			this.contents['VertexTexturePosBuffer'] = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.contents['VertexTexturePosBuffer']);		
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(item), gl.STATIC_DRAW);
		}
		else if(key=="VertexIndices")
		{
			this.contents['VertexIndicesBuffer'] = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.contents['VertexIndicesBuffer']);        
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(item), gl.STATIC_DRAW);
			this.contents['VertexIndices.Count']=item.length;
		}
		else if(key.substr(0,8)=="Texture:")
		{
			var texture = gl.createTexture();
			texture.image = new Image();
			texture.image.onload = function ()
			{
				handleLoadedTexture(texture)
				Objects.Content(key.replace("Texture:","Texture-"),texture);
			}
			texture.image.src = item;
		}
		else
		{
			this.contents[key]=item;
		}
	  }
	  Current=this;
	  return this.contents[key];
	}
	
	this.Remove = function(key)
	{
		if(this.contents[key]==undefined)
		{
			return undefined;
		}
		delete this.contents[key];
		Current=this;
		return key;
	}
		
	this.Draw = function()
	{
	
        // alert("Drawing Object "+this.Name+" At Position ("+this.x+","+this.y+","+this.z+") Rotated ("+this.rx+","+this.ry+","+this.rz+") With "+this.contents['VertexIndices'].length+" Indices");
					
        mat4.translate(mvMatrix, [this.x, this.y, this.z]);

        mat4.rotate(mvMatrix, degToRad(this.rx), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(this.ry), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(this.rz), [0, 0, 1]);
		
		if((this.contents['Visible']!=false)&&(this.contents['Visible']!="Children"))
		{
			var WorkObj;
			if(this.contents['Clone']==undefined)
			{
				WorkObj = this;
			}
			else
			{
				var temp = this.contents['Clone'];
				WorkObj = Objects;
				while(temp.indexOf(".")>=0)
				{
					WorkObj = WorkObj.Child(temp.substring(0,temp.indexOf(".")));
					temp = temp.substring(temp.indexOf(".")+1);
				}
				if(temp!=""){WorkObj = WorkObj.Child(temp);}
			}
			
			if(WorkObj.contents['VertexPosBuffer']!=undefined)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, WorkObj.contents['VertexPosBuffer']);
				gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		
				gl.bindBuffer(gl.ARRAY_BUFFER, WorkObj.contents['VertexTexturePosBuffer']);
				gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
		
				gl.activeTexture(gl.TEXTURE0);
				if(this.contents['Texture']==undefined)
				{
					gl.bindTexture(gl.TEXTURE_2D, Objects.Content("Texture-"+WorkObj.contents['Texture']));
				}
				else
				{
					gl.bindTexture(gl.TEXTURE_2D, Objects.Content("Texture-"+this.contents['Texture']));
				}
				gl.uniform1i(shaderProgram.samplerUniform, 0);
	
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, WorkObj.contents['VertexIndicesBuffer']);
		
				setMatrixUniforms();
	
				gl.drawElements(gl.TRIANGLES, WorkObj.contents['VertexIndices.Count'], gl.UNSIGNED_SHORT, 0);
			}
		}
		
		if((this.contents['Visible']!=false)||(this.contents['Visible']=="Children"))
		{
		
			for(var JoinedChild in this.children)
			{
				mvPushMatrix();
				this.children[JoinedChild].Draw();
				mvPopMatrix();
			}
		}
	
	}
	
	this.Position = function(x,y,z)
	{
		if((x=="x")||(x=="X"))
		{
			// Delta X
			this.x=this.x+y;
		}
		else if((x=="y")||(x=="Y"))
		{
			// Delta Y
			this.y=this.y+y;
		}
		else if((x=="z")||(x=="Z"))
		{
			// Delta Z
			this.z=this.z+y;
		}
		else
		{
			// Absolute Position (With Respect To Joint)
			this.x=x;
			this.y=y;
			this.z=z;
		}
		return [this.x,this.y,this.z];
	}

	this.Angle = function(x,y,z)
	{
		if((x=="x")||(x=="X"))
		{
			// Delta X
			this.rx=this.rx+y;
		}
		else if((x=="y")||(x=="Y"))
		{
			// Delta Y
			this.ry=this.ry+y;
		}
		else if((x=="z")||(x=="Z"))
		{
			// Delta Z
			this.rz=this.rz+y;
		}
		else
		{
			// Absolute Position (With Respect To Joint)
			this.rx=x;
			this.ry=y;
			this.rz=z;
		}
		return [this.rx,this.ry,this.rz];
	}
			
}

var Objects = new ObjectType("Objects","World");