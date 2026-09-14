"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import type { TopSellingSlice } from "@/types/dashboardStats";

const DEFAULT_COLORS = ["#0ea5e9", "#1d4ed8", "#38bdf8", "#0284c7", "#7dd3fc"];
const DEPTH = 0.45;
const INNER_RADIUS = 1.15;
const OUTER_RADIUS = 2.1;
const PAD_ANGLE = 0.045; // gap between slices — kills the z-fighting seam

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

interface SliceDatum {
  name: string;
  value: number;
  color: string;
  startAngle: number;
  endAngle: number;
  percent: number;
}

function createRingSegmentShape(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const shape = new THREE.Shape();
  const segments = Math.max(2, Math.round(((endAngle - startAngle) / (Math.PI * 2)) * 128));

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = segments; i >= 0; i--) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
  }
  shape.closePath();
  return shape;
}

function Slice({
  datum,
  isHovered,
  onHover,
}: {
  datum: SliceDatum;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lift = useRef(0);

  // shrink each slice slightly inward from its neighbors so there's always a visible gap
  const paddedStart = datum.startAngle + PAD_ANGLE / 2;
  const paddedEnd = datum.endAngle - PAD_ANGLE / 2;
  const hasVisibleWidth = paddedEnd > paddedStart;

  const geometry = useMemo(() => {
    if (!hasVisibleWidth) return null;
    const shape = createRingSegmentShape(INNER_RADIUS, OUTER_RADIUS, paddedStart, paddedEnd);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 6,
      curveSegments: 48,
    });
    geo.center();
    return geo;
  }, [paddedStart, paddedEnd, hasVisibleWidth]);

  // recompute the mesh's world offset since geometry.center() re-origins it
  const shapeCenter = useMemo(() => {
    const shape = createRingSegmentShape(INNER_RADIUS, OUTER_RADIUS, paddedStart, paddedEnd);
    const box = new THREE.Box3();
    const points2d = shape.getPoints(64);
    points2d.forEach((p) => box.expandByPoint(new THREE.Vector3(p.x, p.y, 0)));
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }, [paddedStart, paddedEnd]);

  const edgesGeometry = useMemo(() => {
    if (!geometry) return null;
    return new THREE.EdgesGeometry(geometry, 35);
  }, [geometry]);

  const midAngle = (datum.startAngle + datum.endAngle) / 2;

  useFrame(() => {
    const targetLift = isHovered ? 0.22 : 0;
    const targetExplode = isHovered ? 0.14 : 0;
    lift.current += (targetLift - lift.current) * 0.15;

    if (meshRef.current) {
      meshRef.current.position.z = lift.current;
      meshRef.current.position.x = shapeCenter.x + Math.cos(midAngle) * (lift.current > 0.01 ? targetExplode : 0);
      meshRef.current.position.y = shapeCenter.y + Math.sin(midAngle) * (lift.current > 0.01 ? targetExplode : 0);
    }
  });

  if (!geometry) return null;

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[shapeCenter.x, shapeCenter.y, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <meshPhysicalMaterial
          color={datum.color}
          metalness={0.25}
          roughness={0.3}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
          reflectivity={0.4}
          envMapIntensity={0.9}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
        {edgesGeometry && (
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.18} />
          </lineSegments>
        )}
      </mesh>

      {isHovered && (
        <Html
          position={[Math.cos(midAngle) * OUTER_RADIUS * 0.85, Math.sin(midAngle) * OUTER_RADIUS * 0.85, DEPTH + 0.35]}
          center
        >
          <div className="pointer-events-none whitespace-nowrap rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-md">
            <p className="font-medium text-ink">{datum.name}</p>
            <p className="mt-0.5 text-ink/60">
              {formatNumber(datum.value)} units · {datum.percent}%
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function PieScene({ slices }: { slices: SliceDatum[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      <ambientLight intensity={0.65} />

      <directionalLight
        position={[3, 4, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#dbeafe" />
      <directionalLight position={[0, 3, -5]} intensity={0.4} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#334155", 0.35]} />

      {/* shallower tilt so you see the top face, not the underside */}
      <group rotation={[-Math.PI / 3.4, 0, 0]}>
        {slices.map((slice, index) => (
          <Slice
            key={slice.name + index}
            datum={slice}
            isHovered={hoveredIndex === index}
            onHover={(hovered) => setHoveredIndex(hovered ? index : null)}
          />
        ))}
      </group>

      <ContactShadows position={[0, -0.9, 0]} opacity={0.3} scale={8} blur={2.4} far={2} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.9}
        maxPolarAngle={Math.PI / 2.4}
        autoRotate
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export function TopSellingPieChart({ data }: { data: TopSellingSlice[] }) {
  const total = useMemo(() => data.reduce((sum, slice) => sum + slice.value, 0), [data]);

  const slices: SliceDatum[] = useMemo(() => {
    let cumulative = -Math.PI / 2;
    return data.map((slice, index) => {
      const value = slice.value;
      const angle = total ? (value / total) * Math.PI * 2 : 0;
      const startAngle = cumulative;
      const endAngle = cumulative + angle;
      cumulative = endAngle;
      return {
        name: slice.name,
        value,
        color: slice.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        startAngle,
        endAngle,
        percent: total ? Math.round((value / total) * 100) : 0,
      };
    });
  }, [data, total]);

  return (
    <div className="flex min-h-[280px] flex-col rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Top selling devices</h3>
        <span className="text-xs text-ink/40">By quantity sold</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-[210px] w-[210px] shrink-0">
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 4.6, 5.2], fov: 30 }}
            style={{ background: "transparent" }}
          >
            <Suspense fallback={null}>
              <PieScene slices={slices} />
            </Suspense>
          </Canvas>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold leading-none text-ink">
              {formatNumber(total)}
            </span>
            <span className="mt-1 text-[11px] text-ink/50">units sold</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-1 flex-col gap-2.5 self-stretch overflow-y-auto sm:max-h-[168px]">
          {slices.map((item) => (
            <li key={item.name} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 truncate text-ink/80" title={item.name}>
                {item.name}
              </span>
              <span className="shrink-0 tabular-nums font-medium text-ink">{item.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}