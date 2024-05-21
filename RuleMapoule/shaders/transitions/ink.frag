#define SPEED 10.0
#define MAX_DIST 1.0
#define CELLS 10.0

uniform float progression;
 
float sqrLen(vec2 vec)
{
	return vec.x * vec.x + vec.y * vec.y  ;  
}

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}


vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

//noise from iq
float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
	vec2 rg = snoise(x.xy)+1;//texture( iChannel0, (uv+0.5)/256.0, -100.0 ).yx;
	return mix( rg.x, rg.y, f.z );
}

float mapToRange(float fromMin, float fromMax, float toMin, float toMax, float val)
{
    val = max(fromMin, (min(fromMax, val)));//clamp in range if outside
    float fromSize = fromMax - fromMin;
    val = (val - fromMin) / fromSize;
    return mix(toMin, toMax, val);
}

vec2 pixelToNormalizedspace(vec2 pixel)
{
    vec2 res;
    res.x = pixel.x * 2.0 / iResolution.x - 1.0;
    res.y = pixel.y * 2.0 / iResolution.y - 1.0;
    res.y *= iResolution.y / iResolution.x;//correct aspect ratio
    return res;
}

float opUnion(float d1, float d2)
{
 	return min(d1, d2);  
}

float opMinus(float d1, float d2)
{
 	return max(-d1, d2);
}

float opIntersect(float d1, float d2)
{
 	return max(d1, d2);
}

float circle(vec2 diff, float radius)
{
    return length(diff) - radius;
}

float line(vec2 diff, vec2 dir, float thickness)
{
    vec2 proj = dot(diff, dir) * dir;
    vec2 perp = diff - proj;
    return length(perp) - thickness;
}

float signedDist2D(vec2 pos)
{
	float dist = MAX_DIST;
    for (int i = 0; i < int(CELLS); ++i)
    {
        
        dist = opUnion(dist, circle(random2(vec2(i)), 1.0 / (CELLS * 2.0)));
    }

    return dist;
}

float FX0(float val, float noise)
{    
    noise 		= pow(noise, 6.0);
    float time 	= iTime * 2.0 + 0.1;
    float str 	= max(0.0, (val * time));
    float str2 	= pow(str, 10.0) ;
    str 		= str2 * noise;
    
    return str;
}

float FX1(float val, float noise, float expansion, float time)
{
    
    noise 		= pow(noise, 6.0);
    
    val 		= val * expansion * 0.5;
    float str 	= (1.0 + val * time);
    float str2 	= pow(str, 20.0) ;
    str 		= mapToRange(0.3, 1.0, 0.0, 1.0, str2 * noise) ;  
    
    return str;
}

float FX2(float val, float noise, float expansion, float time)
{    
    noise 		= pow(noise, 6.0);
    
    val 		= val * (expansion);
    float str 	= (1.0 + val * time) * (expansion);
    float str2 	= pow(str, 20.0) ;
    str 		= str2 * noise;
    str 		= mapToRange(0.2, 1.0, 0.0, 1.0, str);
    
    return str;
}

float FX3(float val, float noise, float expansion, float time)
{    
    val = clamp(val, 0.0, 1.0);
    float str 	= mapToRange(0.3, 1.0, 0.0, 1.0, FX2(val, noise, expansion, time)) * expansion;
    float ins 	= FX2(val * pow(expansion - 0.5, 1.0), noise, expansion, time) * expansion;
    ins 		= mapToRange(0.0, 20.0, 0.0, 1.0, ins);
    str 		+= ins;
    
    return str;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float time 	= progression*30;
    vec2 fragPos 		= pixelToNormalizedspace(fragCoord.xy);
	vec3 pos 		= vec3(fragPos, time * 0.00001 * SPEED);
    
    //noise sampling
    vec3 scaledPos 	= 8.0 * pos;
    float noiseVal 	= 0.0;
    float ampl 		= 1.0;
    float maxValue 	= 0.0;
    
    for(float i = 0.0; i < 8.0; ++i)
    {
        noiseVal 	+= noise(scaledPos) * ampl;
        scaledPos 	*= 2.0;
        maxValue 	+= ampl;
        ampl 		*= 0.5;
    }
    noiseVal /= maxValue;
    vec2 startPoint = vec2(0.0, 0.0);

    float expansion = sqrLen(fragPos - startPoint);
    expansion 		= 1.0 - expansion;
    expansion 		+= time * time * SPEED  * 0.0005 - 0.6;    
    expansion 		= min(expansion, MAX_DIST);
    

    float res = FX3(-signedDist2D(fragPos), noiseVal, expansion, time);

    res = clamp(res, 0.0, 1.0);
    
    vec4 ca = texture(iChannel0, fragCoord / iResolution.xy);
    vec4 cb = texture(iChannel1, fragCoord / iResolution.xy);

    fragColor = mix(ca, cb, res);
}