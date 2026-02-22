import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Avatar3DProps {
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
    color: string;
    isActive: boolean;
}

// ─── Dynamic Light: reacts to audio ──────────────────────────────────────────
const DynamicPointLight: React.FC<{ color: string; analyserRef: React.MutableRefObject<AnalyserNode | null>; isActive: boolean }> = ({ color, analyserRef, isActive }) => {
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
            // Subtle intensity pulse based on voice
            lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0.8 + audioLevel * 1.5, 0.1);
        }
    });

    return <pointLight ref={lightRef} position={[-5, 5, -5]} color={color} intensity={0.8} />;
};

// ─── Avatar Model Component ────────────────────────────────────────────────────
const AvatarModel: React.FC<Avatar3DProps> = ({ analyserRef, isActive }) => {
    const { scene, animations } = useGLTF('/models/avatar.glb');
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);

    const dataArray = useMemo(() => new Uint8Array(256), []);
    const mousePos = useRef({ x: 0, y: 0 });
    const audioLevelRef = useRef(0); // Smooth audio level (not raw)
    const mouthHoldRef = useRef(0); // Hold mouth open briefly after sound stops

    // Blink state
    const blinkRef = useRef({ lastBlink: 0, nextBlink: 2500, isBlinking: false });

    // ── Cache all face meshes once at load time (no scene.traverse each frame) ──
    const faceMeshes = useMemo(() => {
        const meshes: THREE.Mesh[] = [];
        scene.traverse((child) => {
            if ((child as THREE.Mesh).morphTargetInfluences) {
                meshes.push(child as THREE.Mesh);
            }
        });
        return meshes;
    }, [scene]);

    // ── Cache eye objects once ─────────────────────────────────────────────────
    const eyeObjects = useMemo(() => {
        const eyes: THREE.Object3D[] = [];
        scene.traverse((child) => {
            const name = child.name.toLowerCase();
            if (name.includes('eye') && !name.includes('brow') && !name.includes('lash')) {
                eyes.push(child);
            }
        });
        return eyes;
    }, [scene]);

    // ── Mouse tracking ─────────────────────────────────────────────────────────
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // ── Idle animation ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (actions) {
            const firstAction = actions[Object.keys(actions)[0]];
            if (firstAction) firstAction.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    // ── Main animation loop ────────────────────────────────────────────────────
    useFrame((state) => {
        let rawAudio = 0;
        const t = state.clock.elapsedTime;
        const now = t * 1000;

        // 1. Audio Analysis (linear curve, fast decay)
        if (isActive && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < 20; i++) sum += dataArray[i];
            const raw = sum / (20 * 255);
            // Fast attack when speaking
            audioLevelRef.current = THREE.MathUtils.lerp(audioLevelRef.current, raw, 0.45);
        } else {
            // Fast decay when mic is off — mouth closes
            audioLevelRef.current = THREE.MathUtils.lerp(audioLevelRef.current, 0, 0.35);
        }

        const audio = audioLevelRef.current;
        const isSpeaking = audio > 0.05;
        // mouthTarget: same as audio, closes to 0 when silent
        const mouthTarget = audio;

        // 2. Blink trigger
        const blinkInterval = isSpeaking ? blinkRef.current.nextBlink * 0.7 : blinkRef.current.nextBlink;
        if (!blinkRef.current.isBlinking && now - blinkRef.current.lastBlink > blinkInterval) {
            blinkRef.current.isBlinking = true;
        }

        // 3. Head: mouse tracking (horizontal only)
        if (groupRef.current) {
            const targetRotY = (mousePos.current.x * Math.PI) / 10;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.2, 0.03);

            // 4. Breathing — subtle Y oscillation when idle
            const breathSpeed = isSpeaking ? 1.8 : 0.6;
            const breathAmp = isSpeaking ? 0.008 : 0.015;
            groupRef.current.position.y = -4.8 + Math.sin(t * breathSpeed) * breathAmp;
        }

        // 5. Facial Morphing (using cached meshes — no traverse per frame)
        for (const mesh of faceMeshes) {
            const dict = mesh.morphTargetDictionary;
            if (!dict || !mesh.morphTargetInfluences) continue;

            // ── MOUTH: syllable oscillation ──────────────────────────────────
            // Without proper phoneme data, we modulate audio with a fast sine
            // to create open-close cycles that mimic syllables (~5-7 per second).
            const syllableOsc = (Math.sin(t * 18) + 1) / 2; // 0 to 1, ~3 Hz cycles
            const mouthValue = mouthTarget > 0.03
                ? mouthTarget * 0.7 * syllableOsc  // oscillate when speaking
                : 0;                                 // close fully when silent

            const jawIdx = dict['jawOpen'] ?? dict['mouthOpen'];
            if (jawIdx !== undefined) {
                mesh.morphTargetInfluences[jawIdx] = THREE.MathUtils.lerp(
                    mesh.morphTargetInfluences[jawIdx],
                    mouthValue,
                    0.45 // fast lerp to follow the oscillation
                );
            }

            // Viseme AA (ah) — appears only when mouth opens wide
            const visemeAA = dict['viseme_aa'];
            if (visemeAA !== undefined) {
                mesh.morphTargetInfluences[visemeAA] = THREE.MathUtils.lerp(
                    mesh.morphTargetInfluences[visemeAA],
                    Math.max(0, mouthTarget * 0.55),
                    0.25
                );
            }

            // Viseme O (ooh) — rounds the mouth
            const visemeO = dict['viseme_O'];
            if (visemeO !== undefined) {
                mesh.morphTargetInfluences[visemeO] = THREE.MathUtils.lerp(
                    mesh.morphTargetInfluences[visemeO],
                    Math.max(0, mouthTarget * 0.42),
                    0.18
                );
            }

            // Viseme FF — labio-dental friction sounds
            const visemeFF = dict['viseme_FF'];
            if (visemeFF !== undefined) {
                mesh.morphTargetInfluences[visemeFF] = THREE.MathUtils.lerp(
                    mesh.morphTargetInfluences[visemeFF],
                    Math.max(0, audio * 0.35),
                    0.2
                );
            }

            // ── SMILE: subtle resting expression ─────────────────────────────
            const smileIdx = dict['mouthSmile'] ?? dict['mouthSmileLeft'];
            if (smileIdx !== undefined) {
                const smilePulse = Math.sin(t * 0.4) * 0.04 + 0.06;
                mesh.morphTargetInfluences[smileIdx] = THREE.MathUtils.lerp(
                    mesh.morphTargetInfluences[smileIdx], smilePulse, 0.08
                );
            }

            // ── BROWS: micro-expressions ──────────────────────────────────────
            const browIdx = dict['browInnerUp'] ?? dict['browUp'];
            if (browIdx !== undefined) {
                const browNoise = Math.sin(t * 2.5) * 0.025;
                mesh.morphTargetInfluences[browIdx] = THREE.MathUtils.lerp(
                    mesh.morphTargetInfluences[browIdx],
                    Math.max(0, (audio * 0.5) + browNoise),
                    0.12
                );
            }

            // ── EYES: natural asymmetric blinking ─────────────────────────────
            // Left eye
            const blinkLIdx = dict['eyeBlinkLeft'];
            // Right eye (slightly delayed for realism)
            const blinkRIdx = dict['eyeBlinkRight'];
            // Fallback: both eyes together
            const blinkBothIdx = dict['eyesClosed'];

            const applyBlink = (idx: number, delay: number = 0) => {
                if (!mesh.morphTargetInfluences) return;
                if (blinkRef.current.isBlinking) {
                    mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[idx], 1, 0.55);
                    if (mesh.morphTargetInfluences[idx] > 0.97 && delay === 0) {
                        blinkRef.current.isBlinking = false;
                        blinkRef.current.lastBlink = now;
                        blinkRef.current.nextBlink = 900 + Math.random() * 5000;
                    }
                } else {
                    mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[idx], 0, 0.22);
                }
            };

            if (blinkLIdx !== undefined) applyBlink(blinkLIdx, 0);
            if (blinkRIdx !== undefined) applyBlink(blinkRIdx, 1); // slightly delayed
            if (blinkBothIdx !== undefined && blinkLIdx === undefined) applyBlink(blinkBothIdx, 0);
        }

        // 6. Eye saccades (micro gaze movements on cached eye objects)
        for (const eye of eyeObjects) {
            // Occasional random micro-saccade (5% chance per frame)
            if (Math.random() > 0.95) {
                eye.rotation.x += (Math.random() - 0.5) * 0.008;
                eye.rotation.y += (Math.random() - 0.5) * 0.008;
            }
            // Slowly drift back toward center
            eye.rotation.x = THREE.MathUtils.lerp(eye.rotation.x, 0, 0.02);
            eye.rotation.y = THREE.MathUtils.lerp(eye.rotation.y, 0, 0.02);
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
                {/* Dynamic light that reacts to voice */}
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
