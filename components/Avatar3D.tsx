import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Avatar3DProps {
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
    color: string;
    isActive: boolean;
}

const AvatarModel: React.FC<Avatar3DProps> = () => {
    const { scene, animations } = useGLTF('/models/avatar.glb');
    const groupRef = React.useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, groupRef);

    // Play default idle animation if present
    useEffect(() => {
        if (actions) {
            const firstAction = actions[Object.keys(actions)[0]];
            if (firstAction) {
                firstAction.reset().fadeIn(0.5).play();
            }
        }
    }, [actions]);

    return (
        <primitive
            object={scene}
            ref={groupRef}
            scale={1.2}
            position={[0, -1.8, 0]}
            rotation={[0, 0, 0]}
        // rotation={[0, Math.PI, 0]}
        />
    );
};

const Avatar3D: React.FC<Avatar3DProps> = (props) => {
    return (
        <div className="absolute inset-0 z-0 bg-transparent overflow-hidden">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 1.2, 3.5], fov: 30 }}
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

