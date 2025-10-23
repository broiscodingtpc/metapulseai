'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './LiquidEther.css';

export default function LiquidEther({ 
  mouseForce = 20, 
  cursorSize = 100, 
  isViscous = false, 
  viscous = 30, 
  iterationsViscous = 32, 
  iterationsPoisson = 32, 
  dt = 0.014, 
  BFECC = true, 
  resolution = 0.5, 
  isBounce = false, 
  colors = ['#5227FF', '#FF9FFC', '#B19EEF'], 
  style = {}, 
  className = '', 
  autoDemo = true, 
  autoSpeed = 0.5, 
  autoIntensity = 2.2, 
  takeoverDuration = 0.25, 
  autoResumeDelay = 1000, 
  autoRampDuration = 0.6 
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const webglRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(true);
  const resizeRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    function makePaletteTexture(stops: any) {
      let arr;
      if (Array.isArray(stops) && stops.length > 0) {
        if (stops.length === 1) {
          arr = [stops[0], stops[0]];
        } else {
          arr = stops;
        }
      } else {
        arr = ['#ffffff', '#ffffff'];
      }
      const w = arr.length;
      const data = new Uint8Array(w * 4);
      for (let i = 0; i < w; i++) {
        const c = new THREE.Color(arr[i]);
        data[i * 4 + 0] = Math.round(c.r * 255);
        data[i * 4 + 1] = Math.round(c.g * 255);
        data[i * 4 + 2] = Math.round(c.b * 255);
        data[i * 4 + 3] = 255;
      }
      const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      return tex;
    }

    const paletteTex = makePaletteTexture(colors);
    const bgVec4 = new THREE.Vector4(0, 0, 0, 0); // always transparent

    class CommonClass {
      width: number;
      height: number;
      aspect: number;
      pixelRatio: number;
      isMobile: boolean;
      breakpoint: number;
      fboWidth: any;
      fboHeight: any;
      time: number;
      delta: number;
      container: any;
      renderer: any;
      clock: any;

      constructor() {
        this.width = 0;
        this.height = 0;
        this.aspect = 1;
        this.pixelRatio = 1;
        this.isMobile = false;
        this.breakpoint = 768;
        this.fboWidth = null;
        this.fboHeight = null;
        this.time = 0;
        this.delta = 0;
        this.container = null;
        this.renderer = null;
        this.clock = null;
      }

      init(container: any) {
        this.container = container;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        this.clock = new THREE.Clock();
        this.clock.start();
      }

      resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;
        if (this.renderer) this.renderer.setSize(this.width, this.height, false);
      }

      update() {
        this.delta = this.clock.getDelta();
        this.time += this.delta;
      }
    }

    const Common = new CommonClass();

    class MouseClass {
      mouseMoved: boolean;
      coords: THREE.Vector2;
      coords_old: THREE.Vector2;
      diff: THREE.Vector2;
      timer: any;
      container: any;
      _onMouseMove: (event: MouseEvent) => void;
      _onTouchStart: (event: TouchEvent) => void;
      _onTouchMove: (event: TouchEvent) => void;
      _onMouseEnter: () => void;
      _onMouseLeave: () => void;
      _onTouchEnd: () => void;
      isHoverInside: boolean;
      hasUserControl: boolean;
      isAutoActive: boolean;
      autoIntensity: number;
      takeoverActive: boolean;
      takeoverStartTime: number;
      takeoverDuration: number;
      takeoverFrom: THREE.Vector2;
      takeoverTo: THREE.Vector2;
      onInteract: (() => void) | null;

      constructor() {
        this.mouseMoved = false;
        this.coords = new THREE.Vector2();
        this.coords_old = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;
        this.container = null;
        this._onMouseMove = this.onDocumentMouseMove.bind(this);
        this._onTouchStart = this.onDocumentTouchStart.bind(this);
        this._onTouchMove = this.onDocumentTouchMove.bind(this);
        this._onMouseEnter = this.onMouseEnter.bind(this);
        this._onMouseLeave = this.onMouseLeave.bind(this);
        this._onTouchEnd = this.onTouchEnd.bind(this);
        this.isHoverInside = false;
        this.hasUserControl = false;
        this.isAutoActive = false;
        this.autoIntensity = 2.0;
        this.takeoverActive = false;
        this.takeoverStartTime = 0;
        this.takeoverDuration = 0.25;
        this.takeoverFrom = new THREE.Vector2();
        this.takeoverTo = new THREE.Vector2();
        this.onInteract = null;
      }

      init(container: any) {
        this.container = container;
        container.addEventListener('mousemove', this._onMouseMove, false);
        container.addEventListener('touchstart', this._onTouchStart, false);
        container.addEventListener('touchmove', this._onTouchMove, false);
        container.addEventListener('mouseenter', this._onMouseEnter, false);
        container.addEventListener('mouseleave', this._onMouseLeave, false);
        container.addEventListener('touchend', this._onTouchEnd, false);
      }

      dispose() {
        if (!this.container) return;
        this.container.removeEventListener('mousemove', this._onMouseMove, false);
        this.container.removeEventListener('touchstart', this._onTouchStart, false);
        this.container.removeEventListener('touchmove', this._onTouchMove, false);
        this.container.removeEventListener('mouseenter', this._onMouseEnter, false);
        this.container.removeEventListener('mouseleave', this._onMouseLeave, false);
        this.container.removeEventListener('touchend', this._onTouchEnd, false);
      }

      setCoords(x: number, y: number) {
        if (!this.container) return;
        if (this.timer) clearTimeout(this.timer);
        const rect = this.container.getBoundingClientRect();
        const nx = (x - rect.left) / rect.width;
        const ny = (y - rect.top) / rect.height;
        this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
        this.mouseMoved = true;
        this.timer = setTimeout(() => {
          this.mouseMoved = false;
        }, 100);
      }

      setNormalized(nx: number, ny: number) {
        this.coords.set(nx, ny);
        this.mouseMoved = true;
      }

      onDocumentMouseMove(event: MouseEvent) {
        if (this.onInteract) this.onInteract();
        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
          const rect = this.container.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width;
          const ny = (event.clientY - rect.top) / rect.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
          this.takeoverStartTime = performance.now();
          this.takeoverActive = true;
          this.hasUserControl = true;
          this.isAutoActive = false;
          return;
        }
        this.setCoords(event.clientX, event.clientY);
        this.hasUserControl = true;
      }

      onDocumentTouchStart(event: TouchEvent) {
        if (event.touches.length === 1) {
          const t = event.touches[0];
          if (this.onInteract) this.onInteract();
          this.setCoords(t.pageX, t.pageY);
          this.hasUserControl = true;
        }
      }

      onDocumentTouchMove(event: TouchEvent) {
        if (event.touches.length === 1) {
          const t = event.touches[0];
          if (this.onInteract) this.onInteract();
          this.setCoords(t.pageX, t.pageY);
        }
      }

      onTouchEnd() {
        this.isHoverInside = false;
      }

      onMouseEnter() {
        this.isHoverInside = true;
      }

      onMouseLeave() {
        this.isHoverInside = false;
      }

      update() {
        if (this.takeoverActive) {
          const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
          if (t >= 1) {
            this.takeoverActive = false;
            this.coords.copy(this.takeoverTo);
            this.coords_old.copy(this.coords);
            this.diff.set(0, 0);
          } else {
            const k = t * t * (3 - 2 * t);
            this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
          }
        }
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);
        if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
        if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
      }
    }

    const Mouse = new MouseClass();

    class AutoDriver {
      mouse: MouseClass;
      manager: any;
      enabled: boolean;
      speed: number;
      resumeDelay: number;
      rampDurationMs: number;
      active: boolean;
      current: THREE.Vector2;
      target: THREE.Vector2;
      lastTime: number;
      activationTime: number;
      margin: number;
      _tmpDir: THREE.Vector2;

      constructor(mouse: MouseClass, manager: any, opts: any) {
        this.mouse = mouse;
        this.manager = manager;
        this.enabled = opts.enabled;
        this.speed = opts.speed; // normalized units/sec
        this.resumeDelay = opts.resumeDelay || 3000; // ms
        this.rampDurationMs = (opts.rampDuration || 0) * 1000;
        this.active = false;
        this.current = new THREE.Vector2(0, 0);
        this.target = new THREE.Vector2();
        this.lastTime = performance.now();
        this.activationTime = 0;
        this.margin = 0.2;
        this._tmpDir = new THREE.Vector2(); // reuse temp vector to avoid per-frame alloc
        this.pickNewTarget();
      }

      pickNewTarget() {
        const r = Math.random;
        this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
      }

      forceStop() {
        this.active = false;
        this.mouse.isAutoActive = false;
      }

      update() {
        if (!this.enabled) return;
        const now = performance.now();
        const idle = now - this.manager.lastUserInteraction;
        if (idle < this.resumeDelay) {
          if (this.active) this.forceStop();
          return;
        }
        if (this.mouse.isHoverInside) {
          if (this.active) this.forceStop();
          return;
        }
        if (!this.active) {
          this.active = true;
          this.current.copy(this.mouse.coords);
          this.lastTime = now;
          this.activationTime = now;
        }
        if (!this.active) return;
        this.mouse.isAutoActive = true;
        let dtSec = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dtSec > 0.2) dtSec = 0.016;
        const dir = this._tmpDir.subVectors(this.target, this.current);
        const dist = dir.length();
        if (dist < 0.01) {
          this.pickNewTarget();
          return;
        }
        dir.normalize();
        let ramp = 1;
        if (this.rampDurationMs > 0) {
          const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
          ramp = t * t * (3 - 2 * t);
        }
        const step = this.speed * dtSec * ramp;
        const move = Math.min(step, dist);
        this.current.addScaledVector(dir, move);
        this.mouse.setNormalized(this.current.x, this.current.y);
      }
    }

    // Shader code (simplified for brevity)
    const face_vert = `
      attribute vec3 position;
      uniform vec2 px;
      uniform vec2 boundarySpace;
      varying vec2 uv;
      precision highp float;
      void main(){
        vec3 pos = position;
        vec2 scale = 1.0 - boundarySpace * 2.0;
        pos.xy = pos.xy * scale;
        uv = vec2(0.5)+(pos.xy)*0.5;
        gl_Position = vec4(pos, 1.0);
      }
    `;

    const color_frag = `
      precision highp float;
      uniform sampler2D velocity;
      uniform sampler2D palette;
      uniform vec4 bgColor;
      varying vec2 uv;
      void main(){
        vec2 vel = texture2D(velocity, uv).xy;
        float lenv = clamp(length(vel), 0.0, 1.0);
        vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
        vec3 outRGB = mix(bgColor.rgb, c, lenv);
        float outA = mix(bgColor.a, 1.0, lenv);
        gl_FragColor = vec4(outRGB, outA);
      }
    `;

    class WebGLManager {
      props: any;
      lastUserInteraction: number;
      autoDriver: AutoDriver;
      _loop: () => void;
      _resize: () => void;
      _onVisibility: () => void;
      running: boolean;
      output: any;
      scene: any;
      camera: any;

      constructor(props: any) {
        this.props = props;
        Common.init(props.$wrapper);
        Mouse.init(props.$wrapper);
        Mouse.autoIntensity = props.autoIntensity;
        Mouse.takeoverDuration = props.takeoverDuration;
        this.lastUserInteraction = performance.now();
        Mouse.onInteract = () => {
          this.lastUserInteraction = performance.now();
          if (this.autoDriver) this.autoDriver.forceStop();
        };
        this.autoDriver = new AutoDriver(Mouse, this, {
          enabled: props.autoDemo,
          speed: props.autoSpeed,
          resumeDelay: props.autoResumeDelay,
          rampDuration: props.autoRampDuration
        });
        this.init();
        this._loop = this.loop.bind(this);
        this._resize = this.resize.bind(this);
        window.addEventListener('resize', this._resize);
        this._onVisibility = () => {
          const hidden = document.hidden;
          if (hidden) {
            this.pause();
          } else if (isVisibleRef.current) {
            this.start();
          }
        };
        document.addEventListener('visibilitychange', this._onVisibility);
        this.running = false;
      }

      init() {
        this.props.$wrapper.prepend(Common.renderer.domElement);
        this.output = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.RawShaderMaterial({
            vertexShader: face_vert,
            fragmentShader: color_frag,
            transparent: true,
            depthWrite: false,
            uniforms: {
              velocity: { value: null },
              boundarySpace: { value: new THREE.Vector2() },
              palette: { value: paletteTex },
              bgColor: { value: bgVec4 }
            }
          })
        );
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.scene.add(this.output);
      }

      resize() {
        Common.resize();
      }

      render() {
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene, this.camera);
      }

      loop() {
        if (!this.running) return; // safety
        this.render();
        rafRef.current = requestAnimationFrame(this._loop);
      }

      start() {
        if (this.running) return;
        this.running = true;
        this._loop();
      }

      pause() {
        this.running = false;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }

      dispose() {
        try {
          window.removeEventListener('resize', this._resize);
          document.removeEventListener('visibilitychange', this._onVisibility);
          Mouse.dispose();
          if (Common.renderer) {
            const canvas = Common.renderer.domElement;
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            Common.renderer.dispose();
          }
        } catch (e) {
          void 0;
        }
      }
    }

    const container = mountRef.current;
    container.style.position = container.style.position || 'relative';
    container.style.overflow = container.style.overflow || 'hidden';

    const webgl = new WebGLManager({
      $wrapper: container,
      autoDemo,
      autoSpeed,
      autoIntensity,
      takeoverDuration,
      autoResumeDelay,
      autoRampDuration
    });

    webglRef.current = webgl;
    webgl.start();

    // IntersectionObserver to pause rendering when not visible
    const io = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        isVisibleRef.current = isVisible;
        if (!webglRef.current) return;
        if (isVisible && !document.hidden) {
          webglRef.current.start();
        } else {
          webglRef.current.pause();
        }
      },
      { threshold: [0, 0.01, 0.1] }
    );
    io.observe(container);
    intersectionObserverRef.current = io;

    const ro = new ResizeObserver(() => {
      if (!webglRef.current) return;
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(() => {
        if (!webglRef.current) return;
        webglRef.current.resize();
      });
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch (e) {
          void 0;
        }
      }
      if (intersectionObserverRef.current) {
        try {
          intersectionObserverRef.current.disconnect();
        } catch (e) {
          void 0;
        }
      }
      if (webglRef.current) {
        webglRef.current.dispose();
      }
      webglRef.current = null;
    };
  }, [
    BFECC,
    cursorSize,
    dt,
    isBounce,
    isViscous,
    iterationsPoisson,
    iterationsViscous,
    mouseForce,
    resolution,
    viscous,
    colors,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration
  ]);

  return (
    <div 
      ref={mountRef} 
      className={`liquid-ether-container ${className || ''}`} 
      style={style} 
    />
  );
}