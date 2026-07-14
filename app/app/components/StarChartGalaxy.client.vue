<template>
  <div ref="wrap" class="scg" aria-hidden="true">
    <canvas ref="canvasEl" class="scg__canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
/**
 * The 3D Origin System — a Three.js orrery of the Warframe star chart.
 *
 * Pure presentation: receives the weighted world list (name / value /
 * normalized t), renders planets on compressed real-solar orbits around a sun,
 * moons beside their parents, void zones as Orokin diamonds on an outer ring,
 * and encodes each world's best plat/drop as a golden halo. Emits `select`
 * on planet click/tap; the page owns all data and panels.
 *
 * Client-only (.client.vue): Three.js touches WebGL/DOM at init.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface GalaxyWorld {
  name: string
  value: number
  nodeCount: number
  /** value / maxValue across all worlds, in [0,1] */
  t: number
}

const props = defineProps<{
  worlds: GalaxyWorld[]
  selected: string
  /** item-search mode: world names that drop the searched item (null = off) */
  highlighted: string[] | null
}>()

const emit = defineEmits<{
  (e: 'select', name: string | null): void
  (e: 'unsupported'): void
  (e: 'ready'): void
}>()

const wrap = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

/* ------------------------------------------------------------------ */
/* Layout: compressed real-solar order (the reference "Origin System") */
/* ------------------------------------------------------------------ */

const GOLD = '#c8a85c'
const GOLD_BRIGHT = '#e7cf95'
const CYAN = '#35d6d0'
const CYAN_BRIGHT = '#7ff0eb'

interface PlanetCfg {
  orbit: number // index on the compressed solar ladder
  angle: number // degrees around the sun (hand-spread, no overlaps)
  size: number // sphere radius, world units
  base: string // surface base colour
  band: string // band colour
  cap?: string // polar / speckle colour
}

const ORBIT_R0 = 18
const ORBIT_STEP = 7.4
const SPECIAL_RING_R = 112

const PLANETS: Record<string, PlanetCfg> = {
  Mercury: { orbit: 0, angle: 210, size: 1.05, base: '#8f8577', band: '#6f6559' },
  Venus: { orbit: 1, angle: 150, size: 1.55, base: '#d9b56f', band: '#b98d4e' },
  Earth: { orbit: 2, angle: 95, size: 1.6, base: '#3f6fae', band: '#5c8f5f', cap: '#dfe8f2' },
  Mars: { orbit: 3, angle: 30, size: 1.4, base: '#b5623d', band: '#8a4630', cap: '#d8c7b2' },
  Ceres: { orbit: 4, angle: 335, size: 0.95, base: '#a06a3f', band: '#7c5230' },
  Jupiter: { orbit: 5, angle: 285, size: 3.3, base: '#c79a5e', band: '#a3703c', cap: '#e8d9b8' },
  Saturn: { orbit: 6, angle: 240, size: 2.9, base: '#d6b878', band: '#b3925a', cap: '#ecdcb4' },
  Uranus: { orbit: 7, angle: 185, size: 2.2, base: '#7fd4d6', band: '#5cb3b8' },
  Neptune: { orbit: 8, angle: 130, size: 2.15, base: '#3d5fc4', band: '#2c4aa0' },
  Pluto: { orbit: 9, angle: 75, size: 1.0, base: '#cfd4dd', band: '#a8afc0' },
  Eris: { orbit: 10, angle: 20, size: 1.05, base: '#7c8a6e', band: '#5d6b52' },
  Sedna: { orbit: 11, angle: 300, size: 1.35, base: '#a63a3a', band: '#7c2828' },
}

