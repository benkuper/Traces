uniform float progression;
uniform vec4 burnColor = vec4(1.0,1.0,1.0,1.0);

float Hash( vec2 p)
{
	vec3 p2 = vec3(p.xy,1.0);
    return fract(sin(dot(p2,vec3(37.1,61.7, 12.4)))*3758.5453123);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
	vec2 f = fract(p);
	f *= f * (3.0-2.0*f);

    return mix(mix(Hash(i + vec2(0.,0.)), Hash(i + vec2(1.,0.)),f.x),
		mix(Hash(i + vec2(0.,1.)), Hash(i + vec2(1.,1.)),f.x),
		f.y);
}

float fbm(vec2 p) 
{
	float v = 0.0;
	v += noise(p*1.)*.5;
	v += noise(p*2.)*.25;
	v += noise(p*4.)*.125;
	return v;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy/iResolution.xy;
	
	vec4 src = texture(iChannel0, uv);
	vec4 tgt = texture(iChannel1, uv);
	vec4 col = src;
	
	uv.x -= 1.5;
	
    float p = progression*3;
	if(p < 0.01)
	{
		fragColor = src;
		return;
	}
	
	vec4 burn = vec4(burnColor.r, burnColor.g, burnColor.b,burnColor.a*tgt.a);
	// burn
	float d = uv.x+uv.y*0.5 + 0.5*fbm(uv*15.1) + p*1.3;
	if (d >0.35) col = clamp(col-(d-0.35)*10.,0.0,1.0);
	if (d >0.47) {
		if (d < 0.5 ) col += (d-0.4)*33.0*0.5*(0.0+noise(100.*uv+vec2(-p*2.0,0.)))*burn ;
		else col = tgt; }
	
	fragColor = col;
}