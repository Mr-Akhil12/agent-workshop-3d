import { THREE } from './three-setup.js';

export function createEnvMap(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0a0a14);

    const l1 = new THREE.PointLight(0x00ccff, 100, 50);
    l1.position.set(5, 8, 5);
    envScene.add(l1);

    const l2 = new THREE.PointLight(0xff0088, 80, 50);
    l2.position.set(-5, 6, -5);
    envScene.add(l2);

    const l3 = new THREE.PointLight(0xffffff, 60, 50);
    l3.position.set(0, 10, 0);
    envScene.add(l3);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshBasicMaterial({ color: 0x050508 })
    );
    floor.rotation.x = -Math.PI / 2;
    envScene.add(floor);

    return pmrem.fromScene(envScene, 0.04).texture;
}

export function makeFlakeBlackPaint(envMap) {
    return new THREE.MeshPhysicalMaterial({
        color: 0x050505,
        metalness: 0.92,
        roughness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMap: envMap,
        envMapIntensity: 2.5,
        reflectivity: 1.0,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        sheen: 0.3,
        sheenRoughness: 0.2,
        sheenColor: new THREE.Color(0x444466),
    });
}

export function makeNeonMaterial(color, intensity = 2.5) {
    return new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: intensity,
        metalness: 0.1, roughness: 0.3
    });
}
