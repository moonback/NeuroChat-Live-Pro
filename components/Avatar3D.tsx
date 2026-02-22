import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Avatar3DProps {
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
    color: string;
    isActive: boolean;
}

const RoboticHead: React.FC<Avatar3DProps> = ({ analyserRef, color, isActive }) => {
    const headGroupRef = useRef<THREE.Group>(null);
    const neckRef = useRef<THREE.Group>(null);
    const mouthRef = useRef<THREE.Mesh>(null);
    const leftEyeRef = useRef<THREE.Mesh>(null);
    const rightEyeRef = useRef<THREE.Mesh>(null);
    const innerCoreRef = useRef<THREE.Mesh>(null);

    // Audio state
    const dataArray = useMemo(() => new Uint8Array(256), []);

    // Global Mouse Tracking (using a ref to store position)
    const mousePos = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize to -1 to 1
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Blink state
    const blinkRef = useRef({ lastBlink: 0, nextBlink: 2000, isBlinking: false, progress: 1 });

    useFrame((state) => {
        let audioLevel = 0;
        const now = state.clock.elapsedTime * 1000;

        // 1. Audio Analysis
        if (isActive && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 2; i < 20; i++) sum += dataArray[i];
            audioLevel = sum / (18 * 255);
        }

        // 2. Head & Neck Rotation (Look at global mouse)
        if (neckRef.current) {
            const targetRotationY = (mousePos.current.x * Math.PI) / 3.5;
            const targetRotationX = (mousePos.current.y * Math.PI) / 6;

            neckRef.current.rotation.y = THREE.MathUtils.lerp(neckRef.current.rotation.y, targetRotationY, 0.08);
            neckRef.current.rotation.x = THREE.MathUtils.lerp(neckRef.current.rotation.x, targetRotationX, 0.08);
        }

        // 3. Floating Animation
        if (headGroupRef.current) {
            headGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.12;
            headGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }

        // 4. Mouth Animation
        if (mouthRef.current) {
            const targetScaleY = 0.08 + audioLevel * 4;
            mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, 0.3);
            (mouthRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + audioLevel * 15;
        }

        // 5. Blink Logic
        if (!blinkRef.current.isBlinking && now - blinkRef.current.lastBlink > blinkRef.current.nextBlink) {
            blinkRef.current.isBlinking = true;
        }

        if (blinkRef.current.isBlinking) {
            blinkRef.current.progress -= 0.15; // Close speed
            if (blinkRef.current.progress <= 0) {
                blinkRef.current.progress = 0;
                blinkRef.current.isBlinking = false;
                blinkRef.current.lastBlink = now;
                blinkRef.current.nextBlink = 2000 + Math.random() * 4000;
            }
        } else {
            blinkRef.current.progress = THREE.MathUtils.lerp(blinkRef.current.progress, 1, 0.2); // Open speed
        }

        // 6. Eyes Glow & Scale
        if (leftEyeRef.current && rightEyeRef.current) {
            const eyeIntensity = 3 + audioLevel * 20;
            (leftEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;
            (rightEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;

            const baseScale = 1 + audioLevel * 0.4;
            leftEyeRef.current.scale.set(baseScale, baseScale * blinkRef.current.progress, baseScale);
            rightEyeRef.current.scale.set(baseScale, baseScale * blinkRef.current.progress, baseScale);
        }

        // 7. Inner Core Pulse
        if (innerCoreRef.current) {
            const corePulse = 0.8 + Math.sin(state.clock.elapsedTime * 2.5) * 0.4 + audioLevel * 3;
            (innerCoreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = corePulse;
            innerCoreRef.current.rotation.y += 0.01;
            innerCoreRef.current.rotation.x += 0.005;
        }
    });

    return (
        <group ref={neckRef}>
            <group ref={headGroupRef}>
                {/* Outer Glass Shell */}
                <Sphere args={[1, 64, 64]}>
                    <meshPhysicalMaterial
                        color="#000"
                        roughness={0.02}
                        metalness={0.1}
                        transmission={0.95}
                        thickness={1.5}
                        transparent={true}
                        opacity={0.35}
                        envMapIntensity={2}
                    />
                </Sphere>

                {/* Dynamic Inner Core (Tech Brain) */}
                <mesh ref={innerCoreRef}>
                    <octahedronGeometry args={[0.7, 2]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={1}
                        wireframe
                        transparent
                        opacity={0.4}
                    />
                </mesh>

                {/* Secondary Inner Core (Solid) */}
                <mesh>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                </mesh>

                {/* EYES */}
                <group position={[0, 0.25, 0.88]}>
                    <mesh ref={leftEyeRef} position={[-0.35, 0, 0.05]}>
                        <sphereGeometry args={[0.13, 32, 32]} />
                        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={10} />
                    </mesh>
                    <mesh ref={rightEyeRef} position={[0.35, 0, 0.05]}>
                        <sphereGeometry args={[0.13, 32, 32]} />
                        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={10} />
                    </mesh>
                    <pointLight position={[0, 0, 0.2]} distance={2} intensity={4} color={color} />
                </group>

                {/* DIGITAL MOUTH */}
                <mesh ref={mouthRef} position={[0, -0.4, 0.9]}>
                    <boxGeometry args={[0.5, 0.06, 0.05]} />
                    <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={10} />
                </mesh>

                {/* ANTENNAS (Glowing Tips) */}
                <group rotation={[0, 0, 0.5]} position={[-0.8, 0.6, 0]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.01, 0.01, 0.8]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    <mesh position={[0, 0.4, 0]}>
                        <sphereGeometry args={[0.04, 16, 16]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
                    </mesh>
                </group>
                <group rotation={[0, 0, -0.5]} position={[0.8, 0.6, 0]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.01, 0.01, 0.8]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    <mesh position={[0, 0.4, 0]}>
                        <sphereGeometry args={[0.04, 16, 16]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

const Avatar3D: React.FC<Avatar3DProps> = (props) => {
    return (
        <div className="absolute inset-0 z-0 bg-transparent overflow-hidden">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 4.5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.4} />
                <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-5, -5, -5]} color={props.color} intensity={1} />

                <RoboticHead {...props} />

                <Environment preset="night" />

                <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4.5} />

                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.8} radius={0.4} />
                    <Noise opacity={0.05} />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default Avatar3D;
