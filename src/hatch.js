/** White hatchback parked at the Hush avenue. Replaced if assets/models/civic.glb is present. */
export function buildHatch(THREE, envMap) {
    const car = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({
        color: 0xf2f3f5,
        metalness: 0.35,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMap,
        envMapIntensity: 0.45,
    });
    const glass = new THREE.MeshStandardMaterial({
        color: 0x141c24, roughness: 0.15, metalness: 0.2, envMap, transparent: true, opacity: 0.72,
    });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 1, roughness: 0.25, envMap });

    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.48, 4.05), paint);
    lower.position.y = 0.52;
    lower.castShadow = true;
    car.add(lower);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.46, 1.85), glass);
    cabin.position.set(0, 0.92, -0.15);
    car.add(cabin);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 1.15), paint);
    hood.position.set(0, 0.78, 1.15);
    car.add(hood);
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.38, 0.9), paint);
    hatch.position.set(0, 0.86, -1.35);
    hatch.rotation.x = 0.35;
    car.add(hatch);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.04), new THREE.MeshStandardMaterial({ color: 0x8b1e1e, roughness: 0.45 }));
    grille.position.set(0, 0.48, 2.02);
    car.add(grille);

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12), rubber);
    wheel.rotation.z = Math.PI / 2;
    [[-0.82, 0.32, 1.25], [0.82, 0.32, 1.25], [-0.82, 0.32, -1.25], [0.82, 0.32, -1.25]].forEach((p) => {
        const w = wheel.clone();
        w.position.set(p[0], p[1], p[2]);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 10), metal);
        rim.rotation.z = Math.PI / 2;
        rim.position.copy(w.position);
        car.add(w);
        car.add(rim);
    });
    car.userData.forward = new THREE.Vector3(0, 0, 1);
    return car;
}
