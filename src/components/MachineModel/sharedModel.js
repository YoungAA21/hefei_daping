import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// One immutable geometry cache is shared by all nine views; each view owns its materials.
let pending;
export function loadPackagingModel() {
  if (!pending) pending = new GLTFLoader().loadAsync(new URL('../../assets/models/packaging-line.glb', import.meta.url).href).then(gltf => gltf.scene).catch(error => { pending = null; throw error; });
  return pending;
}
