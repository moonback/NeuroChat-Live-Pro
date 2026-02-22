import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder, Environment, ContactShadows, RoundedBox } from '@react-three/drei';
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

    const dataArray = useMemo(() => new Uint8Array(256), []);
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const blinkRef = useRef({ lastBlink: 0, nextBlink: 2500, isBlinking: false, progress: 1 });

    useFrame((state) => {
        let audioLevel = 0;
        const now = state.clock.elapsedTime * 1000;

        if (isActive && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 2; i < 20; i++) sum += dataArray[i];
            audioLevel = sum / (18 * 255);
        }

        // Rotations
        if (neckRef.current) {
            const targetRotationY = (mousePos.current.x * Math.PI) / 4;
            const targetRotationX = (mousePos.current.y * Math.PI) / 8;
            neckRef.current.rotation.y = THREE.MathUtils.lerp(neckRef.current.rotation.y, targetRotationY, 0.08);
            neckRef.current.rotation.x = THREE.MathUtils.lerp(neckRef.current.rotation.x, targetRotationX, 0.08);
        }

        if (headGroupRef.current) {
            headGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
        }

        // Mouth
        if (mouthRef.current) {
            const targetScaleY = 0.2 + audioLevel * 5;
            mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, 0.3);
            (mouthRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + audioLevel * 15;
        }

        // Blink
        if (!blinkRef.current.isBlinking && now - blinkRef.current.lastBlink > blinkRef.current.nextBlink) {
            blinkRef.current.isBlinking = true;
        }
        if (blinkRef.current.isBlinking) {
            blinkRef.current.progress -= 0.2;
            if (blinkRef.current.progress <= 0) {
                blinkRef.current.progress = 0;
                blinkRef.current.isBlinking = false;
                blinkRef.current.lastBlink = now;
                blinkRef.current.nextBlink = 3000 + Math.random() * 5000;
            }
        } else {
            blinkRef.current.progress = THREE.MathUtils.lerp(blinkRef.current.progress, 1, 0.25);
        }

        // Eyes
        if (leftEyeRef.current && rightEyeRef.current) {
            const eyeIntensity = 4 + audioLevel * 15;
            (leftEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;
            (rightEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;

            leftEyeRef.current.scale.y = blinkRef.current.progress;
            rightEyeRef.current.scale.y = blinkRef.current.progress;
        }
    });

    return (
        <group ref={neckRef}>
            {/* MECHANICAL NECK */}
            <group position={[0, -0.8, 0]}>
                <Cylinder args={[0.2, 0.25, 0.6, 16]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                </Cylinder>
                <Cylinder args={[0.05, 0.05, 0.6, 8]} position={[0.15, 0, 0.15]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                </Cylinder>
                <Cylinder args={[0.05, 0.05, 0.6, 8]} position={[-0.15, 0, 0.15]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                </Cylinder>
            </group>

            <group ref={headGroupRef}>
                {/* MAIN CHASSIS (Robotic Shape) */}
                <RoundedBox args={[1.2, 1.4, 1]} radius={0.2} smoothness={4}>
                    <meshStandardMaterial
                        color="#0a0a0a"
                        metalness={0.9}
                        roughness={0.2}
                        envMapIntensity={1}
                    />
                </RoundedBox>

                {/* TOP PLATE */}
                <Box args={[1.3, 0.1, 1.1]} position={[0, 0.7, 0]}>
                    <meshStandardMaterial color="#151515" metalness={1} roughness={0} />
                </Box>

                {/* VISOR AREA */}
                <Box args={[1.2, 0.5, 0.1]} position={[0, 0.2, 0.5]}>
                    <meshStandardMaterial color="#000" metalness={1} roughness={0} />
                </Box>

                {/* EYES (Visor Display) */}
                <group position={[0, 0.2, 0.56]}>
                    <mesh ref={leftEyeRef} position={[-0.3, 0, 0]}>
                        <planeGeometry args={[0.35, 0.2]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} transparent opacity={0.9} />
                    </mesh>
                    <mesh ref={rightEyeRef} position={[0.3, 0, 0]}>
                        <planeGeometry args={[0.35, 0.2]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} transparent opacity={0.9} />
                    </mesh>
                </group>

                {/* SIDE PANELS (Ears/Sensors) */}
                <group position={[-0.65, 0.1, 0]}>
                    <Box args={[0.2, 0.8, 0.6]}>
                        <meshStandardMaterial color="#111" metalness={1} />
                    </Box>
                    <Box args={[0.05, 0.4, 0.4]} position={[-0.1, 0, 0]}>
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
                    </Box>
                </group>
                <group position={[0.65, 0.1, 0]}>
                    <Box args={[0.2, 0.8, 0.6]}>
                        <meshStandardMaterial color="#111" metalness={1} />
                    </Box>
                    <Box args={[0.05, 0.4, 0.4]} position={[0.1, 0, 0]}>
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
                    </Box>
                </group>

                {/* DECORATIVE LIGHT LINES (Circuits) */}
                <Box args={[0.02, 0.8, 1.02]} position={[0.61, -0.2, 0]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                </Box>
                <Box args={[0.02, 0.8, 1.02]} position={[-0.61, -0.2, 0]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                </Box>

                {/* MOUTH (Digital Equalizer) */}
                <group position={[0, -0.45, 0.51]}>
                    {/* Background plate */}
                    <Box args={[0.6, 0.2, 0.05]} position={[0, 0, -0.05]}>
                        <meshStandardMaterial color="#000" />
                    </Box>
                    <mesh ref={mouthRef} position={[0, 0, 0]}>
                        <boxGeometry args={[0.5, 0.04, 0.01]} />
                        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={10} />
                    </mesh>
                </group>

                {/* TECH ANTENNAS */}
                <Cylinder args={[0.01, 0.01, 0.5]} position={[-0.4, 0.75, 0]} rotation={[0.4, 0, 0.2]}>
                    <meshStandardMaterial color="#333" />
                </Cylinder>
                <Cylinder args={[0.01, 0.01, 0.5]} position={[0.4, 0.75, 0]} rotation={[0.4, 0, -0.2]}>
                    <meshStandardMaterial color="#333" />
                </Cylinder>
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
                camera={{ position: [0, 0, 4], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.4} />
                <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-5, 5, -5]} color={props.color} intensity={1} />

                <RoboticHead {...props} />

                <Environment preset="city" />

                <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={10} blur={2} far={4} />

                <EffectComposer multisampling={4}>
                    <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.4} />
                    <Noise opacity={0.03} />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default Avatar3D;