/** Moons render beside their parent world (still selectable worlds of their own). */
const MOONS: Record<string, { parent: string; angle: number; size: number; base: string; band: string }> = {
  Lua: { parent: 'Earth', angle: 38, size: 0.62, base: '#cfc9bd', band: '#a9a397' },
  Europa: { parent: 'Jupiter', angle: -55, size: 0.85, base: '#bcd7e8', band: '#8fb5cc' },
  Phobos: { parent: 'Mars', angle: 55, size: 0.52, base: '#6d6158', band: '#544a42' },
  Deimos: { parent: 'Mars', angle: -65, size: 0.5, base: '#5c544e', band: '#736a5f' },
  'Kuva Fortress': { parent: 'Sedna', angle: 45, size: 0.8, base: '#4a2430', band: '#2e151d' },
}

function orbitRadius(i: number) {
  return ORBIT_R0 + i * ORBIT_STEP
}
function yJitter(i: number) {
  return Math.sin(i * 2.7) * 1.5
}
function planetPos(cfg: PlanetCfg): THREE.Vector3 {
  const r = orbitRadius(cfg.orbit)
  const a = (cfg.angle * Math.PI) / 180
  return new THREE.Vector3(r * Math.cos(a), yJitter(cfg.orbit), r * Math.sin(a))
}

/* ------------------------------------------------------------------ */
/* Scene state                                                          */
/* ------------------------------------------------------------------ */

interface WorldObj {
  name: string
  type: 'planet' | 'moon' | 'special'
  group: THREE.Group
  mesh: THREE.Object3D
  pick: THREE.Mesh
  halo: THREE.Sprite
  label: THREE.Sprite
  pos: THREE.Vector3
  radius: number
  t: number
  baseHaloScale: number
  baseHaloOpacity: number
  spin: number
}

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let raf = 0
let clock: THREE.Clock | null = null
let resizeObs: ResizeObserver | null = null
let disposed = false
let reduced = false

let worldsGroup: THREE.Group | null = null
let connectorsGroup: THREE.Group | null = null
let reticle: THREE.Sprite | null = null
let sunCore: THREE.Sprite | null = null
// Rajdhani gate: the worlds watcher must not bake label textures with the
// fallback font before fontReady resolves (the sig check would then block the
// correct-font rebuild forever).
let fontLoaded = false
const worldObjs = new Map<string, WorldObj>()
const pickMeshes: THREE.Mesh[] = []
let worldsSig = ''

const raycaster = new THREE.Raycaster()
const pointerNdc = new THREE.Vector2()
let pointerDirty = false
let hovered = ''
let dragging = false
let downX = 0
let downY = 0
let downAt = 0

const ORIGIN = new THREE.Vector3(0, 0, 0)
const HOME_POS = new THREE.Vector3(0, 72, 142)
const OVERVIEW_DIST = HOME_POS.length()

interface CamTween {
  t0: number
  dur: number
  fromT: THREE.Vector3
  toT: THREE.Vector3
  fromP: THREE.Vector3
  toP: THREE.Vector3
}
let camTween: CamTween | null = null

/* ------------------------------------------------------------------ */
/* Texture helpers (all procedural — no assets)                        */
/* ------------------------------------------------------------------ */

const texCache = new Map<string, THREE.Texture>()

function canvasTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.Texture {
  const cached = texCache.get(key)
  if (cached) return cached
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  texCache.set(key, tex)
  return tex
}

/** Soft radial glow (white — tinted per-use via material.color). */
function glowTexture(): THREE.Texture {
  return canvasTexture('glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,0.85)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.35)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.08)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
}

/** Orokin selection reticle: thin ring + 4 tick marks. */
function reticleTexture(): THREE.Texture {
  return canvasTexture('reticle', 256, 256, (ctx) => {
    ctx.strokeStyle = 'rgba(244,226,180,0.95)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(128, 128, 104, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 7
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4
      ctx.beginPath()
      ctx.arc(128, 128, 104, a - 0.16, a + 0.16)
      ctx.stroke()
    }
  })
}

