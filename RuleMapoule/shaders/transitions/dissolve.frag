// background grid from https://www.shadertoy.com/view/XtBfzz

uniform float progression;
uniform vec4 color = vec4(0., 0.1, 1.0, 1.0);
uniform float lookup = .5;
uniform float maskmix = .5;
uniform float widthStart = 0.1;
uniform float widthEnd = 0.1;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    // UVs of the main Color texture
	vec2 uv = fragCoord.xy/iResolution.xy;

    // color textures
    vec4 clrA = texture(iChannel0, uv);
    vec4 clrB = texture(iChannel1, uv);
    
    // set this to fade the alpha (0-1)
    float t = progression;
    
	// set these to increase/decrease the edge width

    float edge_width = mix(widthStart, widthEnd, smoothstep(0., 1., t)); // 
    
    // increase the alpha range by the edge width so we are not left with only glowy edges 
    float myAlpha = mix(0. - edge_width, 1., t); 
    
    // fade mask uv
    vec2 uv_mask = fragCoord.xy/iResolution.xy;
    
    // fade mask texture
    // use a linear texture that has values between 0-1
    vec4 alphaTex = mix(clrA, clrB, maskmix) * lookup;

    float luma = dot(alphaTex.rgb, vec3(0.299, 0.587, 0.114));
    
    // alpha mask (1-bit)
    float a = step(luma, myAlpha);

    // edge mask which is a slightly progressed version of the alpha
    // this mask doesn't need to be 1 bit as it will just be added to the color
    float edge = smoothstep(luma - edge_width, luma, myAlpha);

    vec4 edgeColor = color * edge;
    
    // add edge color to the color
    clrA += vec4(edgeColor.rgb, 0) * edgeColor.a;

    fragColor = mix(clrA, clrB, a);
}