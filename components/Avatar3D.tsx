import React, { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Avatar3DProps {
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
    color: string;
    isActive: boolean;
}

// ─── Dynamic Light: reacts to audio ──────────────────────────────────────────
const DynamicPointLight: React.FC<{
    color: string;
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
    isActive: boolean;
}> = ({ color, analyserRef, isActive }) => {
    const lightRef = useRef<THREE.PointLight>(null);
    const dataArray = useMemo(() => new Uint8Array(256), []);

    useFrame(() => {
        let audioLevel = 0;
        if (isActive && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < 20; i++) sum += dataArray[i];
            audioLevel = sum / (20 * 255);
        }
        if (lightRef.current) {
            lightRef.current.intensity = THREE.MathUtils.lerp(
                lightRef.current.intensity,
                0.8 + audioLevel * 1.2,
                0.1
            );
        }
    });

    return <pointLight ref={lightRef} position={[-5, 5, -5]} color={color} intensity={0.8} />;
};

// ─── Avatar Model ────────────────────────────────────────────────────────────
const AvatarModel: React.FC<Avatar3DProps> = ({ analyserRef, isActive }) => {
    const { scene, animations } = useGLTF('/models/avatar.glb');
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);

    const dataArray = useMemo(() => new Uint8Array(256), []);
    const mousePos = useRef({ x: 0, y: 0 });
    const smoothAudio = useRef(0);
    const prevAudio = useRef(0); // For derivative-based syllable detection

    // Blink state
    const blinkState = useRef({
        lastBlink: 0,
        nextBlink: 2500,
        isBlinking: false,
        phase: 0, // 0 = idle, 1 = closing, 2 = opening
        value: 0,
    });

    // Cache face meshes + morph target indices once at load
    const faceMeshes = useMemo(() => {
        const meshes: THREE.Mesh[] = [];
        scene.traverse((child) => {
            if ((child as THREE.Mesh).morphTargetInfluences) {
                meshes.push(child as THREE.Mesh);
            }
        });
        return meshes;
    }, [scene]);

    // Cache eye objects 
    const eyeObjects = useMemo(() => {
        const eyes: THREE.Object3D[] = [];
        scene.traverse((child) => {
            const n = child.name.toLowerCase();
            if (n.includes('eye') && !n.includes('brow') && !n.includes('lash')) {
                eyes.push(child);
            }
        });
        return eyes;
    }, [scene]);

    // Mouse tracking
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    // Idle animation
    useEffect(() => {
        if (actions) {
            const first = actions[Object.keys(actions)[0]];
            if (first) first.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    // ── Main animation loop ──────────────────────────────────────────────────
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const now = t * 1000;

        // ━━━ 1. AUDIO ANALYSIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        let rawAudio = 0;
        if (isActive && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < 20; i++) sum += dataArray[i];
            rawAudio = sum / (20 * 255);
        }

        // Smooth with asymmetric lerp: fast attack, faster decay
        const attackSpeed = 0.5;
        const decaySpeed = 0.4;
        const target = rawAudio;
        const speed = target > smoothAudio.current ? attackSpeed : decaySpeed;
        smoothAudio.current = THREE.MathUtils.lerp(smoothAudio.current, target, speed);

        const audio = smoothAudio.current;
        const isSpeaking = audio > 0.04;

        // Derivative: how fast audio is changing (for syllable detection)
        const audioDelta = Math.abs(audio - prevAudio.current);
        prevAudio.current = audio;

        // ━━━ 2. HEAD TRACKING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        if (groupRef.current) {
            const targetRotY = (mousePos.current.x * Math.PI) / 10;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y, targetRotY, 0.05
            );
            groupRef.current.rotation.x = THREE.MathUtils.lerp(
                groupRef.current.rotation.x, -0.2, 0.03
            );

            // Breathing
            const breathHz = isSpeaking ? 1.8 : 0.6;
            const breathAmp = isSpeaking ? 0.006 : 0.012;
            groupRef.current.position.y = -4.8 + Math.sin(t * breathHz) * breathAmp;

            // Subtle head nod when speaking (driven by audio energy changes)
            if (isSpeaking) {
                groupRef.current.rotation.z = THREE.MathUtils.lerp(
                    groupRef.current.rotation.z,
                    Math.sin(t * 3.5) * audioDelta * 2,
                    0.08
                );
            } else {
                groupRef.current.rotation.z = THREE.MathUtils.lerp(
                    groupRef.current.rotation.z, 0, 0.05
                );
            }
        }

        // ━━━ 3. BLINK STATE MACHINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        const blink = blinkState.current;
        if (blink.phase === 0) {
            // Idle: wait for next blink
            const interval = isSpeaking ? blink.nextBlink * 0.6 : blink.nextBlink;
            if (now - blink.lastBlink > interval) {
                blink.phase = 1; // Start closing
            }
        } else if (blink.phase === 1) {
            // Closing: fast
            blink.value = THREE.MathUtils.lerp(blink.value, 1, 0.6);
            if (blink.value > 0.97) {
                blink.phase = 2; // Start opening
            }
        } else if (blink.phase === 2) {
            // Opening: slower
            blink.value = THREE.MathUtils.lerp(blink.value, 0, 0.2);
            if (blink.value < 0.03) {
                blink.value = 0;
                blink.phase = 0;
                blink.lastBlink = now;
                blink.nextBlink = 1200 + Math.random() * 4500;
            }
        }

        // ━━━ 4. FACIAL MORPHING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // Syllable oscillation: multi-frequency for more organic feel
        const osc1 = (Math.sin(t * 16) + 1) / 2;        // ~2.5 Hz
        const osc2 = (Math.sin(t * 24 + 1.2) + 1) / 2;  // ~3.8 Hz
        const syllableOsc = osc1 * 0.6 + osc2 * 0.4;     // Mix two rhythms

        for (const mesh of faceMeshes) {
            const dict = mesh.morphTargetDictionary;
            const inf = mesh.morphTargetInfluences;
            if (!dict || !inf) continue;

            // ── MOUTH ────────────────────────────────────────────────────────
            const jawTarget = isSpeaking
                ? audio * 0.65 * syllableOsc
                : 0;

            const jawIdx = dict['jawOpen'] ?? dict['mouthOpen'];
            if (jawIdx !== undefined) {
                inf[jawIdx] = THREE.MathUtils.lerp(inf[jawIdx], jawTarget, 0.5);
            }

            // Viseme AA — open vowel, in phase with jaw
            const aaIdx = dict['viseme_aa'];
            if (aaIdx !== undefined) {
                inf[aaIdx] = THREE.MathUtils.lerp(
                    inf[aaIdx],
                    isSpeaking ? audio * 0.5 * syllableOsc : 0,
                    0.35
                );
            }

            // Viseme O — rounded vowel, opposite phase for variety
            const oIdx = dict['viseme_O'];
            if (oIdx !== undefined) {
                inf[oIdx] = THREE.MathUtils.lerp(
                    inf[oIdx],
                    isSpeaking ? audio * 0.35 * (1 - syllableOsc) : 0,
                    0.3
                );
            }

            // Viseme FF — consonant
            const ffIdx = dict['viseme_FF'];
            if (ffIdx !== undefined) {
                inf[ffIdx] = THREE.MathUtils.lerp(
                    inf[ffIdx],
                    isSpeaking ? audio * 0.25 * osc2 : 0,
                    0.25
                );
            }

            // ── SMILE: micro resting expression ──────────────────────────────
            const smileIdx = dict['mouthSmile'] ?? dict['mouthSmileLeft'];
            if (smileIdx !== undefined) {
                const restSmile = Math.sin(t * 0.35) * 0.03 + 0.04;
                inf[smileIdx] = THREE.MathUtils.lerp(inf[smileIdx], restSmile, 0.06);
            }

            // ── BROWS ────────────────────────────────────────────────────────
            const browIdx = dict['browInnerUp'] ?? dict['browUp'];
            if (browIdx !== undefined) {
                const browWave = Math.sin(t * 2.2) * 0.02;
                const browTarget = isSpeaking ? audio * 0.35 + browWave : browWave + 0.01;
                inf[browIdx] = THREE.MathUtils.lerp(inf[browIdx], Math.max(0, browTarget), 0.1);
            }

            // ── EYES (blink state machine) ───────────────────────────────────
            const blinkL = dict['eyeBlinkLeft'];
            const blinkR = dict['eyeBlinkRight'];
            const blinkBoth = dict['eyesClosed'];

            if (blinkL !== undefined) inf[blinkL] = blink.value;
            if (blinkR !== undefined) inf[blinkR] = blink.value;
            if (blinkBoth !== undefined && blinkL === undefined) inf[blinkBoth] = blink.value;

            // ── SQUINT: subtle when speaking ─────────────────────────────────
            const squintL = dict['eyeSquintLeft'];
            const squintR = dict['eyeSquintRight'];
            if (squintL !== undefined) {
                inf[squintL] = THREE.MathUtils.lerp(inf[squintL], isSpeaking ? 0.15 : 0, 0.08);
            }
            if (squintR !== undefined) {
                inf[squintR] = THREE.MathUtils.lerp(inf[squintR], isSpeaking ? 0.15 : 0, 0.08);
            }

            // ── CHEEKS: puff when speaking ───────────────────────────────────
            const cheekIdx = dict['cheekPuff'];
            if (cheekIdx !== undefined) {
                inf[cheekIdx] = THREE.MathUtils.lerp(
                    inf[cheekIdx],
                    isSpeaking ? audio * 0.2 * (1 - syllableOsc) : 0,
                    0.12
                );
            }
        }

        // ━━━ 5. EYE SACCADES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        for (const eye of eyeObjects) {
            if (Math.random() > 0.97) {
                eye.rotation.x += (Math.random() - 0.5) * 0.006;
                eye.rotation.y += (Math.random() - 0.5) * 0.006;
            }
            eye.rotation.x = THREE.MathUtils.lerp(eye.rotation.x, 0, 0.025);
            eye.rotation.y = THREE.MathUtils.lerp(eye.rotation.y, 0, 0.025);
        }
    });

    return (
        <primitive
            object={scene}
            ref={groupRef}
            scale={3.0}
            position={[0, -4.8, 0]}
            rotation={[-0.2, 0, 0]}
        />
    );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const Avatar3D: React.FC<Avatar3DProps> = (props) => {
    return (
        <div className="absolute inset-0 z-0 bg-transparent overflow-hidden">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 1.1, 3], fov: 28 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <spotLight position={[5, 5, 5]} angle={0.25} penumbra={1} intensity={1.5} castShadow />
                <DynamicPointLight color={props.color} analyserRef={props.analyserRef} isActive={props.isActive} />
                <directionalLight position={[0, 10, 0]} intensity={0.4} />

                <React.Suspense fallback={null}>
                    <AvatarModel {...props} />
                    <Environment preset="city" />
                </React.Suspense>

                <ContactShadows
                    position={[0, -2, 0]}
                    opacity={0.35}
                    scale={5}
                    blur={2.5}
                    far={4}
                />

                <EffectComposer multisampling={4}>
                    <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.6} radius={0.35} />
                    <Vignette eskil={false} offset={0.08} darkness={0.75} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default Avatar3D;

useGLTF.preload('/models/avatar.glb');
