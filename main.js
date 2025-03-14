import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create an Object3D to manage the camera's rotation
const cameraHolder = new THREE.Object3D();
cameraHolder.add(camera);
scene.add(cameraHolder);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Load GLB map
const loader = new GLTFLoader();
loader.load('./models/collision-world.glb', (gltf) => {
    scene.add(gltf.scene);
}, undefined, (error) => {
    console.error('Error loading GLB:', error);
});

// Player variables
const player = {
    velocity: new THREE.Vector3(),
    position: new THREE.Vector3(0, 1.5, 5),
    canJump: true,
    jumps: 2,
    height: 1.5, // Add player height for collision detection
};
cameraHolder.position.copy(player.position);

// Movement input
const keys = {};
window.addEventListener('keydown', (e) => (keys[e.key] = true));
window.addEventListener('keyup', (e) => (keys[e.key] = false));

// Look input (Arrow keys only)
let yaw = 0, pitch = 0;
const lookSpeed = 0.05; // Adjust this value to change the look speed

function updateLook() {
    if (keys['ArrowLeft']) yaw += lookSpeed;
    if (keys['ArrowRight']) yaw -= lookSpeed;
    if (keys['ArrowUp']) pitch = Math.min(Math.PI / 2, pitch + lookSpeed); // Correct direction for looking up
    if (keys['ArrowDown']) pitch = Math.max(-Math.PI / 2, pitch - lookSpeed); // Correct direction for looking down
    requestAnimationFrame(updateLook);
}
updateLook();

// Shooting
window.addEventListener('click', () => shoot());
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') shoot();
});

function shoot() {
    const raycaster = new THREE.Raycaster(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        console.log('Hit:', intersects[0].object);
    }
}

// Update loop
function update() {
    const speed = 0.02; // Slow down WASD movement
    const direction = new THREE.Vector3();

    if (keys['w']) direction.z -= speed;
    if (keys['s']) direction.z += speed;
    if (keys['a']) direction.x -= speed;
    if (keys['d']) direction.x += speed;
    if (keys[' ']) jump();

    // Rotate direction vector by cameraHolder's rotation
    direction.applyQuaternion(cameraHolder.quaternion);

    player.velocity.add(direction);
    player.velocity.y -= 0.01; // Gravity

    // Collision detection
    const directions = [
        new THREE.Vector3(0, -1, 0), // Down
        new THREE.Vector3(0, 1, 0),  // Up
        new THREE.Vector3(1, 0, 0),  // Right
        new THREE.Vector3(-1, 0, 0), // Left
        new THREE.Vector3(0, 0, 1),  // Forward
        new THREE.Vector3(0, 0, -1)  // Backward
    ];

    directions.forEach(dir => {
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(player.position.x, player.position.y, player.position.z),
            dir
        );
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0 && intersects[0].distance < player.height / 2) {
            const normal = intersects[0].face.normal;
            if (dir.y === -1 || (dir.y === 0 && normal.y > 0.5)) { // Treat slopes as floors
                player.velocity.y = Math.max(0, player.velocity.y); // Stop falling
                player.jumps = 2; // Reset jumps when on the ground
                if (normal.y > 0.5 && dir.y === 0) { // Adjust position to climb or descend slopes
                    player.position.addScaledVector(normal, speed * normal.y);
                }
            } else {
                player.velocity.addScaledVector(dir, -player.velocity.dot(dir)); // Stop movement in the direction of collision
                player.position.addScaledVector(dir, -0.1); // Move player slightly away from the wall
            }
        }
    });

    player.position.add(player.velocity);
    cameraHolder.position.copy(player.position);
    cameraHolder.rotation.set(0, yaw, 0); // Rotate the holder for yaw
    camera.rotation.set(pitch, 0, 0); // Rotate the camera for pitch

    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

function jump() {
    if (player.jumps > 0) {
        player.velocity.y = 0.2;
        player.jumps--;
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

update();
