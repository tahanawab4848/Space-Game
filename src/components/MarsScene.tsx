import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

function Mars() {
  const globe = useRef<Mesh>(null)
  useFrame((_, delta) => { if (globe.current) globe.current.rotation.y += delta * 0.045 })
  return <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.4}><mesh ref={globe} position={[1.5, .1, 0]}><sphereGeometry args={[2.2, 64, 64]} /><meshStandardMaterial color="#b64d35" roughness={.82} metalness={.08} emissive="#3f130f" emissiveIntensity={.2} /></mesh></Float>
}
function Habitat() { return <group position={[-1.8, -1.35, .6]} rotation={[0, .45, 0]}><mesh><cylinderGeometry args={[.72, .72, .35, 32, 1, false, 0, Math.PI]} /><meshStandardMaterial color="#d8e4e9" roughness={.35} metalness={.55} /></mesh><mesh position={[.88, -.13, 0]}><boxGeometry args={[1.15, .45, .65]} /><meshStandardMaterial color="#8fc9d6" metalness={.45} roughness={.35} /></mesh><pointLight position={[0, .5, 1]} intensity={4} distance={4} color="#ffbf6f" /></group> }
export function MarsScene({ compact = false }: { compact?: boolean }) { return <div className={compact ? 'h-44 w-full' : 'absolute inset-0'}><Canvas camera={{ position: [0, 0, 7], fov: 46 }} dpr={[1, 1.5]}><color attach="background" args={['#070a16']} /><fog attach="fog" args={['#070a16', 5, 15]} /><ambientLight intensity={.45} /><directionalLight position={[4, 3, 4]} intensity={2.2} color="#ffe2bd" /><Stars radius={55} depth={36} count={1400} factor={3} saturation={0} fade speed={.35} /><Mars /><Habitat /><OrbitControls enablePan={false} enableZoom={false} autoRotate={false} maxPolarAngle={Math.PI * .7} minPolarAngle={Math.PI * .28} /></Canvas></div> }