/** Banded + speckled planet surface. Deterministic per world (seeded). */
function planetTexture(name: string, base: string, band: string, cap?: string): THREE.Texture {
  return canvasTexture(`planet:${name}`, 256, 128, (ctx) => {
    let seed = 0
    for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) & 0x7fffffff
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 128)
    // latitude bands
    const bands = 7 + Math.floor(rnd() * 6)
    for (let i = 0; i < bands; i++) {
      const y = rnd() * 128
      const hgt = 3 + rnd() * 14
      ctx.fillStyle = band
      ctx.globalAlpha = 0.12 + rnd() * 0.26
      ctx.fillRect(0, y, 256, hgt)
    }
    // speckle noise
    for (let i = 0; i < 340; i++) {
      const light = rnd() > 0.5
      ctx.fillStyle = light ? '#ffffff' : '#000000'
      ctx.globalAlpha = 0.025 + rnd() * 0.075
      const s = 1 + rnd() * 2.4
      ctx.fillRect(rnd() * 256, rnd() * 128, s, s)
    }
    // polar caps / clouds
    if (cap) {
      ctx.fillStyle = cap
      ctx.globalAlpha = 0.5
      ctx.fillRect(0, 0, 256, 7)
      ctx.fillRect(0, 121, 256, 7)
      ctx.globalAlpha = 0.14
      for (let i = 0; i < 26; i++) {
        ctx.beginPath()
        ctx.ellipse(rnd() * 256, rnd() * 128, 6 + rnd() * 18, 2 + rnd() * 4, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  })
}

/** Two-line world label: NAME / value readout. */
function labelTexture(name: string, sub: string, color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 192
  const ctx = c.getContext('2d')!
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(3,4,10,0.95)'
  ctx.shadowBlur = 14
  let size = 46
  ctx.font = `600 ${size}px Rajdhani, 'Segoe UI', sans-serif`
  const label = name.toUpperCase()
  while (size > 26 && ctx.measureText(label).width > 470) {
    size -= 2
    ctx.font = `600 ${size}px Rajdhani, 'Segoe UI', sans-serif`
  }
  ctx.fillStyle = color
  ctx.fillText(label, 256, 86)
  ctx.font = `600 30px Rajdhani, 'Segoe UI', sans-serif`
  ctx.fillStyle = GOLD_BRIGHT
  ctx.fillText(sub, 256, 132)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ------------------------------------------------------------------ */
/* Static scene                                                        */
/* ------------------------------------------------------------------ */

function buildStarfield(s: THREE.Scene) {
  const mk = (count: number, size: number, opacity: number) => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const c = new THREE.Color()
    let seed = 42
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    for (let i = 0; i < count; i++) {
      const r = 320 + rnd() * 520
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.cos(ph)
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
      const roll = rnd()
      c.set(roll > 0.92 ? GOLD_BRIGHT : roll > 0.84 ? CYAN : '#cfd6ea')
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
    })
    const pts = new THREE.Points(geo, mat)
    s.add(pts)
    return pts
  }
  mk(1300, 1.5, 0.7)
  mk(150, 2.8, 0.95)
}

function buildNebulae(s: THREE.Scene) {
  const tints = ['#274a66', '#3a2c5e', '#1f4d4a', '#4a3a22', '#26355e']
  let seed = 9
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.SpriteMaterial({
      map: glowTexture(),
      color: tints[i % tints.length],
      transparent: true,
      opacity: 0.10,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sp = new THREE.Sprite(mat)
    const a = rnd() * Math.PI * 2
    const r = 190 + rnd() * 160
    sp.position.set(r * Math.cos(a), -60 + rnd() * 130, r * Math.sin(a))
    const sc = 200 + rnd() * 180
    sp.scale.set(sc, sc, 1)
    sp.renderOrder = 1
    s.add(sp)
  }
}

/** Faint astrolabe chart: concentric rings + radial spokes (the map's "paper"). */
function buildChartGrid(s: THREE.Scene) {
  const mat = new THREE.LineBasicMaterial({ color: '#8b7a4e', transparent: true, opacity: 0.06 })
  for (const r of [24, 48, 72, 96, 120]) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)))
    }
    s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat))
  }
  const spokes: THREE.Vector3[] = []
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    spokes.push(new THREE.Vector3(14 * Math.cos(a), 0, 14 * Math.sin(a)))
    spokes.push(new THREE.Vector3(122 * Math.cos(a), 0, 122 * Math.sin(a)))
  }
  const spokeMat = new THREE.LineBasicMaterial({ color: '#8b7a4e', transparent: true, opacity: 0.04 })
  s.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokes), spokeMat))
}

