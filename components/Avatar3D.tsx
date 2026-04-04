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
    const { scene, animations } = useGLTF('models/avatar.glb');
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

    // Detect and cache skeleton bones for procedural animation
    const bones = useMemo(() => {
        const b: Record<string, THREE.Object3D> = {};
        scene.traverse((n) => {
            const name = n.name.toLowerCase();
            // Typical Ready Player Me / Mixamo naming
            if (name.includes('head') && !name.includes('end')) b.head = n;
            if (name.includes('neck')) b.neck = n;
            if (name.includes('spine2') || (name.includes('spine') && name.includes('chest'))) b.chest = n;
            if (name.includes('spine1')) b.spineUpper = n;
            if (name.includes('spine') && !b.spine) b.spine = n;
            if (name.includes('hips') || name === 'hips') b.hips = n;
            if (name.includes('shoulder')) {
                if (name.includes('left') || name.includes(' l ') || name.includes('_l')) b.leftShoulder = n;
                if (name.includes('right') || name.includes(' r ') || name.includes('_r')) b.rightShoulder = n;
            }
            if (name.includes('arm')) {
                if (name.includes('left') || name.includes(' l ') || name.includes('_l')) {
                    if (name.includes('forearm')) b.leftForearm = n; else b.leftArm = n;
                }
                if (name.includes('right') || name.includes(' r ') || name.includes('_r')) {
                    if (name.includes('forearm')) b.rightForearm = n; else b.rightArm = n;
                }
            }
            if (name.includes('hand')) {
                if (name.includes('left') || name.includes(' l ') || name.includes('_l')) b.leftHand = n;
                if (name.includes('right') || name.includes(' r ') || name.includes('_r')) b.rightHand = n;
            }
        });
        return b;
    }, [scene]);

    // Save each bone's REST rotation so we can apply offsets instead of absolutes
    const restPose = useMemo(() => {
        const rest: Record<string, THREE.Euler> = {};
        for (const [key, bone] of Object.entries(bones)) {
            rest[key] = bone.rotation.clone();
        }
        return rest;
    }, [bones]);

    // Cache eye objects 
    const eyeObjects = useMemo(() => {
        const eyes: THREE.Object3D[] = [];
        scene.traverse((child) => {
            const n = child.name.toLowerCase();
            if (n.includes('eye') && !n.includes('brow') && !n.includes('lash') && child.type !== 'SkinnedMesh') {
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

        // ━━━ 2. FULL BODY ARTICULATION (BONES) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // All bone animations use REST POSE + small offset (never absolute values)

        if (groupRef.current) {
            // Overall breath cycle
            const breathFreq = isSpeaking ? 1.4 : 0.55;
            const breathEnergy = Math.sin(t * breathFreq);
            const breathVal = (breathEnergy + 1) / 2; // 0..1

            // Natural Idle "Look-around" noise
            const idleLookX = Math.sin(t * 0.15) * 0.05 + Math.cos(t * 0.08) * 0.02;
            const idleLookY = Math.cos(t * 0.12) * 0.03;

            // Helper: returns rest rotation for a bone key, or zero
            const rest = (key: string, axis: 'x' | 'y' | 'z') => restPose[key]?.[axis] ?? 0;

            // ── HIPS (Counter-sway)
            if (bones.hips) {
                const swayOffset = Math.sin(t * 0.4) * 0.01 + (isSpeaking ? audio * 0.02 : 0);
                bones.hips.rotation.z = THREE.MathUtils.lerp(bones.hips.rotation.z, rest('hips', 'z') - swayOffset, 0.04);
            }

            // ── SPINE (Lean & sway distributed across segments)
            if (bones.spine) {
                const leanX = isSpeaking ? -0.01 - audio * 0.015 : -0.008;
                const swayZ = Math.cos(t * 0.3) * 0.008;
                bones.spine.rotation.x = THREE.MathUtils.lerp(bones.spine.rotation.x, rest('spine', 'x') + leanX, 0.04);
                bones.spine.rotation.z = THREE.MathUtils.lerp(bones.spine.rotation.z, rest('spine', 'z') + swayZ, 0.04);
            }
            if (bones.spineUpper) {
                const leanX = isSpeaking ? -0.008 - audio * 0.012 : -0.005;
                bones.spineUpper.rotation.x = THREE.MathUtils.lerp(bones.spineUpper.rotation.x, rest('spineUpper', 'x') + leanX, 0.04);
            }

            // ── CHEST (Breathing expansion + twist)
            if (bones.chest) {
                const twistY = Math.sin(t * 0.4) * 0.015 + (isSpeaking ? audio * 0.015 : 0);
                const leanX = isSpeaking ? -0.005 - audio * 0.01 : -0.004;
                bones.chest.rotation.y = THREE.MathUtils.lerp(bones.chest.rotation.y, rest('chest', 'y') + twistY, 0.05);
                bones.chest.rotation.x = THREE.MathUtils.lerp(bones.chest.rotation.x, rest('chest', 'x') + leanX, 0.04);
                bones.chest.scale.setScalar(1 + breathVal * 0.005 + (isSpeaking ? audio * 0.006 : 0));
            }

            // ── SHOULDERS (Asymmetric breathing shrugs — offsets only)
            if (bones.leftShoulder) {
                const liftL = breathVal * 0.015 + (isSpeaking ? audio * 0.04 * (0.8 + Math.sin(t * 5) * 0.2) : 0);
                bones.leftShoulder.rotation.z = THREE.MathUtils.lerp(bones.leftShoulder.rotation.z, rest('leftShoulder', 'z') + liftL, 0.08);
            }
            if (bones.rightShoulder) {
                const liftR = breathVal * 0.012 + (isSpeaking ? audio * 0.035 * (0.8 + Math.cos(t * 4.5) * 0.2) : 0);
                bones.rightShoulder.rotation.z = THREE.MathUtils.lerp(bones.rightShoulder.rotation.z, rest('rightShoulder', 'z') - liftR, 0.08);
            }

            // ── ARMS (Small offsets from rest pose — NOT absolute values)
            if (bones.leftArm) {
                const wave = Math.sin(t * 1.2) * 0.02;
                const spread = isSpeaking ? audio * 0.06 : 0;
                const swingX = Math.cos(t * 0.6) * 0.01;
                bones.leftArm.rotation.z = THREE.MathUtils.lerp(bones.leftArm.rotation.z, rest('leftArm', 'z') + spread + wave, 0.05);
                bones.leftArm.rotation.x = THREE.MathUtils.lerp(bones.leftArm.rotation.x, rest('leftArm', 'x') + swingX, 0.05);
            }
            if (bones.rightArm) {
                const wave = Math.sin(t * 1.2 + 0.5) * 0.02;
                const spread = isSpeaking ? audio * 0.06 : 0;
                const swingX = Math.cos(t * 0.6 + 0.5) * 0.01;
                bones.rightArm.rotation.z = THREE.MathUtils.lerp(bones.rightArm.rotation.z, rest('rightArm', 'z') - spread - wave, 0.05);
                bones.rightArm.rotation.x = THREE.MathUtils.lerp(bones.rightArm.rotation.x, rest('rightArm', 'x') - swingX, 0.05);
            }

            // ── FOREARMS (Gentle bend offsets)
            if (bones.leftForearm) {
                const bend = Math.sin(t * 1.5) * 0.015 + (isSpeaking ? audio * 0.03 : 0);
                bones.leftForearm.rotation.y = THREE.MathUtils.lerp(bones.leftForearm.rotation.y, rest('leftForearm', 'y') + bend, 0.05);
            }
            if (bones.rightForearm) {
                const bend = Math.sin(t * 1.5 + 0.3) * 0.015 + (isSpeaking ? audio * 0.03 : 0);
                bones.rightForearm.rotation.y = THREE.MathUtils.lerp(bones.rightForearm.rotation.y, rest('rightForearm', 'y') - bend, 0.05);
            }

            // ── HEAD & NECK (Damped inertia & Micro-noise — offsets from rest)
            if (bones.head || bones.neck) {
                const lookX = (mousePos.current.x * Math.PI) / 7 + idleLookX;
                const lookY = (mousePos.current.y * Math.PI) / 9 + idleLookY;

                // Micro-jitter for real-look
                const jitterX = (Math.random() - 0.5) * 0.0012;
                const jitterY = (Math.random() - 0.5) * 0.0012;

                if (bones.neck) {
                    bones.neck.rotation.y = THREE.MathUtils.lerp(bones.neck.rotation.y, rest('neck', 'y') + lookX * 0.35, 0.08);
                    bones.neck.rotation.x = THREE.MathUtils.lerp(bones.neck.rotation.x, rest('neck', 'x') - lookY * 0.25, 0.08);
                }
                if (bones.head) {
                    bones.head.rotation.y = THREE.MathUtils.lerp(bones.head.rotation.y, rest('head', 'y') + lookX * 0.65 + jitterX, 0.12);
                    bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, rest('head', 'x') - lookY * 0.75 + jitterY, 0.12);

                    // Nodding & head tilt during speech (subtle)
                    if (isSpeaking) {
                        const nodFreq = 3.5 + Math.sin(t * 0.7) * 0.8;
                        const nod = Math.sin(t * nodFreq) * audio * 0.025;
                        bones.head.rotation.x += nod;
                        bones.head.rotation.z = THREE.MathUtils.lerp(bones.head.rotation.z, rest('head', 'z') + Math.sin(t * 1.5) * 0.018 * audio, 0.05);
                    } else {
                        bones.head.rotation.z = THREE.MathUtils.lerp(bones.head.rotation.z, rest('head', 'z'), 0.05);
                    }
                }
            }

            // Final fallback if no bones found
            if (!bones.head && !bones.neck) {
                groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (mousePos.current.x * Math.PI) / 8, 0.05);
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

            // Viseme FF: F/V sounds
            const ffIdx = dict['viseme_FF'];
            if (ffIdx !== undefined) {
                inf[ffIdx] = THREE.MathUtils.lerp(inf[ffIdx], isSpeaking ? audio * 0.25 * osc2 : 0, 0.2);
            }

            // Viseme SS: S/Z sounds (horizontal stretch)
            const ssIdx = dict['viseme_SS'];
            if (ssIdx !== undefined) {
                inf[ssIdx] = THREE.MathUtils.lerp(inf[ssIdx], isSpeaking ? audio * 0.2 * (1 - osc1) : 0, 0.15);
            }

            // Viseme E: E sound
            const eIdx = dict['viseme_E'];
            if (eIdx !== undefined) {
                inf[eIdx] = THREE.MathUtils.lerp(inf[eIdx], isSpeaking ? audio * 0.3 * syllableOsc : 0, 0.2);
            }

            // ── SMILE: micro resting expression ──────────────────────────────
            const smileIdx = dict['mouthSmile'] ?? dict['mouthSmileLeft'];
            if (smileIdx !== undefined) {
                const restSmile = isSpeaking ? 0.1 : Math.sin(t * 0.35) * 0.03 + 0.06;
                inf[smileIdx] = THREE.MathUtils.lerp(inf[smileIdx], restSmile, 0.06);
                const smileR = dict['mouthSmileRight'];
                if (smileR !== undefined) inf[smileR] = inf[smileIdx];
            }

            // ── BROWS ────────────────────────────────────────────────────────
            const browIdx = dict['browInnerUp'] ?? dict['browUp'];
            const browDownL = dict['browDownLeft'];
            const browDownR = dict['browDownRight'];

            if (browIdx !== undefined) {
                const browWave = Math.sin(t * 2.2) * 0.02;
                const browTarget = isSpeaking ? audio * 0.4 + browWave : browWave + 0.01;
                inf[browIdx] = THREE.MathUtils.lerp(inf[browIdx], Math.max(0, browTarget), 0.1);
            }
            // Occasional brow furrowing when "thinking" (low audio but talking)
            if (browDownL !== undefined && browDownR !== undefined) {
                const furrow = (isSpeaking && audio < 0.1) ? 0.15 : 0;
                inf[browDownL] = THREE.MathUtils.lerp(inf[browDownL], furrow, 0.05);
                inf[browDownR] = THREE.MathUtils.lerp(inf[browDownR], furrow, 0.05);
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
                inf[squintL] = THREE.MathUtils.lerp(inf[squintL], isSpeaking ? 0.2 : 0, 0.08);
            }
            if (squintR !== undefined) {
                inf[squintR] = THREE.MathUtils.lerp(inf[squintR], isSpeaking ? 0.2 : 0, 0.08);
            }

            // ── CHEEKS: puff when speaking ───────────────────────────────────
            const cheekIdx = dict['cheekPuff'];
            if (cheekIdx !== undefined) {
                inf[cheekIdx] = THREE.MathUtils.lerp(
                    inf[cheekIdx],
                    isSpeaking ? audio * 0.15 * (1 - syllableOsc) : 0,
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

useGLTF.preload('models/avatar.glb');
