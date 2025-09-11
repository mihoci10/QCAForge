import * as THREE from "three";

const commonVertexSrc = `
#include <instanced_pars_vertex>
varying vec2 vUv;

void main() {
    #include <instanced_vertex>
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;

const drawableFragmentSrc = `
uniform vec2 polarization;
uniform float metadata;
uniform vec3 color;
out vec4 outColor;
varying vec2 vUv;
vec2 uv_pos;

float RoundedRectMask(vec2 pos, vec2 halfSize, float radius, float feather)
{
    // Clamp inputs to keep things sane
    float r = max(0.0, radius);
    vec2 hs  = max(halfSize, vec2(0.0));
    r = min(r, min(hs.x, hs.y));           // radius can't exceed smallest half-size
    float soft = max(feather, 0.0);

    // Signed distance to a rounded box (Inigo Quilez style)
    vec2 p  = uv_pos - pos;                // position relative to rectangle center
    vec2 q  = abs(p) - (hs - vec2(r));
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

    // Anti-aliased edge: combine user feather with geometric AA
    float aa = fwidth(sd);
    float edge = max(soft, aa);

    // Inside => 1, outside => 0, smooth falloff across 'edge'
    return 1.0 - smoothstep(0.0, edge, sd);
}

const float PI = 3.1415926535897932384626433832795;

void main() {
    uv_pos = vUv * 2.0 - 1.0;
    vec2 fragSize = fwidth(uv_pos);

    int polarizationCount = 1;
    int metadata_int = int(metadata);
    float polarizationRotation = 0.0;

    if ((metadata_int & (1 << 6)) != 0)
        polarizationCount = 2;

    if ((metadata_int & (1 << 5)) != 0)
        polarizationRotation = PI / 4.0;

    float polarizationSum = abs(polarization.x) + abs(polarization.y);
    float polarizationOffset = (1.0 - polarizationSum) / float(2 * polarizationCount);

    float mask = RoundedRectMask(vec2(0), vec2(0.99) - (vec2(4) * fragSize), 0.1, 0.01);

    float circleSize = 0.15;
    float dotSizeMax = 0.15;

    float rotOffset = PI / 4.0 + polarizationRotation;
    float rotStep = PI / float(polarizationCount * 2);

    float dotMask = 0.0;

    for(int i = 0; i < polarizationCount * 2; i++){
        float rot = rotStep * float((i/2) + (i%2) * polarizationCount) + rotOffset;
        float offX = cos(rot) * 0.6;
        float offY = sin(rot) * 0.6;
        
        float dotSize = max(0.0, polarization[i / 2] * (i % 2 == 0 ? 1.0 : -1.0)) + polarizationOffset;
        dotSize *= dotSizeMax;
        
        
        mask -= RoundedRectMask(vec2(offX, offY), vec2(circleSize), 1.0, 0.01);
        mask -= RoundedRectMask(vec2(-offX, -offY), vec2(circleSize), 1.0, 0.01);

        dotMask += RoundedRectMask(vec2(offX, offY), vec2(dotSize), 1.0, 0.01);
        dotMask += RoundedRectMask(vec2(-offX, -offY), vec2(dotSize), 1.0, 0.01);
    }

    dotMask = clamp(dotMask, 0.0, 1.0);
    mask += dotMask;
    mask = clamp(mask, 0.0, 1.0);

    vec3 finalColor = mix(color, vec3(0.216, 0.255, 0.318), dotMask);

    outColor = vec4(finalColor, mask);
}
`;

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
`;

export class PaperDrawableCellMaterial extends THREE.ShaderMaterial {
	public override vertexShader: string = commonVertexSrc;
	public override fragmentShader: string = drawableFragmentSrc;
	public override glslVersion = THREE.GLSL3;
	public override transparent = true;

	constructor(parameters?: THREE.ShaderMaterialParameters) {
		super(parameters);
	}
}

export class PaperPickableCellMaterial extends THREE.ShaderMaterial {
	public override vertexShader: string = commonVertexSrc;
	public override fragmentShader: string = pickableFragmentSrc;
	public override glslVersion = THREE.GLSL3;
	public override transparent = false;

	constructor(parameters?: THREE.ShaderMaterialParameters) {
		super(parameters);
	}
}