function buildOrbitRing(parent: THREE.Object3D, r: number, y: number, color: string, opacity: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2
    pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)))
  }
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat))
}

function buildSun(s: THREE.Scene) {
  const layers: [string, number, number][] = [
    ['#fff7e0', 10, 0.95],
    ['#ffe9b0', 22, 0.5],
    ['#c8853d', 46, 0.22],
  ]
  for (const [color, size, opacity] of layers) {
    const mat = new THREE.SpriteMaterial({
      map: glowTexture(),
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sp = new THREE.Sprite(mat)
    sp.scale.set(size, size, 1)
    sp.renderOrder = 5
    s.add(sp)
    if (size === 10) sunCore = sp
  }
  const light = new THREE.PointLight('#ffe9c4', 2.3, 0, 0)
  s.add(light)
  s.add(new THREE.AmbientLight('#46507a', 0.85))
}

/* ------------------------------------------------------------------ */
/* Worlds                                                              */
/* ------------------------------------------------------------------ */

function makeHalo(color: string, scale: number, opacity: number): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  })
  const sp = new THREE.Sprite(mat)
  sp.scale.set(scale, scale, 1)
  sp.renderOrder = 8
  return sp
}

function makeLabel(name: string, sub: string, color: string, radius: number): THREE.Sprite {
  const tex = labelTexture(name, sub, color)
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
  const sp = new THREE.Sprite(mat)
  // base aspect only — the animate loop rescales labels each frame so they
  // keep a constant on-screen size at any zoom (Helldivers-style readouts)
  sp.scale.set(12, 12 * (192 / 512), 1)
  sp.position.set(0, radius * 1.55 + 2.6, 0)
  sp.renderOrder = 12
  return sp
}

function makePickProxy(radius: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(Math.max(radius * 1.7, 1.9), 8, 6)
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  return new THREE.Mesh(geo, mat)
}

function fmtPlat(n: number): string {
  const v = Number(n) || 0
  return v >= 100 ? String(Math.round(v)) : v.toFixed(1)
}

