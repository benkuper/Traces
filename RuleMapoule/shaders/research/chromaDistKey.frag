uniform float threshold=.4;
uniform float cutoff=.45;
uniform vec4 keyColor=vec4(0.,1.,0.,1.);
uniform vec4 bgColor=vec4(.0,0.,0.,0.);

vec4 rgbToYCrCb(vec4 rgb)
{
    float y=.2989*rgb.x+.5866*rgb.y+.1145*rgb.z;
    float cb=-.1687*rgb.x-.3313*rgb.y+.5000*rgb.z;
    float cr=.5000*rgb.x-.4184*rgb.y-.0816*rgb.z;
    
    return vec4(y,cb,cr,rgb.w);
}

vec4 YCbCrToRGB(vec4 ycbcr)
{
    float r=ycbcr.x+0.*ycbcr.y+1.4022*ycbcr.z;
    float g=ycbcr.x-.3456*ycbcr.y-.7145*ycbcr.z;
    float b=ycbcr.x+1.7710*ycbcr.y+0.*ycbcr.z;
    
    return vec4(r,g,b,ycbcr.w);
}

const float PI=3.14159265;

vec4 despill(vec4 col)
{
    float avg=(col.x+col.z)/2.;
    avg*=1.1;
    
    vec4 despilled_col=col;
    
    if(col.y>avg)
    {
        float green_rat=0.;
        
        float fixed_avg=col.y;
        float inc_rat=fixed_avg/avg;
        despilled_col.x*=inc_rat;
        despilled_col.z*=inc_rat;
        
        float diff=despilled_col.y-avg;
        
        despilled_col.y-=diff*green_rat;
    }
    
    return despilled_col;
}

float rescale(float v,float minimum,float maximum,float new_max)
{
    float range=maximum-minimum;
    float t=(v-minimum)/range;
    
    return t*new_max;
}

vec4 chromaDistKey(vec4 fgcol,vec4 bgcol,vec4 keycol)
{
    vec4 keycol_yuv=rgbToYCrCb(keycol);
    vec4 col_yuv=rgbToYCrCb(fgcol);
    
    vec2 dif=col_yuv.yz-keycol_yuv.yz;
    
    float d=sqrt(dot(dif,dif));
    
    float kbg;
    
    if(d>cutoff)
    {
        kbg=0.;
    }
    else if(d<cutoff&&d>threshold)
    {
        kbg=1.-rescale(d,threshold,cutoff,1.);
    }
    else
    {
        kbg=1.;
    }
    
    float kfg=1.-kbg;
    
    return kfg*despill(fgcol)+kbg*bgcol;
}

void mainImage(out vec4 fragColor,in vec2 fragCoord)
{
    vec2 uv=fragCoord.xy/iResolution.xy;
    vec4 col=texture(iChannel0,uv);
    int x_grid=int(iResolution.x)/15;
    int y_grid=int(iResolution.y)/15;
    
    bool black=mod(fragCoord.x/15.,2.)<1.==mod(fragCoord.y/15.,2.)<1.;
    vec4 bg_col=black?vec4(.3,.3,.3,1):vec4(.95,.95,.95,1);
    
    vec4 despilled_col=despill(col);
    
    // vec4 key_col = rgbToYCrCb(vec4(0, 1, 0, 1));
    vec4 converted_col=rgbToYCrCb(col);
    
    float dp=clamp(dot(normalize(keyColor.yz),normalize(converted_col.yz)),-1.,1.);
    
    float d=acos(dp);
    
    float dmax=PI/6.;
    float kfg_min=.2;
    
    float kfg=min(1.,d/dmax);
    
    float luma_range=.25;
    
    if(converted_col.x<luma_range)
    {
        kfg=1.;
    }
    
    kfg=kfg<kfg_min?0.:rescale(kfg,kfg_min,1.,1.);
    
    float kbg=1.-kfg;
    fragColor= chromaDistKey(col,bgColor,keyColor);
}