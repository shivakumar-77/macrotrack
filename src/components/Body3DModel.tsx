'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface MuscleGroup {
  name: string
  color: string
  parts: Array<{ name: string; vertices: number[] }>
}

const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  chest: {
    name: 'Chest',
    color: '#e05c8a',
    parts: [{ name: 'Pectoralis Major', vertices: [] }],
  },
  shoulders: {
    name: 'Shoulders',
    color: '#7c6fe0',
    parts: [{ name: 'Deltoid', vertices: [] }],
  },
  arms: {
    name: 'Arms',
    color: '#5b9ef0',
    parts: [{ name: 'Biceps', vertices: [] }],
  },
  core: {
    name: 'Core',
    color: '#2ec4a0',
    parts: [{ name: 'Abdominals', vertices: [] }],
  },
  legs: {
    name: 'Legs',
    color: '#f0a030',
    parts: [{ name: 'Quadriceps', vertices: [] }],
  },
  back: {
    name: 'Back',
    color: '#e04070',
    parts: [{ name: 'Latissimus Dorsi', vertices: [] }],
  },
}

export default function Body3DModel({
  onMuscleSelect,
}: {
  onMuscleSelect?: (muscle: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const bodyGroupRef = useRef<THREE.Group | null>(null)
  const [view, setView] = useState<'front' | 'back' | 'side'>('front')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111)
    sceneRef.current = scene

    // Camera setup
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 0, 3)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create body group
    const bodyGroup = new THREE.Group()
    bodyGroupRef.current = bodyGroup
    scene.add(bodyGroup)

    // Create body mesh with muscle groups
    const body = createBodyMesh()
    bodyGroup.add(body)

    // Handle view changes
    const handleViewChange = () => {
      if (view === 'front') {
        bodyGroup.rotation.y = 0
        camera.position.set(0, 0, 3)
      } else if (view === 'back') {
        bodyGroup.rotation.y = Math.PI
        camera.position.set(0, 0, 3)
      } else if (view === 'side') {
        bodyGroup.rotation.y = Math.PI / 2
        camera.position.set(3, 0, 3)
      }
    }
    handleViewChange()

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [view])

  const createBodyMesh = () => {
    const bodyGroup = new THREE.Group()

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 32, 32)
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xe8c9a0 })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1.8
    bodyGroup.add(head)

    // Torso/Chest
    const chestGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4)
    const chestMaterial = new THREE.MeshPhongMaterial({ color: 0xe05c8a })
    const chest = new THREE.Mesh(chestGeometry, chestMaterial)
    chest.position.set(0, 1, 0)
    chest.userData.muscle = 'chest'
    bodyGroup.add(chest)

    // Shoulders
    const shoulderGeometry = new THREE.SphereGeometry(0.2, 16, 16)
    const shoulderMaterial = new THREE.MeshPhongMaterial({ color: 0x7c6fe0 })
    const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial)
    leftShoulder.position.set(-0.4, 1.4, 0)
    leftShoulder.userData.muscle = 'shoulders'
    bodyGroup.add(leftShoulder)
    const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial)
    rightShoulder.position.set(0.4, 1.4, 0)
    rightShoulder.userData.muscle = 'shoulders'
    bodyGroup.add(rightShoulder)

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16)
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x5b9ef0 })
    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.6, 0.6, 0)
    leftArm.userData.muscle = 'arms'
    bodyGroup.add(leftArm)
    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.6, 0.6, 0)
    rightArm.userData.muscle = 'arms'
    bodyGroup.add(rightArm)

    // Forearms
    const forearmGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16)
    const forearmMaterial = new THREE.MeshPhongMaterial({ color: 0x3a7acc })
    const leftForearm = new THREE.Mesh(forearmGeometry, forearmMaterial)
    leftForearm.position.set(-0.6, -0.2, 0)
    leftForearm.userData.muscle = 'arms'
    bodyGroup.add(leftForearm)
    const rightForearm = new THREE.Mesh(forearmGeometry, forearmMaterial)
    rightForearm.position.set(0.6, -0.2, 0)
    rightForearm.userData.muscle = 'arms'
    bodyGroup.add(rightForearm)

    // Core/Abs
    const coreGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.35)
    const coreMaterial = new THREE.MeshPhongMaterial({ color: 0x2ec4a0 })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    core.position.set(0, 0.2, 0)
    core.userData.muscle = 'core'
    bodyGroup.add(core)

    // Pelvis
    const pelvisGeometry = new THREE.BoxGeometry(0.55, 0.3, 0.4)
    const pelvisMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a22 })
    const pelvis = new THREE.Mesh(pelvisGeometry, pelvisMaterial)
    pelvis.position.set(0, -0.5, 0)
    bodyGroup.add(pelvis)

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.14, 1, 16)
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0xf0a030 })
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.2, -1.2, 0)
    leftLeg.userData.muscle = 'legs'
    bodyGroup.add(leftLeg)
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.2, -1.2, 0)
    rightLeg.userData.muscle = 'legs'
    bodyGroup.add(rightLeg)

    // Calves
    const calfGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16)
    const calfMaterial = new THREE.MeshPhongMaterial({ color: 0xe07820 })
    const leftCalf = new THREE.Mesh(calfGeometry, calfMaterial)
    leftCalf.position.set(-0.2, -2, 0)
    leftCalf.userData.muscle = 'legs'
    bodyGroup.add(leftCalf)
    const rightCalf = new THREE.Mesh(calfGeometry, calfMaterial)
    rightCalf.position.set(0.2, -2, 0)
    rightCalf.userData.muscle = 'legs'
    bodyGroup.add(rightCalf)

    // Feet
    const footGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25)
    const footMaterial = new THREE.MeshPhongMaterial({ color: 0xe8c9a0 })
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial)
    leftFoot.position.set(-0.2, -2.5, 0)
    bodyGroup.add(leftFoot)
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial)
    rightFoot.position.set(0.2, -2.5, 0)
    bodyGroup.add(rightFoot)

    return bodyGroup
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !cameraRef.current) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(
      (x / rect.width) * 2 - 1,
      -(y / rect.height) * 2 + 1
    )

    raycaster.setFromCamera(mouse, cameraRef.current)

    if (bodyGroupRef.current) {
      const intersects = raycaster.intersectObjects(bodyGroupRef.current.children, true)
      if (intersects.length > 0) {
        const muscle = intersects[0].object.userData.muscle
        if (muscle) {
          setSelectedMuscle(muscle)
          onMuscleSelect?.(muscle)
        }
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setView('front')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'front'
              ? 'bg-indigo-500 text-white'
              : 'bg-card2 text-muted border border-border'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'back'
              ? 'bg-indigo-500 text-white'
              : 'bg-card2 text-muted border border-border'
          }`}
        >
          Back
        </button>
        <button
          onClick={() => setView('side')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'side'
              ? 'bg-indigo-500 text-white'
              : 'bg-card2 text-muted border border-border'
          }`}
        >
          Side
        </button>
      </div>
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: 500,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#111',
          cursor: 'pointer',
        }}
      />
    </div>
  )
}
