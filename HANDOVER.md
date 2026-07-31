# MDC 3D Viewer — Handover

**ABM visual · Marine Discovery Centre · Henley Beach Beachcombing Experience**
Last updated: 30 July 2026

---

## 1. Why this exists

Polycam applied `X-Frame-Options: deny`, which blocks their captures from being
embedded anywhere, including inside their own pages. This broke the 50 object
models inside the Captur3d/Matterport beachcombing tour.

Polycam have confirmed it as a known issue affecting multiple users. They will
not commit to a timeline. This has happened before (Feb 2025, same embed, fixed
then broke again). The school network also blocks `poly.cam` outright, so even a
plain hyperlink workaround fails.

**Decision: move off Polycam hosting entirely.** Export the GLBs, self-host
them, and render with Google's `<model-viewer>` (MIT, free, no account).
The centre then owns the assets and nothing external can switch them off.

---

## 2. Current state

Repo: `github.com/ABMvisual/mdc-3d` (public — required for free Pages)
Live: `https://abmvisual.github.io/mdc-3d/`

| File | Purpose | State |
|---|---|---|
| `index.html` | Main specimen viewer | **Build 4**, working |
| `network-check.html` | Diagnostic page for the school network | Working |
| `annotator.html` | Internal tool to place markers | Working, wants UI polish |
| `model-viewer.min.js` | Self-hosted viewer library, v4.3.1 | Do not touch |
| `dolphin-vertebra.glb` | Test specimen, normals+tangents added | Working |

### URLs

- Main viewer — `https://abmvisual.github.io/mdc-3d/`
- Network check — `https://abmvisual.github.io/mdc-3d/network-check.html`
- Annotator — `https://abmvisual.github.io/mdc-3d/annotator.html`

### Build 4 features (index.html)

- 3 numbered markers on the model, synced to `i`/`1`/`2`/`3` chips in the panel
- Info panel: fixed header (title never changes) + swapping body text
- Camera reframes onto the chosen marker using its stored surface normal
- `Pause spin` — hard lock for teachers, survives marker selection
- Auto-rotate pauses while a marker is open, resumes on `i`
- Touch, mouse and keyboard, with a `How to use` panel documenting all three
- Version badge top-left, reads from `BUILD.version`

### Keyboard

`←→` turn · `↑↓` tilt · `+/−` zoom · `1 2 3` markers · `I`/`Esc` home ·
`R` reset · `S` toggle spin

### Mouse

Left-drag rotate · right-drag or Shift+drag pan · scroll zoom

---

## 3. Next architectural step (agreed, not yet built)

**Do this before building 50 specimens.** Currently markers and text are
hardcoded per file, so 50 specimens means 50 near-duplicate HTML files, and any
UI change means editing all 50.

### Target: two files, same pattern as Eye Spy 3D

```
viewer.html          one page, reads ?s= from the URL
specimens.json       all 50 specimens' text + marker coordinates
barnacle.glb         one GLB per specimen
dolphin-vertebra.glb
...
```

Captur3d tag URLs become `.../viewer.html?s=barnacle`

### Proposed `specimens.json` shape

```json
{
  "barnacle": {
    "title": "Barnacle",
    "location": "Henley Beach",
    "model": "barnacle.glb",
    "intro": "Opening text shown under the i button.",
    "glbExport": "polycam-gltf-2026-05-02",
    "markers": [
      {
        "position": "0.0294m 0.5125m 0.0362m",
        "normal": "-0.7355m 0.1699m 0.6559m",
        "head": "Centrum",
        "text": "The ribbed disc that carried the animal's weight."
      }
    ]
  }
}
```

### Why `glbExport` is in there

Marker coordinates are tied to the exact GLB they were placed against. If a
specimen is re-exported from Polycam with different decimation, every marker for
it silently drifts. Recording which export the coordinates came from makes that
recoverable instead of mysterious.

### Standard: 3 markers per specimen

Keeps the schema uniform, the UI predictable, and the labour estimate tight for
quoting. Deviate only where a specimen genuinely needs it.

---

## 4. Known gotchas (learned the hard way, don't rediscover these)

