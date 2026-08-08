/* ================================================================
   viewer.js  ·  ABM visual  ·  Marine Discovery Centre
   ----------------------------------------------------------------
   The ONE shared file. Every specimen page loads this. To change
   lighting, framing, buttons or behaviour for ALL 50 specimens at
   once, edit the SETTINGS block below and push this file. Nothing
   else needs touching.

   Each specimen page is only:
     <body data-model="Abalone.glb" data-title="Abalone">
     <script type="module" src="model-viewer.min.js"></script>
     <script type="module" src="viewer.js"></script>
   ================================================================ */

const VIEWER_VERSION = "v11";
console.log(`%cMDC viewer ${VIEWER_VERSION}`,
            "color:#3fb950;font-weight:bold;font-size:14px");

/* ---- settings: edit these ------------------------------------- */
const SETTINGS = {
  // lighting
  exposure:        "0.85",
  toneMapping:     "neutral",
  environment:     "neutral",
  shadowIntensity: "0.35",
  shadowSoftness:  "1",
  matteness:       0.85,   // 0 = keep Polycam's gloss, 1 = fully matte

  // framing
  frameHeight:     0.80,   // model fills this share of the viewport height
  maxWidth:        0.95,   // but never wider than this, so it cannot clip
  autoBestAngle:   true,   // open facing the model's widest side
  startPhi:        "78deg",// vertical camera angle

  // motion
  rotationSpeed:   "24deg",
  resumeDelayMs:   1500    // spin resumes this long after a drag ends
};

/* ---- per-specimen overrides -----------------------------------
   Optional. Add an entry only for a specimen that needs different
   treatment. Anything not listed uses SETTINGS above. Example:

     "Sea Glass":  { exposure: "0.7", matteness: 0.4 },
     "Cuttlebone": { exposure: "0.75" },
----------------------------------------------------------------- */
const PER_MODEL = {
};

const modelFile = document.body.dataset.model;
const title     = document.body.dataset.title || "Specimen";
document.title  = title;

const CFG = Object.assign({}, SETTINGS, PER_MODEL[title] || {});

/* ---- styles ---------------------------------------------------- */
const style = document.createElement('style');
style.textContent = `
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden;
    -webkit-text-size-adjust:100%;
    font-family:ui-sans-serif,system-ui,-apple-system,sans-serif}
  model-viewer{position:fixed;inset:0;width:100%;height:100%;background:#000;
    --progress-bar-color:#3fb950;--progress-mask:transparent;
    --poster-color:transparent}
  .ctrls{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);
    z-index:5;display:flex;gap:9px}
  .ctrls button{appearance:none;cursor:pointer;font:inherit;font-size:12px;
    font-weight:600;letter-spacing:.14em;text-transform:uppercase;
    color:rgba(255,255,255,.72);background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.18);border-radius:100px;
    padding:10px 22px;backdrop-filter:blur(4px);
    transition:color .15s,border-color .15s,background .15s}
  .ctrls button:hover,.ctrls button:focus-visible{color:#fff;
    border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.1);
    outline:none}
  @media (max-width:520px){
    .ctrls{bottom:16px;gap:7px}
    .ctrls button{font-size:11px;padding:9px 16px}}
`;
document.head.appendChild(style);

/* ---- the viewer ------------------------------------------------ */
const mv = document.createElement('model-viewer');
mv.id = 'mv';
mv.setAttribute('src', encodeURI(modelFile));
mv.setAttribute('alt', `${title}, an interactive 3D model`);
mv.setAttribute('environment-image', CFG.environment);
mv.setAttribute('exposure',          CFG.exposure);
mv.setAttribute('tone-mapping',      CFG.toneMapping);
mv.setAttribute('shadow-intensity',  CFG.shadowIntensity);
mv.setAttribute('shadow-softness',   CFG.shadowSoftness);
mv.setAttribute('camera-controls', '');
mv.setAttribute('interaction-prompt', 'none');
mv.setAttribute('auto-rotate', '');
mv.setAttribute('auto-rotate-delay', String(CFG.resumeDelayMs));
mv.setAttribute('rotation-per-second', CFG.rotationSpeed);
mv.setAttribute('loading', 'eager');
document.body.appendChild(mv);

