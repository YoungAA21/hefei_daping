import * as THREE from 'three';

// Reference-based visualization model. Hidden machinery and dimensions are approximate.
export function createPackagingLine() {
  const root = new THREE.Group(); root.name = 'PackagingInspectionLine';
  const mat = (name, color, metalness=.35, roughness=.45, extra={}) => new THREE.MeshStandardMaterial({name,color,metalness,roughness,...extra});
  const white=mat('Painted cabinet',0xd3dce0), steel=mat('Aluminium frame',0x91a5af,.75,.3), dark=mat('Conveyor belt',0x202d34,.2,.75), yellow=mat('Safety yellow',0xe6a52c), glass=mat('Safety glass',0x72b3bf,.1,.18,{transparent:true,opacity:.3,depthWrite:false}), black=mat('Door seals',0x24373d), screen=mat('Control display',0x123641,.15,.25,{emissive:0x298caa,emissiveIntensity:.55}), accent=mat('Status indicator',0x55dce8,.3,.25,{emissive:0x21adc9,emissiveIntensity:.5});
  const boxGeo=new THREE.BoxGeometry(1,1,1), cylinderGeo=new THREE.CylinderGeometry(1,1,1,12);
  function box(name,x,y,z,w,h,d,m=white,parent=root){const o=new THREE.Mesh(boxGeo,m);o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
  function cyl(name,x,y,z,r,h,m=steel,axis='y'){const o=new THREE.Mesh(cylinderGeo,m);o.name=name;o.position.set(x,y,z);o.scale.set(r,h,r);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;root.add(o);return o;}
  function beam(name,a,b,width=.08,m=steel){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),mid=start.clone().add(end).multiplyScalar(.5);const o=box(name,...mid.toArray(),width,start.distanceTo(end),width,m);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return o;}
  function feet(x,z,w,d){for(const dx of [-w/2+.14,w/2-.14])for(const dz of [-d/2+.12,d/2-.12]){cyl('Adjustable foot',x+dx,.09,z+dz,.10,.08,black);cyl('Foot stem',x+dx,.22,z+dz,.035,.23);}}
  function cabinet(name,x,z,w,d,h=1.7){box(name,x,h/2+.3,z,w,h,d);feet(x,z,w,d);box('Top cover',x,h+.32,z,w+.04,.07,d+.04);const n=Math.max(1,Math.round(w/.75));for(let i=0;i<n;i++){const cx=x-w/2+(i+.5)*w/n;box('Service door',cx,.9,z+d/2+.015,w/n-.035,1.02,.025);box('Door handle',cx+w/n*.32,1.12,z+d/2+.04,.028,.16,.028,black);}box('Status strip',x,h+.365,z+d/2-.04,w*.78,.022,.045,accent);}
  function monitor(x,y,z){box('Display mount',x,y-.24,z,.045,.42,.045);box('Control monitor',x,y,z,.42,.29,.07,black);box('LCD screen',x,y,z+.042,.36,.23,.012,screen);box('Screen readout',x-.065,y+.04,z+.05,.19,.015,.01,accent);}
  function conveyor(name,x,z,length,along='x',height=1.05){const group=new THREE.Group();group.name=name;root.add(group);const w=along==='x'?length:.58,d=along==='x'?.58:length;box('Belt deck',x,height,z,w,.15,d,dark);for(const side of [-1,1]){box('Conveyor side rail',x+(along==='z'?side*.34:0),height+.12,z+(along==='x'?side*.34:0),along==='x'?length:.045,.16,along==='x'?.045:length);}
    for(let i=0;i<Math.floor(length/.22);i++){const t=-length/2+.12+i*.22;cyl('Transfer roller',x+(along==='x'?t:0),height+.1,z+(along==='z'?t:0),.055,.51,steel,along==='x'?'z':'x');}
    for(const t of [-length*.38,length*.38]){const fx=x+(along==='x'?t:0),fz=z+(along==='z'?t:0);beam('Conveyor support',[fx,.15,fz],[fx,height-.08,fz],.09);box('Conveyor support foot',fx,.12,fz,.45,.06,.45,steel);}
  }
  // Main enclosed packer at the front-left, with visible tooling behind glass.
  cabinet('Main packaging base',-2.5,1.45,3.45,1.65,.66);
  for(const x of [-4.22,-3.1,-1.95,-.78]){box('Enclosure upright',x,1.61,2.29,.065,1.32,.065);box('Rear upright',x,1.61,.61,.065,1.32,.065);}
  for(const z of [.61,2.29]){box('Enclosure top rail',-2.5,2.28,z,3.5,.08,.075);box('Enclosure sill',-2.5,.95,z,3.5,.075,.075);}
  for(const x of [-3.67,-2.52,-1.37]){box('Transparent guard door',x,1.62,2.27,1.03,1.19,.035,glass);box('Guard handle',x+.4,1.61,2.31,.035,.25,.055,black);box('Internal packaging head',x,1.22,1.48,.58,.48,.62,steel);cyl('Internal spindle',x,1.64,1.4,.19,.16,dark,'z');}
  box('Glass top',-2.5,2.29,1.45,3.4,.025,1.6,glass);box('Side glass',-4.22,1.62,1.45,.025,1.19,1.56,glass);
  box('Operator button panel',-.9,1.72,2.33,.12,.4,.06,white);for(let i=0;i<3;i++)cyl('Control button',-.9,1.62+i*.1,2.38,.027,.022,i===0?yellow:accent,'z');
  // Reel-fed mechanism beside the main packer.
  cabinet('Film feed base',.02,1.68,.85,1.2,.45);
  for(const x of [-.28,.3]){box('Reel bracket',x,1.1,1.92,.07,1.4,.12);cyl('Film reel',x,.86,2.12,.25,.19,white,'z');cyl('Reel hub',x,.86,2.23,.08,.03,black,'z');}
  beam('Film guide diagonal',[-.4,1.98,1.3],[.4,1.4,1.3],.13);monitor(.05,1.62,2.05);
  // Return leg, inspection station, rear wrapper and right-hand frame.
  cabinet('Left return machine',-2.6,-.85,1.5,2.1,1.38);
  for(let i=0;i<3;i++)box('Return inspection window',-1.835,1.47,-1.48+i*.58,.025,.58,.43,glass);
  conveyor('Main inspection conveyor',-.2,-1.7,3.2);
  cabinet('Inspection station base',-.15,-1.7,2.4,.73,.68);
  monitor(-.85,1.63,-1.5);monitor(.02,1.63,-1.5);monitor(.89,1.63,-1.5);
  cabinet('Rear wrapping cabinet',2,-1.65,1.35,1.75,1.75);
  cabinet('Right transfer cabinet',2.8,.35,1.38,1.35,1.02);
  box('Transfer hood',2.8,1.68,.27,1.22,.78,1.1);box('Transfer dark aperture',2.8,1.55,.833,.68,.35,.025,black);
  monitor(2.17,2.0,-.69);
  conveyor('Right roller feed',3.9,-1.65,1.4);
  for(const x of [4.4,5.8])for(const z of [-2.55,-.8])box('Palletizer frame post',x,1.46,z,.075,2.7,.075);
  for(const y of [.3,2.8])for(const z of [-2.55,-.8])box('Palletizer long frame',5.1,y,z,1.47,.075,.075);
  for(const y of [.3,2.8])for(const x of [4.4,5.8])box('Palletizer cross frame',x,y,-1.68,.075,.075,1.8);
  box('Palletizer rear panel',5.1,1.5,-2.54,1.35,2.4,.025,glass);conveyor('Palletizer bed',5.1,-1.68,1.42,'z',.55);
  box('Vertical lift carriage',5.7,1.8,-1.65,.28,1.9,.6,black);cabinet('Electrical cabinet',5.65,-.22,.65,.62,1.1);
  // Overhead transport rails and safety-yellow descending guide.
  beam('Elevated conveyor bridge',[-2.6,2.64,-1.5],[3.0,2.64,-1.5],.17);
  beam('Elevated return rail',[-2.6,2.64,-1.5],[-2.6,2.12,1.4],.17);
  for(const x of [-2.6,4.7]){beam('Tall support mast',[x,.2,-2.5],[x,3.9,-2.5],.065);beam('Paired support mast',[x+.1,.2,-2.5],[x+.1,3.9,-2.5],.035);}
  beam('Safety yellow guide',[1.95,3.0,-2.1],[2.9,2.2,-.3],.19,yellow);
  beam('Vertical yellow chute',[2.9,2.2,-.3],[2.9,1.5,-.3],.19,yellow);
  for(const x of [1.4,2.6]){box('Rear machine gantry',x,2.6,-2.25,.07,.8,.07);}
  box('Rear cross member',2,2.99,-2.25,1.28,.07,.08);
  root.userData={description:'Reference-based packaging line; simplified hidden structures',units:'visualization metres'};
  return root;
}
