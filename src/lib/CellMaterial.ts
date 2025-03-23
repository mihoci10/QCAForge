import * as THREE from 'three'

const commonVertexSrc = `
#include <instanced_pars_vertex>
varying vec2 vUv;

void main() {
    #include <instanced_vertex>
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`

const drawableFragmentSrc = `
uniform vec2 polarization;
uniform float metadata;
uniform vec3 color;
out vec4 outColor;
varying vec2 vUv;
vec2 uv_pos;

float HollowRectMask(vec2 pos, vec2 bandStart, vec2 bandStop, float fade)
{
    vec2 value = abs(uv_pos - pos);

    vec2 mask = smoothstep(bandStart - fade, bandStart, value);
    mask -= smoothstep(bandStop, bandStop + fade, value);

    return max(max(mask.x, mask.y), 0.0);
}

float HollowCircleMask(vec2 pos, float radiusStart, float radiusStop, float fade)
{
    radiusStop = max(radiusStart, radiusStop);
    float value = length(uv_pos - pos);

    float mask = smoothstep(radiusStart - fade, radiusStart, value);
    mask -= smoothstep(radiusStop, radiusStop + fade, value);

    return max(mask, 0.0);
}

void main() {
    uv_pos = vUv * 2.0 - 1.0;
    vec2 fragSize = fwidth(uv_pos);

    int polarizationCount = 1;
    int metadata_int = int(metadata);
    
    bool selected = bool(metadata_int & (1 << 6));
    bool ghosted = bool(metadata_int & (1 << 5));

    float mask = HollowRectMask(vec2(0), vec2(1) - (vec2(4) * fragSize), vec2(1), 0.0);

    float circleSize = 0.15;
    float dotSizeMax = 0.10;

    float rotStep = 3.1415926535897932384626433832795/float(polarizationCount * 2);
    float rotOffset = 3.1415926535897932384626433832795 / 4.0;

    for(int i = 0; i < polarizationCount * 2; i++){
        float offX = cos(rotStep * float(i) + rotOffset) * 0.6;
        float offY = sin(rotStep * float(i) + rotOffset) * 0.6;
        
        float dotSize = abs(polarization[i % 2] / 2.0 + 0.5) * dotSizeMax;
        if (i/2 == 1)
            dotSize = dotSizeMax - dotSize;
        
        mask += HollowCircleMask(vec2(offX, offY), circleSize, circleSize + (length(fragSize)), 0.01);
        mask += HollowCircleMask(vec2(-offX, -offY), circleSize, circleSize + (length(fragSize)), 0.01);

        mask += HollowCircleMask(vec2(offX, offY), 0.0, dotSize + length(fragSize), 0.01);
        mask += HollowCircleMask(vec2(-offX, -offY), 0.0, dotSize + length(fragSize), 0.01);
    }

    outColor = vec4(mask * color, 1);
}
`

const pickableFragmentSrc = `
uniform vec2 polarization;
uniform float metadata;
uniform vec3 color;
out int out_id;
varying vec2 vUv;
vec2 uv_pos;

void main() {
    int metadata_int = int(metadata);
    out_id = metadata_int >> 16;
}
`

export class DrawableCellMaterial extends THREE.ShaderMaterial{
    public override vertexShader: string = commonVertexSrc;
    public override fragmentShader: string = drawableFragmentSrc;
    public override glslVersion = THREE.GLSL3;
    public override transparent = false;

    constructor(parameters?: THREE.ShaderMaterialParameters){
        super(parameters);
    }
}

export class PickableCellMaterial extends THREE.ShaderMaterial{
    public override vertexShader: string = commonVertexSrc;
    public override fragmentShader: string = pickableFragmentSrc;
    public override glslVersion = THREE.GLSL3;
    public override transparent = false;

    constructor(parameters?: THREE.ShaderMaterialParameters){
        super(parameters);
    }
}