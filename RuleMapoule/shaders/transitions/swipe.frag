uniform float progression;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy/iResolution.xy;
    
     vec4 bgColor = texture(iChannel0, uv);
    vec4 frontColor = texture(iChannel1, uv);

    // fragColor = uv.x > progression ? vec4(1,0,0,1):vec4(0,1,0,1);
    fragColor = uv.x > progression ? bgColor: frontColor;
}