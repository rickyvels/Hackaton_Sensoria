import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';

export default function AmbientShader() {
  return <ShaderGradientCanvas pixelDensity={1} lazyLoad pointerEvents="none" style={{ position: 'absolute', inset: 0 }}><ShaderGradient animate="on" type="sphere" cDistance={3.7} cPolarAngle={120} color1="#4ed4c4" color2="#126071" color3="#0a2835" uSpeed={0.18} uStrength={1.3} uDensity={1.1} grain="on" /></ShaderGradientCanvas>;
}