**Polycam GLB exports have no NORMAL or TANGENT attributes,** but their material
references a normal map. Result: flat faceted shading and white translucent
shards, and it looks *worse* than Polycam's own viewer. This is not a hosting or
model-viewer limitation and buying a paid Polycam plan will not fix it. Fix is
free and local: generate smooth normals (averaged across coincident position
groups so UV seams don't crack) and tangents from the UVs. Script exists,
`fixglb.py` approach documented in this thread. Cost was 2.14 MB → 2.47 MB.

**Do not set `orientation` repeatedly on this model-viewer build.** Writing it at
animation-frame rate crashes inside model-viewer's own scene-update lifecycle,
roughly 90% of sustained runs, `Cannot read properties of null (reading 'add')`.
Throttling does not help. `cameraOrbit` writes at the same rate are completely
stable. If continuous tumbling is ever wanted again, do it by orbiting the camera
through the pole (mirror phi, rotate theta 180°), not by rotating the model.

**GitHub web uploader stalls on the largest file in a batch.** Upload the GLB
alone, then the JS alone, then the HTML files. For 50 specimens, use GitHub
Desktop instead of the web UI.

**Filename collisions.** Root must stay `index.html` (Pages serves it for the
bare URL, and the Captur3d tag points there). Everything else gets a unique name
so macOS never appends `(1)`. Deliveries come as a single zip for the same reason.

**Cache.** Captur3d and browsers both cached the 404s during setup. `?v=2` on the
end of a URL forces a refetch.

---

## 5. Annotator — current state and what's next

`annotator.html` works. Drop a GLB on it (stays local, nothing uploads), toggle
`Add marker`, click the model surface. It uses model-viewer's own
`positionAndNormalFromPoint()`, the same hit-test the official
modelviewer.dev editor uses, so placement is exact rather than eyeballed.

Each marker gets a heading and body field. Reorder with arrows, delete with ×.
The export box regenerates live and emits three paste-ready blocks (chips,
hotspot buttons, CONTENT entries). Coordinates are rounded to 4dp.

Tested end to end against the dolphin GLB: real mesh hits, correct escaping
(including apostrophes), clean output.

### Wanted (Michael's request)

Manual placement of all markers is preferred over anything automated. The target
feel is adding a tag in Matterport or Sketchfab: **spin the model, click where
the hotspot goes, done.** Priorities:

1. Make placement feel that immediate
2. Make extracting the input data trivially easy
3. Once `specimens.json` exists, export **JSON** rather than HTML blocks

### Untested

How the reorder/delete flow holds up at 6–7 markers on one model. Worth a real
run-through on a second specimen before trusting the time estimate.

---

## 6. Open items

**Analytics — resolved, nothing to build.** Captur3d already reports tag clicks
and content clicks, which covers the question with actual reporting value: *which
specimens do people open*. That is the figure likely to matter for Green Adelaide
acquittal. No additional tracking is being added to the viewer.

**Hosting and bandwidth — resolved.** GitHub Pages has a ~100 GB/month soft
limit. At ~3.5 MB per page load that is roughly 28,000 loads/month. The centre's
traffic is nowhere near that. If it is ever exceeded (busy event, or something
goes viral, which would be a good problem), migrate to the centre's own website.

The reason this is low-risk: only dumb file storage is being rented. Moving hosts
means copying files and updating the tag URLs. Nothing about the viewer, the
markers or the content changes. That is the structural difference from Polycam,
who controlled the viewer, the embed policy and the data all at once.

Fallback order: GitHub Pages → centre's own website → Cloudflare Pages
(unlimited bandwidth, free tier).

**Version pinning.** Self-hosting model-viewer 4.3.1 means no surprise CDN
updates, but also no bug fixes. A known bug already exists in this build (see
gotchas). Single-page architecture makes any future upgrade far cheaper to retest.

**Fallback host.** If the school blocks `github.io` (Fortinet category filtering
is the likely culprit), the fallback is hosting on the centre's own domain, which
is already proven reachable. Told to Carmen as an option, so it's a real
commitment, not a hypothetical.

**Pending:** Carmen's network test result. Reverting the barnacle tag to the
Polycam link afterwards (30 second job, she'll follow up).

---

## 7. Status summary

Proof of concept is sound and Carmen has the test. The architecture refactor and
the annotator polish are the build phase, not the approval phase. Quote should be
sent only after the network test result, and should be based on the
JSON-architecture labour estimate, not the 50-separate-files one.

---

## 8. Quote scope notes

Items to state explicitly so nothing is assumed:

**Included in the build**
- Export and repair of 50 GLBs (normals and tangents generated; see gotchas)
- Marker placement, 3 per specimen as standard, manually positioned
- Educational text per marker, integrated from the existing popup info
- Single viewer page plus `specimens.json` (not 50 separate files)
- Touch, mouse and keyboard support with on-screen instructions
- Teacher pause control
- Captur3d tag URLs updated to the new pattern

**Hosting**
- Hosted free on GitHub Pages. No subscription, no per-model fee, no expiry.
- Centre owns the model files outright. Deliverable includes the GLB set.
- If bandwidth is ever exceeded, migration to the centre's own website is
  straightforward and does not require rebuilding anything.

**Explicitly not included / worth flagging**
- Polycam remains broken with no committed timeline from them. This work exists
  to remove that dependency, not to wait on it.
- No analytics or tracking is built into the viewer. Captur3d's existing tag
  reporting remains the source for usage figures.
- Re-exporting a specimen from Polycam later will invalidate that specimen's
  marker coordinates and require repositioning.

**Rate**
Day rate rather than the usual per-model rate, as a courtesy given the outage
originated with a platform decision outside the centre's control. Capacity
available over the coming weeks; a few days' work once confirmed, measured from
the agreed start date.

---

## 9. UI work queue

_To be filled in._
