"use client";

/**
 * كرة الأسواق — زينة المشهد الافتتاحيّ، ونقاطها **أسواقنا الحقيقية**.
 *
 * ⚠️ **النقاط ليست عشوائية.** النموذج المُقترَح وزّع عشرين نقطة على الكرة
 * بمعادلة حلزونية — أي «زينة تقنية» تُوحي بتغطية عالمية لا نملكها. هنا كل نقطة
 * سوقٌ فعليّ بإحداثيّات عاصمته من القاعدة، فالكرة تقول شيئاً صادقاً: ستّة
 * أسواق، هذه مواقعها. والسوق الذي يمرّ عليه المؤشّر يتوهّج ويدور نحو الواجهة.
 *
 * ⚠️ **لا تُحمَّل إلا حين تستحقّ**: مكتبة three ثقيلة، والصفحة الأولى أهمّ ما
 * عندنا. لذلك: استيراد ديناميكيّ بلا تصيير خادميّ، وتأجيل حتى خمول المتصفّح،
 * وتخطٍّ كامل على الشاشات الصغيرة (لا مكان لها أصلاً) ولمن طلب تقليل الحركة.
 *
 * ⚠️ **ولونها من الهوية**: النموذج المُقترَح كان تركوازيّاً `#0D9488`؛ لوننا
 * الكحليّ‑البنفسجيّ `#171539` والكهرمانيّ للنقاط النشطة.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface GlobePoint { code: string; lat: number; lng: number; active: boolean }

const PRIMARY = 0x7c4dd0;   // بنفسجيّ مُفتَّح ليُقرأ على خلفية داكنة
const GOLD = 0xffc107;
const RADIUS = 2;

/** إحداثيّات جغرافية → نقطة على سطح الكرة. */
function toVector(lat: number, lng: number, r = RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

export default function MarketGlobe({ points }: { points: GlobePoint[] }) {
  const host = useRef<HTMLDivElement>(null);
  // مرجع حيّ للنقاط: التدوير يقرأ آخر حالة بلا إعادة بناء المشهد عند كل تمرير.
  const live = useRef(points);
  live.current = points;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 100);
    camera.position.z = 5.4;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return; // بلا WebGL (متصفّح قديم/بيئة مقيّدة) — المشهد يبقى بلا كرة
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const lamp = new THREE.PointLight(PRIMARY, 60);
    lamp.position.set(4, 4, 5);
    scene.add(lamp);

    const globe = new THREE.Group();
    scene.add(globe);

    // شبكة سلكية خفيفة — حضورٌ لا استعراض.
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 36, 24),
      new THREE.MeshBasicMaterial({ color: PRIMARY, wireframe: true, transparent: true, opacity: 0.12 }),
    );
    globe.add(mesh);

    const dotGeo = new THREE.SphereGeometry(0.055, 14, 14);
    const dots: { code: string; mesh: THREE.Mesh; halo: THREE.Mesh }[] = [];
    for (const p of points) {
      const pos = toVector(p.lat, p.lng);
      const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: GOLD }));
      dot.position.copy(pos);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 14, 14),
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.18 }),
      );
      halo.position.copy(pos);
      globe.add(dot, halo);
      dots.push({ code: p.code, mesh: dot, halo });
    }

    // البداية: أسواقنا (الجزيرة والشام ووادي النيل) مواجهةً للكاميرا.
    globe.rotation.y = -((40 + 180) * Math.PI) / 180;
    globe.rotation.x = 0.25;

    let raf = 0;
    let running = true;
    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      globe.rotation.y += 0.0016;
      const t = performance.now() / 600;
      for (const d of dots) {
        const on = live.current.find((p) => p.code === d.code)?.active;
        const pulse = on ? 1.6 + Math.sin(t) * 0.35 : 1;
        d.halo.scale.setScalar(pulse);
        (d.halo.material as THREE.MeshBasicMaterial).opacity = on ? 0.42 : 0.16;
        d.mesh.scale.setScalar(on ? 1.5 : 1);
      }
      renderer.render(scene, camera);
    };
    tick();

    // إيقاف الرسم خارج الشاشة أو في تبويب مخفيّ — لا نُحرق بطارية على زينة.
    const onVisible = () => {
      running = !document.hidden;
      if (running) tick(); else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVisible);

    const onResize = () => {
      const nw = el.clientWidth || 1;
      const nh = el.clientHeight || 1;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("resize", onResize);
      // ⚠️ التخلّص يدويّ في three: بلا `dispose` تتسرّب ذاكرة GPU عند كل تنقّل.
      dots.forEach((d) => {
        (d.mesh.material as THREE.Material).dispose();
        (d.halo.material as THREE.Material).dispose();
        d.halo.geometry.dispose();
      });
      dotGeo.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // النقاط تُبنى مرّة؛ تغيّر «النشط» يُقرأ من `live` بلا إعادة بناء.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);

  return <div ref={host} aria-hidden className="w-full h-full" />;
}
