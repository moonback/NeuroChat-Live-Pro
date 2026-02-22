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

const AvatarModel: React.FC<Avatar3DProps> = ({ analyserRef, isActive }) => {
    const { scene, animations } = useGLTF('/models/avatar.glb');
    const groupRef = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);

    const dataArray = useMemo(() => new Uint8Array(256), []);
    const mousePos = useRef({ x: 0, y: 0 });
    const blinkRef = useRef<{ lastBlink: number; nextBlink: number; isBlinking: boolean }>({ lastBlink: 0, nextBlink: 2000, isBlinking: false });

    // Listen for mouse movements for tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Idle animation
    useEffect(() => {
        if (actions) {
            const firstAction = actions[Object.keys(actions)[0]];
            if (firstAction) firstAction.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    useFrame((state) => {
        let audioLevel = 0;
        const now = state.clock.elapsedTime * 1000;

        // 1. Audio Level Analysis
        if (isActive && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < 20; i++) sum += dataArray[i];
            audioLevel = sum / (20 * 255);
        }

        // 2. Blinking Logic
        if (!blinkRef.current.isBlinking && now - blinkRef.current.lastBlink > blinkRef.current.nextBlink) {
            blinkRef.current.isBlinking = true;
        }

        if (groupRef.current) {
            // Mouse Tracking
            const targetRotationY = (mousePos.current.x * Math.PI) / 10;
            const targetRotationX = 0; // Disable vertical tracking
            // Body (Static scale, only mouse tracking rotation)
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);
        }

        // 3. Advanced Facial Morphing
        scene.traverse((child) => {
            if ((child as THREE.Mesh).morphTargetInfluences) {
                const mesh = child as THREE.Mesh;
                const dict = mesh.morphTargetDictionary;
                if (!dict) return;

                // --- MOUTH (Organic Lip-sync) ---
                // We add a tiny bit of noise to make it less "robotic"
                const mouthNoise = (Math.random() - 0.5) * 0.1 * audioLevel;
                const mouthIdx = dict['mouthOpen'] ?? dict['viseme_aa'] ?? dict['jawOpen'];
                if (mouthIdx !== undefined) {
                    mesh.morphTargetInfluences![mouthIdx] = THREE.MathUtils.lerp(
                        mesh.morphTargetInfluences![mouthIdx],
                        (audioLevel * 1.8) + mouthNoise,
                        0.35
                    );
                }

                // Add subtle mouth corner movement for a "soul"
                const smileIdx = dict['mouthSmile'] ?? dict['mouthSmileLeft'];
                if (smileIdx !== undefined) {
                    const smilePulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 0.05;
                    mesh.morphTargetInfluences![smileIdx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences![smileIdx], smilePulse, 0.1);
                }

                // --- BROWS (Micro-expressions) ---
                const browIdx = dict['browInnerUp'] ?? dict['browUp'];
                if (browIdx !== undefined) {
                    const browNoise = Math.sin(state.clock.elapsedTime * 3) * 0.02;
                    mesh.morphTargetInfluences![browIdx] = THREE.MathUtils.lerp(
                        mesh.morphTargetInfluences![browIdx],
                        (audioLevel * 0.5) + browNoise,
                        0.15
                    );
                }

                // --- EYES (Natural Blinking & Micro-movements) ---
                const blinkIdx = dict['eyeBlinkLeft'] ?? dict['eyeBlinkRight'] ?? dict['eyesClosed'];
                if (blinkIdx !== undefined) {
                    if (blinkRef.current.isBlinking) {
                        // Fast close
                        mesh.morphTargetInfluences![blinkIdx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences![blinkIdx], 1, 0.6);
                        if (mesh.morphTargetInfluences![blinkIdx] > 0.98) {
                            blinkRef.current.isBlinking = false;
                            blinkRef.current.lastBlink = now;
                            // Random interval between blinks
                            blinkRef.current.nextBlink = 800 + Math.random() * 5000;
                        }
                    } else {
                        // Slower open
                        mesh.morphTargetInfluences![blinkIdx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences![blinkIdx], 0, 0.25);
                    }
                }
            }

            // --- EYE GAZE (Saccades) ---
            // Try to find eye meshes to add micro-rotations
            if (child.name.toLowerCase().includes('eye') && !child.name.toLowerCase().includes('brow')) {
                const saccadeX = Math.sin(state.clock.elapsedTime * 10) * 0.005 * (Math.random() > 0.95 ? 1 : 0);
                const saccadeY = Math.cos(state.clock.elapsedTime * 10) * 0.005 * (Math.random() > 0.95 ? 1 : 0);
                child.rotation.x += saccadeX;
                child.rotation.y += saccadeY;
            }
        });
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
                <pointLight position={[-5, 5, -5]} color={props.color} intensity={0.8} />
                <directionalLight position={[0, 10, 0]} intensity={0.5} />

                <React.Suspense fallback={null}>
                    <AvatarModel {...props} />
                    <Environment preset="city" />
                </React.Suspense>

                <ContactShadows
                    position={[0, -2, 0]}
                    opacity={0.4}
                    scale={5}
                    blur={2.5}
                    far={4}
                />

                <EffectComposer multisampling={4}>
                    <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} radius={0.3} />
                    <Vignette eskil={false} offset={0.1} darkness={0.8} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default Avatar3D;

useGLTF.preload('/models/avatar.glb');

