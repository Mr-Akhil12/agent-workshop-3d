/**
 * EG Civic hatch, GTA IV fidelity: a real silhouette, not a brick with wheels.
 * Proportions from the 1993 hatch (about 4.05 x 1.70 x 1.34). Championship white.
 */
export function buildCivic(THREE, envMap) {
    const car = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({
        color: 0xe7e4df,
        metalness: 0.18,
        roughness: 0.34,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        envMap,
        envMapIntensity: 0.35,
    });
    const glass = new THREE.MeshStandardMaterial({
        color: 0x101820, roughness: 0.08, metalness: 0.2, envMap, transparent: true, opacity: 0.82, depthWrite: true,
    });
    const trim = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.55, metalness: 0.35 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.92 });
    const lamp = new THREE.MeshStandardMaterial({ color: 0xfff4d8, emissive: 0xfff1c8, emissiveIntensity: 0.35, roughness: 0.25 });
    const tail = new THREE.MeshStandardMaterial({ color: 0x8a1a16, emissive: 0x6a1010, emissiveIntensity: 0.4, roughness: 0.35 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.85, roughness: 0.28, envMap });

    function box(w, h, d, mat, x, y, z, rx = 0) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.rotation.x = rx;
        m.castShadow = true;
        m.receiveShadow = true;
        car.add(m);
        return m;
    }

    box(1.62, 0.46, 3.35, paint, 0, 0.48, 0.05);
    box(1.56, 0.1, 1.05, paint, 0, 0.74, 1.22, -0.08);
    box(1.5, 0.38, 1.45, paint, 0, 0.98, -0.12);
    box(1.52, 0.32, 0.72, paint, 0, 0.9, -1.42, 0.42);
    box(1.66, 0.16, 0.14, trim, 0, 0.28, 1.92);
    box(1.66, 0.14, 0.1, trim, 0, 0.3, -1.92);
    box(0.72, 0.1, 0.04, trim, 0, 0.42, 1.98);
    box(0.42, 0.1, 0.05, lamp, -0.52, 0.52, 1.9);
    box(0.42, 0.1, 0.05, lamp, 0.52, 0.52, 1.9);
    box(0.38, 0.08, 0.04, tail, -0.55, 0.62, -1.96);
    box(0.38, 0.08, 0.04, tail, 0.55, 0.62, -1.96);
    box(1.48, 0.04, 0.9, paint, 0, 1.2, -0.15);
    box(0.08, 0.08, 0.16, trim, -0.82, 0.95, 0.35);
    box(0.08, 0.08, 0.16, trim, 0.82, 0.95, 0.35);

    const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.06, 6, 10, Math.PI),
        trim
    );
    [[-0.8, 1.22], [0.8, 1.22], [-0.8, -1.22], [0.8, -1.22]].forEach(([x, z]) => {
        const a = arch.clone();
        a.rotation.y = Math.PI / 2;
        a.rotation.z = Math.PI;
        a.position.set(x, 0.32, z);
        car.add(a);
    });

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16), rubber);
    tire.rotation.z = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8), metal);
    rim.rotation.z = Math.PI / 2;
    [[-0.78, 1.22], [0.78, 1.22], [-0.78, -1.22], [0.78, -1.22]].forEach(([x, z]) => {
        const t = tire.clone();
        t.position.set(x, 0.3, z);
        const r = rim.clone();
        r.position.set(x, 0.3, z);
        car.add(t);
        car.add(r);
    });

    car.userData.forward = new THREE.Vector3(0, 0, 1);
    return car;
}
