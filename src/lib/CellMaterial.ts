import * as THREE from 'three'

export default new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    vertexShader: 
    `
        attribute vec3 localPosition;
		varying vec3 localPos;
        void main() {
            localPos = localPosition;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: 
    `
        varying vec3 localPos;
        float polarization = 1.0f;
        out vec4 outColor;

        float HollowRectMask(vec2 pos, vec2 bandStart, vec2 bandStop, float fade)
        {
            vec2 value = abs(localPos.xy - pos);

            vec2 mask = smoothstep(bandStart - fade, bandStart, value);
            mask -= smoothstep(bandStop, bandStop + fade, value);

            return max(max(mask.x, mask.y), 0.0);
        }

        float HollowCircleMask(vec2 pos, float radiusStart, float radiusStop, float fade)
        {
            radiusStop = max(radiusStart, radiusStop);
            float value = length(localPos.xy - pos);

            float mask = smoothstep(radiusStart - fade, radiusStart, value);
            mask -= smoothstep(radiusStop, radiusStop + fade, value);

            return max(mask, 0.0);
        }

        void main() {
            vec2 fragSize = fwidth(localPos.xy);

            float mask = HollowRectMask(vec2(0), vec2(1) - (vec2(4) * fragSize), vec2(1), 0.01);

            mask += HollowCircleMask(vec2(0.5, 0.5), 0.2, 0.2 + (length(fragSize)), 0.01);
            mask += HollowCircleMask(vec2(0.5, -0.5), 0.2, 0.2 + (length(fragSize)), 0.01);
            mask += HollowCircleMask(vec2(-0.5, 0.5), 0.2, 0.2 + (length(fragSize)), 0.01);
            mask += HollowCircleMask(vec2(-0.5, -0.5), 0.2, 0.2 + (length(fragSize)), 0.01);

            mask += HollowCircleMask(vec2(0.5, 0.5), 0.0, polarization * (0.2 + (length(fragSize))), 0.0);
            mask += HollowCircleMask(vec2(0.5, -0.5), 0.0, -polarization * (0.2 + (length(fragSize))), 0.0);
            mask += HollowCircleMask(vec2(-0.5, 0.5), 0.0, -polarization * (0.2 + (length(fragSize))), 0.0);
            mask += HollowCircleMask(vec2(-0.5, -0.5), 0.0, polarization * (0.2 + (length(fragSize))), 0.0);

            outColor = vec4(vec3(1), mask);
        }
    `
});