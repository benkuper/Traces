float freq = 8.0;
float period = 8.0;
float speed = 2.0;
float fade = 4.0;
float displacement = 0.2;

uniform float progression;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 R = iResolution.xy,
         U = ((2. * fragCoord.xy) - R) / min(R.x, R.y),
         T = fragCoord / R.xy;
    float D = length(U);

    float prog = progression*5.6;
    float frame_time = mod(prog, period);
    float pixel_time = max(0.0, frame_time - D);

    float wave_height = (cos(pixel_time * freq) + 1.0) / 2.0;
    float wave_scale = (1.0 - min(1.0, pixel_time / fade));
    float frac = wave_height * wave_scale;
    if (mod(prog, period * 2.0) > period)
    {
        frac = 1. - frac;
    }

    vec2 tc = T + ((U / D) * -((sin(pixel_time * freq) / fade) * wave_scale) * displacement);
    
    fragColor = mix(
        texture(iChannel1, tc),
        texture(iChannel0, tc),
        frac);
}