function buildWorlds(worlds: GalaxyWorld[]) {
  if (!scene || !worlds.length) return
  const sig = worlds.map((w) => `${w.name}:${Math.round(w.value * 10)}`).join('|')
  if (sig === worldsSig) return
  worldsSig = sig

  // tear down previous set
  if (worldsGroup) {
    scene.remove(worldsGroup)
    disposeObject(worldsGroup)
  }
  if (connectorsGroup) {
    scene.remove(connectorsGroup)
    disposeObject(connectorsGroup)
  }
  worldObjs.clear()
  pickMeshes.length = 0

  worldsGroup = new THREE.Group()
  connectorsGroup = new THREE.Group()
  scene.add(worldsGroup)
  scene.add(connectorsGroup)

  const sphereGeo = new THREE.SphereGeometry(1, 48, 24)
  const specials = worlds.filter((w) => !PLANETS[w.name] && !MOONS[w.name])

  worlds.forEach((w, wi) => {
    const group = new THREE.Group()
    let mesh: THREE.Object3D
    let pos: THREE.Vector3
    let radius: number
    let type: WorldObj['type']
    let labelColor = '#dfe3f0'

    const pcfg = PLANETS[w.name]
    const mcfg = MOONS[w.name]

    if (pcfg) {
      type = 'planet'
      radius = pcfg.size
      pos = planetPos(pcfg)
      const mat = new THREE.MeshStandardMaterial({
        map: planetTexture(w.name, pcfg.base, pcfg.band, pcfg.cap),
        roughness: 1,
        metalness: 0,
        emissive: new THREE.Color(pcfg.base).lerp(new THREE.Color(GOLD_BRIGHT), w.t * 0.5),
        emissiveIntensity: 0.10 + w.t * 0.22,
      })
      const m = new THREE.Mesh(sphereGeo, mat)
      m.scale.setScalar(radius)
      mesh = m
      if (w.name === 'Saturn') {
        const ringGeo = new THREE.RingGeometry(radius * 1.45, radius * 2.25, 96)
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#d6b878',
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = -Math.PI / 2 + 0.38
        ring.rotation.z = 0.25
        group.add(ring)
      }
      buildOrbitRing(connectorsGroup!, orbitRadius(pcfg.orbit), yJitter(pcfg.orbit), GOLD, 0.10)
    } else if (mcfg && PLANETS[mcfg.parent]) {
      type = 'moon'
      radius = mcfg.size
      const parentCfg = PLANETS[mcfg.parent]!
      const ppos = planetPos(parentCfg)
      const a = ((parentCfg.angle + mcfg.angle) * Math.PI) / 180
      const d = parentCfg.size * 2.1 + 2.4
      pos = new THREE.Vector3(ppos.x + d * Math.cos(a), ppos.y + 1.7, ppos.z + d * Math.sin(a))
      const mat = new THREE.MeshStandardMaterial({
        map: planetTexture(w.name, mcfg.base, mcfg.band),
        roughness: 1,
        metalness: 0,
        emissive: new THREE.Color(mcfg.base).lerp(new THREE.Color(GOLD_BRIGHT), w.t * 0.5),
        emissiveIntensity: 0.10 + w.t * 0.22,
      })
      const m = new THREE.Mesh(sphereGeo, mat)
      m.scale.setScalar(radius)
      mesh = m
      // tether to parent
      const lineMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.22 })
      const lineGeo = new THREE.BufferGeometry().setFromPoints([ppos, pos])
      connectorsGroup!.add(new THREE.Line(lineGeo, lineMat))
    } else {
      // Void zones & anything the API adds later — Orokin diamonds, outer ring.
      type = 'special'
      radius = 1.2
      labelColor = CYAN_BRIGHT
      const idx = specials.indexOf(w)
      const a = ((-20 - (idx * 360) / Math.max(specials.length, 1)) * Math.PI) / 180
      pos = new THREE.Vector3(
        SPECIAL_RING_R * Math.cos(a),
        idx % 2 === 0 ? 3 : -3,
        SPECIAL_RING_R * Math.sin(a),
      )
      const geo = new THREE.OctahedronGeometry(radius, 0)
      const mat = new THREE.MeshStandardMaterial({
        color: '#0f3d3b',
        emissive: CYAN,
        emissiveIntensity: 0.35 + w.t * 0.5,
        roughness: 0.35,
        metalness: 0.1,
      })
      const m = new THREE.Mesh(geo, mat)
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: CYAN_BRIGHT, transparent: true, opacity: 0.85 }),
      )
      m.add(edges)
      mesh = m
    }

    const haloColor = type === 'special' ? CYAN : GOLD_BRIGHT
    const baseHaloScale = radius * 3.2 + w.t * 10
    const baseHaloOpacity = 0.14 + 0.62 * w.t
    const halo = makeHalo(haloColor, baseHaloScale, baseHaloOpacity)
    const label = makeLabel(w.name, `${fmtPlat(w.value)} P / DROP`, labelColor, radius)
    const pick = makePickProxy(radius)
    pick.userData.world = w.name

    group.add(mesh)
    group.add(halo)
    group.add(label)
    group.add(pick)
    group.position.copy(pos)
    worldsGroup!.add(group)
    pickMeshes.push(pick)

    worldObjs.set(w.name, {
      name: w.name,
      type,
      group,
      mesh,
      pick,
      halo,
      label,
      pos: pos.clone(),
      radius,
      t: w.t,
      baseHaloScale,
      baseHaloOpacity,
      spin: 0.025 + ((wi * 7) % 10) * 0.004,
    })
  })

  buildOrbitRing(connectorsGroup, SPECIAL_RING_R, 0, CYAN, 0.08)
  applySelection(props.selected)
  applyHighlight(props.highlighted)
}