/* ---- framing ---------------------------------------------------
   Polycam's viewer framing is NOT saved inside the .glb, so without
   this every model opens at whatever distance and angle the file
   happens to sit at. This measures each model and sets the camera so
   they all present at the same size on screen. */
function bestTheta(){
  const d = mv.getDimensions ? mv.getDimensions() : null;
  if (!d || !CFG.autoBestAngle) return 0;
  // Look down the thinnest horizontal axis, so the widest face faces us.
  return (d.z <= d.x) ? 0 : 90;
}

function frameModel(){
  const d = mv.getDimensions ? mv.getDimensions() : null;
  if (!d) return;

  const halfH  = d.y / 2;
  // widest the silhouette ever gets while spinning about the vertical axis
  const halfW  = (d.x + d.z) / (2 * Math.SQRT2);
  const vFov   = (mv.getFieldOfView() * Math.PI) / 180;
  const aspect = mv.clientWidth / mv.clientHeight;

  const distH  = halfH / (Math.tan(vFov/2) * CFG.frameHeight);
  const distW  = halfW / (Math.tan(vFov/2) * aspect * CFG.maxWidth);
  const radius = Math.max(distH, distW);

  mv.cameraTarget = 'auto auto auto';
  mv.cameraOrbit  = `${bestTheta()}deg ${CFG.startPhi} ${radius}m`;
  mv.jumpCameraToGoal();

  mv.setAttribute('min-camera-orbit', `auto auto ${(radius*0.25).toFixed(3)}m`);
  mv.setAttribute('max-camera-orbit', `auto auto ${(radius*4).toFixed(3)}m`);
}

/* ---- surface finish --------------------------------------------
   The exports carry a metallic-roughness map and a normal map. With
   the environment light those make the surface look wet, and the
   normal map's highlights read as reflections sitting on top of the
   texture. Forcing the surface rough and non-metallic gives a
   natural, specimen-like finish. */
function deShine(){
  const k = CFG.matteness;
  if (!k) return;
  for (const s of Object.getOwnPropertySymbols(mv)){
    const v = mv[s];
    if (v && v.traverse){
      v.traverse(o => {
        if (o.isMesh && o.material){
          const m = o.material;
          m.roughnessMap = null;
          m.metalnessMap = null;
          m.roughness = 1;
          m.metalness = 0;
          m.envMapIntensity = 1 - (0.6 * k);
          if (m.normalScale) m.normalScale.set(1 - 0.5*k, 1 - 0.5*k);
          m.needsUpdate = true;
        }
      });
      break;
    }
  }
}

mv.addEventListener('load', () => {
  requestAnimationFrame(() => { frameModel(); deShine(); });
});
window.addEventListener('resize', () => { if (mv.loaded) frameModel(); });

/* ---- controls --------------------------------------------------- */
const ctrls = document.createElement('div');
ctrls.className = 'ctrls';

const recBtn = document.createElement('button');
recBtn.id = 'recentreBtn';
recBtn.textContent = 'Recentre';
recBtn.title = 'Return to the opening view';

const spinBtn = document.createElement('button');
spinBtn.id = 'spinBtn';
spinBtn.textContent = 'Pause';
spinBtn.setAttribute('aria-pressed', 'false');

ctrls.appendChild(recBtn);
ctrls.appendChild(spinBtn);
document.body.appendChild(ctrls);

let paused = false;
function applySpin(){
  if (paused){
    mv.removeAttribute('auto-rotate');
  } else {
    // zero the delay so the button starts spin immediately, then restore
    // the grace period that applies after a drag
    mv.setAttribute('auto-rotate-delay', '0');
    mv.setAttribute('auto-rotate', '');
    requestAnimationFrame(() =>
      mv.setAttribute('auto-rotate-delay', String(CFG.resumeDelayMs)));
  }
  spinBtn.textContent = paused ? 'Spin' : 'Pause';
  spinBtn.setAttribute('aria-pressed', String(paused));
}
spinBtn.addEventListener('click', () => { paused = !paused; applySpin(); });

recBtn.addEventListener('click', () => {
  frameModel();                       // re-measure, so it works after any zoom
  if (paused){ paused = false; applySpin(); }
});
