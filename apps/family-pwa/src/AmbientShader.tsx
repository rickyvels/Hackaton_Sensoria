import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';

export default function AmbientShader({ variant }: { variant: 'login' | 'route' }) {
  const login = variant === 'login';
  return <ShaderGradientCanvas pixelDensity={.7} lazyLoad pointerEvents="none" style={{ position: 'absolute', inset: 0 }}><ShaderGradient animate="on" type="sphere" cDistance={login ? 3.3 : 3.4} cPolarAngle={login ? 115 : 100} color1={login ? '#c6f1dd' : '#4cd6bc'} color2={login ? '#77ccc2' : '#116d76'} color3={login ? '#f6fbf7' : '#0c3340'} uSpeed={login ? .1 : .14} uStrength={login ? .55 : .8} uDensity={login ? .7 : .8} grain="on" /></ShaderGradientCanvas>;
}