/* ------------------------------------------------------------------ */
/* Selection / highlight                                               */
/* ------------------------------------------------------------------ */

function applySelection(name: string) {
  if (!reticle) return
  const w = name ? worldObjs.get(name) : undefined
  if (w) {
    reticle.visible = true
    const s = Math.max(w.radius * 3.6, 4.6)
    reticle.scale.set(s, s, 1)
    reticle.position.copy(w.pos)
  } else {
    reticle.visible = false
  }
}

function applyHighlight(list: string[] | null) {
  const active = Array.isArray(list)
  const set = new Set(list || [])
  worldObjs.forEach((w) => {
    const hit = set.has(w.name)
    const haloMat = w.halo.material as THREE.SpriteMaterial
    const labelMat = w.label.material as THREE.SpriteMaterial
    if (!active) {
      haloMat.color.set(w.type === 'special' ? CYAN : GOLD_BRIGHT)
      haloMat.opacity = w.baseHaloOpacity
      w.halo.scale.set(w.baseHaloScale, w.baseHaloScale, 1)
      labelMat.opacity = 1
    } else if (hit) {
      haloMat.color.set(CYAN_BRIGHT)
      haloMat.opacity = 0.7
      const s = Math.max(w.baseHaloScale, w.radius * 4.4)
      w.halo.scale.set(s, s, 1)
      labelMat.opacity = 1
    } else {
      haloMat.opacity = w.baseHaloOpacity * 0.12
      labelMat.opacity = 0.16
    }
  })
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

function flyTo(target: THREE.Vector3, dist: number) {
  if (!camera || !controls || !clock) return
  const dir = camera.position.clone().sub(controls.target)
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.6, 1)
  dir.normalize()
  if (dir.y < 0.25) {
    dir.y = 0.25
    dir.normalize()
  }
  const toP = target.clone().add(dir.multiplyScalar(dist))
  camTween = {
    t0: clock.elapsedTime,
    dur: reduced ? 0.001 : 0.95,
    fromT: controls.target.clone(),
    toT: target.clone(),
    fromP: camera.position.clone(),
    toP,
  }
}

