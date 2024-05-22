// License CC0: Hex tile transition effect
//  Result after playing around with transition effects

#define HEXTILE_SIZE size
#define RANDOMNESS random

#define PI 3.141592654
#define TAU (2.*PI)
#define RESOLUTION iResolution
#define TIME progression
#define PERIOD 1.

uniform float progression=0.;
uniform float size=.125;
uniform float random=.07;

float hash(vec2 co){
    return fract(sin(dot(co,vec2(12.9898,58.233)))*13758.5453);
}

float tanh_approx(float x){
    //  return tanh(x);
    float x2=x*x;
    return clamp(x*(27.+x2)/(27.+9.*x2),-1.,1.);
}

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 hsv2rgb(vec3 c){
    const vec4 K=vec4(1.,2./3.,1./3.,3.);
    vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);
    return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);
}

// http://mercury.sexy/hg_sdf/
vec2 mod2(inout vec2 p,vec2 size){
    vec2 c=floor((p+size*.5)/size);
    p=mod(p+size*.5,size)-size*.5;
    return c;
}

// IQ's hex
float hex(vec2 p,float r){
    p.xy=p.yx;
    const vec3 k=vec3(-sqrt(3./4.),1./2.,1./sqrt(3.));
    p=abs(p);
    p-=2.*min(dot(k.xy,p),0.)*k.xy;
    p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);
    return length(p)*sign(p.y);
}

// See Art of Code: Hexagonal Tiling Explained!
// https://www.youtube.com/watch?v=VmrIDyYiJBA
vec2 hextile(inout vec2 p){
    const vec2 sz=vec2(1.,sqrt(3.));
    const vec2 hsz=.5*sz;
    
    vec2 p1=mod(p,sz)-hsz;
    vec2 p2=mod(p-hsz,sz)-hsz;
    vec2 p3=dot(p1,p1)<dot(p2,p2)?p1:p2;
    vec2 n=((p3-p+hsz)/sz);
    p=p3;
    
    n-=vec2(.5);
    // Rounding to make hextile 0,0 well behaved
    return round(n*2.)/2.;
}

// IQ's polynominal soft min
float pmin(float a,float b,float k){
    float h=clamp(.5+.5*(b-a)/k,0.,1.);
    return mix(b,a,h)-k*h*(1.-h);
}

float pmax(float a,float b,float k){
    return-pmin(-a,-b,k);
}



vec4 hexTransition(vec2 p,float aa,vec4 from,vec4 to,float m){
    m=clamp(m,0.,1.);
    const float hz=HEXTILE_SIZE;
    const float rz=RANDOMNESS;
    vec2 hp=p;
    hp/=hz;
    //  hp *= ROT(0.5*(1.0-m));
    vec2 hn=hextile(hp)*hz*-vec2(-1.,sqrt(3.));
    float r=hash(hn+123.4);
    
    const float off=3.;
    float fi=smoothstep(0.,.1,m);
    float fo=smoothstep(.9,1.,m);
    
    float sz=.45*(.5+.5*tanh_approx(((rz*r+hn.x+hn.y-off+m*off*2.))*2.));
    float hd=(hex(hp,sz)-.1*sz)*hz;
    
    float mm=smoothstep(-aa,aa,-hd);
    mm=mix(0.,mm,fi);
    mm=mix(mm,1.,fo);
    
    vec4 col=mix(from,to,mm);
    vec2 ahn=abs(hn);
    return col;
}

vec4 postProcess(vec4 col,vec2 q){
    col=pow(clamp(col,0.,1.),vec4(.75));
    col=col*.6+.4*col*col*(3.-2.*col);// contrast
    col=mix(col,vec4(dot(col,vec4(.33))),-.4);// satuation
    col*=.5+.5*pow(19.*q.x*q.y*(1.-q.x)*(1.-q.y),.7);// vigneting
    return col;
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 q=fragCoord/RESOLUTION.xy;
    vec2 p=-1.+2.*q;
    p.x*=RESOLUTION.x/RESOLUTION.y;
    float aa=2./RESOLUTION.y;
    
    float nt=TIME/PERIOD;
    float m=fract(nt)*1.25;
    float n=mod(floor(nt),2.);
    
    vec4 t1=texture(iChannel0,q);
    vec4 t2=texture(iChannel1,q);
    vec4 from = n== 0 ? t1:t2;
    vec4 to = n!= 0 ? t1:t2;
    
    vec4 col= hexTransition(p,aa,from,to,m);
    fragColor=vec4(col);
}
