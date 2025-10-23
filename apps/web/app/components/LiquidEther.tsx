'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LiquidEtherProps {
  colors?: string[];
  mouseForce?: number;
  cursorSize?: number;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function LiquidEther({
  colors = ['#00e5ff', '#3fa9ff', '#7a5cff'],
  mouseForce = 15,
  cursorSize = 80,
  autoDemo = true,
  autoSpeed = 0.4,
  autoIntensity = 2.0,
  className = '',
  style = {}
}: LiquidEtherProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });
  const autoPositionRef = useRef({ x: 0, y: 0, targetX: 0.5, targetY: 0.5, angle: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Create gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create shader material for liquid effect
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        mouseVelocity: { value: new THREE.Vector2(0, 0) },
        resolution: { value: new THREE.Vector2(width, height) },
        colorTexture: { value: texture },
        force: { value: mouseForce / 10 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 mouse;
        uniform vec2 mouseVelocity;
        uniform vec2 resolution;
        uniform sampler2D colorTexture;
        uniform float force;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          vec2 center = mouse;
          float dist = length(uv - center);
          
          // Create liquid distortion based on mouse
          vec2 direction = normalize(uv - center);
          float influence = smoothstep(0.3, 0.0, dist) * force;
          vec2 offset = direction * influence * length(mouseVelocity) * 0.5;
          
          // Add flowing animation
          float flow = sin(time * 0.5 + uv.x * 3.0) * cos(time * 0.3 + uv.y * 3.0) * 0.02;
          vec2 flowOffset = vec2(flow, flow * 0.5);
          
          vec2 distortedUV = uv - offset + flowOffset;
          
          // Sample color from gradient texture
          vec4 color = texture2D(colorTexture, distortedUV);
          
          // Add glow effect near mouse
          float glow = smoothstep(0.2, 0.0, dist) * 0.5;
          color.rgb += vec3(glow);
          
          // Fade based on velocity magnitude
          float alpha = min(1.0, length(mouseVelocity) * 2.0 + 0.3);
          color.a *= alpha;
          
          gl_FragColor = color;
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking
    let isHovered = false;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Auto-demo mode
    const updateAutoPosition = (deltaTime: number) => {
      const auto = autoPositionRef.current;
      auto.angle += autoSpeed * deltaTime;
      
      // Smooth circular motion
      const targetDist = Math.random() * 0.3 + 0.3;
      auto.targetX = 0.5 + Math.cos(auto.angle) * targetDist;
      auto.targetY = 0.5 + Math.sin(auto.angle * 0.7) * targetDist;
      
      // Smooth interpolation
      const lerp = 1 - Math.exp(-deltaTime * 2);
      auto.x += (auto.targetX - auto.x) * lerp;
      auto.y += (auto.targetY - auto.y) * lerp;
    };

    // Animation loop
    let lastTime = performance.now();
    let animationId: number;

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (autoDemo && !isHovered) {
        updateAutoPosition(deltaTime);
        material.uniforms.mouse.value.set(autoPositionRef.current.x, autoPositionRef.current.y);
        material.uniforms.mouseVelocity.value.set(
          (autoPositionRef.current.x - autoPositionRef.current.targetX) * autoIntensity,
          (autoPositionRef.current.y - autoPositionRef.current.targetY) * autoIntensity
        );
      } else {
        material.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);
        material.uniforms.mouseVelocity.value.set(
          (mouseRef.current.x - mouseRef.current.prevX) * 10,
          (mouseRef.current.y - mouseRef.current.prevY) * 10
        );
      }

      material.uniforms.time.value = currentTime / 1000;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.resolution.value.set(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [colors, mouseForce, cursorSize, autoDemo, autoSpeed, autoIntensity]);

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0, ...style }}
    />
  );
}