function easeCubicOut(x: number) {
  return 1 - Math.pow(1 - x, 3)
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

function setNdc(e: PointerEvent) {
  if (!renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}

function onPointerDown(e: PointerEvent) {
  downX = e.clientX
  downY = e.clientY
  downAt = performance.now()
}

function onPointerMove(e: PointerEvent) {
  setNdc(e)
  pointerDirty = true
}

function onPointerUp(e: PointerEvent) {
  const dx = e.clientX - downX
  const dy = e.clientY - downY
  if (Math.hypot(dx, dy) > 7 || performance.now() - downAt > 700) return
  setNdc(e)
  if (!camera) return
  raycaster.setFromCamera(pointerNdc, camera)
  const hits = raycaster.intersectObjects(pickMeshes, false)
  const name = hits.length ? (hits[0]!.object.userData.world as string) : null
  emit('select', name)
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

function init() {
  const canvas = canvasEl.value
  const el = wrap.value
  if (!canvas || !el) return

  reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  } catch {
    emit('unsupported')
    return
  }
  if (!renderer.getContext()) {
    emit('unsupported')
    return
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(el.clientWidth || 1, el.clientHeight || 1, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#05060d')

  camera = new THREE.PerspectiveCamera(50, (el.clientWidth || 1) / (el.clientHeight || 1), 0.1, 4000)
  camera.position.copy(reduced ? HOME_POS : new THREE.Vector3(0, 170, 330))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  // Helldivers-style: left-drag rotates, right-drag / two-finger pans across
  // the chart plane, wheel / pinch zooms. Target is re-clamped every frame.
  controls.enablePan = true
  controls.screenSpacePanning = false
  controls.minDistance = 10
  controls.maxDistance = 340
  controls.minPolarAngle = 0.2
  controls.maxPolarAngle = 1.45
  controls.autoRotate = !reduced
  controls.autoRotateSpeed = 0.35
  controls.addEventListener('start', () => {
    controls!.autoRotate = false
    camTween = null
    dragging = true
    if (renderer) renderer.domElement.style.cursor = 'grabbing'
  })
  controls.addEventListener('end', () => {
    dragging = false
    if (renderer) renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab'
  })

  clock = new THREE.Clock()

  buildStarfield(scene)
  buildNebulae(scene)
  buildChartGrid(scene)
  buildSun(scene)

  const retMat = new THREE.SpriteMaterial({
    map: reticleTexture(),
    color: '#f4e2b4',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    depthTest: false,
  })
  reticle = new THREE.Sprite(retMat)
  reticle.renderOrder = 11
  reticle.visible = false
  scene.add(reticle)

  canvas.style.cursor = 'grab'
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onContextLost as EventListener)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  resizeObs = new ResizeObserver(() => {
    if (!renderer || !camera || !el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    // DPR changes when the window moves between displays or the user zooms
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
  resizeObs.observe(el)

  // labels use Rajdhani — wait for it before the first world build, but don't
  // block the scene if the font never resolves
  const fontReady = document.fonts && document.fonts.load
    ? Promise.race([
        document.fonts.load("600 46px Rajdhani").catch(() => null),
        new Promise((r) => setTimeout(r, 1500)),
      ])
    : Promise.resolve(null)

  fontReady.then(() => {
    if (disposed) return
    fontLoaded = true
    buildWorlds(props.worlds)
    if (!reduced) flyTo(ORIGIN, OVERVIEW_DIST)
    emit('ready')
    // onVisibility may already have started the loop during the font wait
    if (!raf) animate()
  })
}

function onVisibility() {
  if (document.hidden) {
    cancelAnimationFrame(raf)
    raf = 0
  } else if (!raf && !disposed) {
    if (clock) clock.getDelta() // swallow the hidden-time delta
    animate()
  }
}

// Transient GPU context loss (sleep/wake, driver reset) is recoverable:
// preventDefault opts into restoration, we pause rendering and resume on
// restore. 'unsupported' stays reserved for renderer creation failure.
function onContextLost(e: Event) {
  e.preventDefault()
  cancelAnimationFrame(raf)
  raf = 0
}

function onContextRestored() {
  if (!disposed && !raf) {
    if (clock) clock.getDelta()
    animate()
  }
}

function animate() {
  if (disposed || !renderer || !scene || !camera || !controls || !clock) return
  raf = requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.1)
  const t = clock.elapsedTime

  // camera tween
  if (camTween) {
    const k = Math.min((t - camTween.t0) / camTween.dur, 1)
    const e = easeCubicOut(k)
    controls.target.lerpVectors(camTween.fromT, camTween.toT, e)
    camera.position.lerpVectors(camTween.fromP, camTween.toP, e)
    if (k >= 1) camTween = null
  }

  controls.update()

  // keep the pan target on the chart (never lost in deep space)
  const tgt = controls.target
  const planar = Math.hypot(tgt.x, tgt.z)
  if (planar > 135) {
    const k = 135 / planar
    tgt.x *= k
    tgt.z *= k
  }
  tgt.y = THREE.MathUtils.clamp(tgt.y, -30, 30)

  // ambient life
  if (!reduced) {
    worldObjs.forEach((w) => {
      if (w.type === 'special') w.mesh.rotation.y += dt * 0.4
      else w.mesh.rotation.y += dt * w.spin
    })
    if (sunCore) {
      const p = 1 + Math.sin(t * 1.4) * 0.05
      sunCore.scale.set(10 * p, 10 * p, 1)
    }
    if (reticle && reticle.visible) {
      const mat = reticle.material as THREE.SpriteMaterial
      mat.rotation += dt * 0.5
      mat.opacity = 0.75 + Math.sin(t * 3) * 0.2
    }
  }

  // labels: constant screen size (scale ∝ distance) + distance fade
  const highlightActive = Array.isArray(props.highlighted)
  worldObjs.forEach((w) => {
    const d = camera!.position.distanceTo(w.pos)
    const s = THREE.MathUtils.clamp(d * 0.085, 3.2, 16)
    w.label.scale.set(s, s * (192 / 512), 1)
    if (!highlightActive) {
      const mat = w.label.material as THREE.SpriteMaterial
      mat.opacity = THREE.MathUtils.clamp(1.35 - d / 420, 0.5, 1)
    }
  })

  // hover picking (only when the pointer actually moved)
  if (pointerDirty && !dragging) {
    pointerDirty = false
    raycaster.setFromCamera(pointerNdc, camera)
    const hits = raycaster.intersectObjects(pickMeshes, false)
    const name = hits.length ? (hits[0]!.object.userData.world as string) : ''
    if (name !== hovered) {
      hovered = name
      renderer.domElement.style.cursor = name ? 'pointer' : 'grab'
    }
  }

  renderer.render(scene, camera)
}

function disposeObject(root: THREE.Object3D) {
  // per-world label textures are unique and must be freed; textures in
  // texCache are shared across worlds and are freed once, in dispose()
  const shared = new Set(texCache.values())
  root.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose()
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
    for (const m of mats) {
      if (m.map && !shared.has(m.map)) m.map.dispose()
      m.dispose()
    }
  })
}

function dispose() {
  disposed = true
  cancelAnimationFrame(raf)
  raf = 0
  document.removeEventListener('visibilitychange', onVisibility)
  if (resizeObs) {
    resizeObs.disconnect()
    resizeObs = null
  }
  const canvas = canvasEl.value
  if (canvas) {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('webglcontextlost', onContextLost as EventListener)
    canvas.removeEventListener('webglcontextrestored', onContextRestored)
  }
  if (controls) {
    controls.dispose()
    controls = null
  }
  if (scene) {
    disposeObject(scene)
    scene = null
  }
  texCache.forEach((t) => t.dispose())
  texCache.clear()
  worldObjs.clear()
  pickMeshes.length = 0
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  camera = null
  clock = null
  worldsGroup = null
  connectorsGroup = null
  reticle = null
  sunCore = null
}

onMounted(async () => {
  // Nuxt renders .client components one tick after mount — template refs are
  // not populated until then.
  await nextTick()
  if (!canvasEl.value) await nextTick()
  if (!disposed) init()
})

onBeforeUnmount(() => {
  dispose()
})

watch(
  () => props.worlds,
  (w) => {
    if (!disposed && scene && fontLoaded) buildWorlds(w)
  },
)

watch(
  () => props.selected,
  (name) => {
    if (disposed) return
    applySelection(name)
    if (controls) controls.autoRotate = false
    const w = name ? worldObjs.get(name) : undefined
    if (w) flyTo(w.pos, THREE.MathUtils.clamp(w.radius * 13, 26, 60))
    else flyTo(ORIGIN, OVERVIEW_DIST)
  },
)

watch(
  () => props.highlighted,
  (list) => {
    if (!disposed) applyHighlight(list)
  },
)
</script>

<style scoped>
.scg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.scg__canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}
</style>
