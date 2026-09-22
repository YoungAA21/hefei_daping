import { writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createPackagingLine } from '../src/components/MachineModel/packagingLine.js';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();}); }
};
const model=createPackagingLine();
const data=await new GLTFExporter().parseAsync(model,{binary:true});
await writeFile(new URL('../src/assets/models/packaging-line.glb',import.meta.url),Buffer.from(data));
console.log(`Exported actual mesh model: ${model.children.length} parts, ${data.byteLength} bytes`);
