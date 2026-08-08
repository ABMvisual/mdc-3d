/* ================================================================
   viewer.js  ·  ABM visual  ·  Marine Discovery Centre
   ----------------------------------------------------------------
   The ONE shared file. Every specimen page loads this. To change
   lighting, the spin button, zoom, colours or behaviour for ALL 50
   specimens at once, edit THIS file and push it. Nothing else.

   Each specimen page only needs:
     <body data-model="Abalone.glb" data-title="Abalone">
     <script type="module" src="viewer.js"></script>
   ================================================================ */

/* ---- lighting & viewer settings (edit these to taste) ---------- */
const SETTINGS = {
  exposure:        "0.85",
  toneMapping:     "neutral",
  environment:     "neutral",
  shadowIntensity: "0.35",
  shadowSoftness:  "1",
  cameraOrbit:     "42deg 78deg 1.75m",
  cameraTarget:    "0m 0.45m 0m",
  fieldOfView:     "30deg",
  minZoom:         "0.15m",
  maxZoom:         "12m",
  rotationSpeed:   "24deg",
  resumeDelayMs:   1500,     // pause-before-spin-resumes after a drag
  doubleSided:     true       // render both faces (fills Polycam's one-sided "holes")
};

const model = document.body.dataset.model;
const title = document.body.dataset.title || "Specimen";
document.title = title;

/* ---- inject shared styles ---- */
const style = document.createElement('style');
style.textContent = `
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden;
    -webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif}
  model-viewer{position:fixed;inset:0;width:100%;height:100%;background:#000;
    --progress-bar-color:#3fb950;--progress-mask:transparent;--poster-color:transparent}
  #spinBtn{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:5;
    appearance:none;cursor:pointer;font:inherit;font-size:12px;font-weight:600;
    letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);
    background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);
    border-radius:100px;padding:10px 22px;backdrop-filter:blur(4px);
    transition:color .15s,border-color .15s,background .15s}
  #spinBtn:hover,#spinBtn:focus-visible{color:#fff;border-color:rgba(255,255,255,.4);
    background:rgba(255,255,255,.1);outline:none}
  @media (max-width:520px){#spinBtn{bottom:16px;font-size:11px;padding:9px 18px}}
`;
document.head.appendChild(style);

/* ---- build the model-viewer element ---- */
const mv = document.createElement('model-viewer');
mv.id = 'mv';
mv.setAttribute('src', encodeURI(model));
mv.setAttribute('alt', `${title}, an interactive 3D model`);
mv.setAttribute('camera-orbit', SETTINGS.cameraOrbit);
mv.setAttribute('camera-target', SETTINGS.cameraTarget);
mv.setAttribute('field-of-view', SETTINGS.fieldOfView);
mv.setAttribute('environment-image', SETTINGS.environment);
mv.setAttribute('exposure', SETTINGS.exposure);
mv.setAttribute('tone-mapping', SETTINGS.toneMapping);
mv.setAttribute('shadow-intensity', SETTINGS.shadowIntensity);
mv.setAttribute('shadow-softness', SETTINGS.shadowSoftness);
mv.setAttribute('camera-controls', '');
mv.setAttribute('interaction-prompt', 'none');
mv.setAttribute('min-camera-orbit', `auto auto ${SETTINGS.minZoom}`);
mv.setAttribute('max-camera-orbit', `auto auto ${SETTINGS.maxZoom}`);
mv.setAttribute('auto-rotate', '');
mv.setAttribute('auto-rotate-delay', String(SETTINGS.resumeDelayMs));
mv.setAttribute('rotation-per-second', SETTINGS.rotationSpeed);
mv.setAttribute('loading', 'eager');
document.body.appendChild(mv);

/* ---- fill one-sided "holes" ----
   Polycam meshes are single-sided, so model-viewer shows through the shell
   where a polygon faces away, leaving dark gaps that aren't real holes.
   Forcing every material double-sided draws both faces and matches how
   Polycam's own viewer looks. No change to the GLB files is needed. */
mv.addEventListener('load', () => {
  if (!SETTINGS.doubleSided) return;
  try {
    for (const mat of mv.model.materials){
      if (mat.setDoubleSided) mat.setDoubleSided(true);
    }
  } catch (e) { /* older viewer without the API: silently skip */ }
});

/* ---- Pause / Spin button (instant) ---- */
const btn = document.createElement('button');
btn.id = 'spinBtn';
btn.textContent = 'Pause';
btn.setAttribute('aria-pressed', 'false');
document.body.appendChild(btn);

let paused = false;
function apply(){
  if (paused){
    mv.removeAttribute('auto-rotate');
  } else {
    mv.setAttribute('auto-rotate-delay','0');           // start now
    mv.setAttribute('auto-rotate','');
    requestAnimationFrame(() =>
      mv.setAttribute('auto-rotate-delay', String(SETTINGS.resumeDelayMs)));
  }
  btn.textContent = paused ? 'Spin' : 'Pause';
  btn.setAttribute('aria-pressed', String(paused));
}
btn.addEventListener('click', () => { paused = !paused; apply(); });
