/**
 * PortfolioArena – holographic "battle arena" (Three.js): NFTs as neon fighters, amendments as storms.
 * Debounced updates; accepts visual params from PortfolioGamerAgent.
 */

import { useEffect, useRef } from 'react';
import type { VisualParams } from '../agents/PortfolioGamerAgent';

interface PortfolioArenaProps {
  visual: VisualParams;
  className?: string;
  width?: number;
  height?: number;
}

export function PortfolioArena({ visual, className = '', width = 320, height = 200 }: PortfolioArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let renderer: { domElement: HTMLElement; setSize: (w: number, h: number) => void; setPixelRatio: (n: number) => void; render: (scene: unknown, camera: unknown) => void; dispose: () => void } | null = null;
    let frameId = 0;

    (async () => {
      const threeMod = 'three';
      const THREE = await import(/* @vite-ignore */ threeMod);
      if (cancelled) return;
      const w = width;
      const h = height;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0f);
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
      camera.position.set(0, 2, 6);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const hue = (visual.neonHue % 360) / 360;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
      });

      const meshes: Array<{ position: { set: (x: number, y: number, z: number) => void; y?: number }; rotation: { y?: number }; geometry: { dispose: () => void }; material: { dispose: () => void } }> = [];
      const n = Math.min(12, Math.max(1, visual.fighterCount));
      for (let i = 0; i < n; i++) {
        const geometry = new THREE.SphereGeometry(0.15, 8, 6);
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.position.set((i % 4) * 0.5 - 0.75, 0.3 + Math.floor(i / 4) * 0.4, (i % 2) * 0.3);
        scene.add(mesh);
        meshes.push(mesh);
      }

      const clock = new THREE.Clock();
      function animate() {
        if (cancelled || !renderer) return;
        const t = clock.getElapsedTime();
        meshes.forEach((m, i) => {
          m.position.y = 0.3 + Math.floor(i / 4) * 0.4 + Math.sin(t + i) * 0.05;
          m.rotation.y = t * 0.3 + i;
        });
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      }
      animate();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      if (renderer) {
        renderer.dispose();
        if (container?.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      }
    };
  }, [visual.fighterCount, visual.neonHue, width, height]);

  return <div ref={containerRef} className={className} style={{ width, height, minHeight: height }} />;
}
