# Pine Country Landscape — website

Static site for pinecountrylandscape.com. Single-page site (`index.html`) with
season toggle, services grid, instant-estimate tool, before/after gallery, and
Square booking modal.

## Deploy (GitHub Pages)
1. Upload everything in this folder to the repo (keep filenames as-is).
2. Settings → Pages → Source: "Deploy from a branch", Branch: `main`, Folder: `/ (root)`.
3. Site goes live at https://rowanbrandenberg-stack.github.io/pine-country-landscape

## Custom domain
- Settings → Pages → Custom domain: pinecountrylandscape.com
- DNS (at Squarespace): four A records → 185.199.108.153 / .109.153 / .110.153 / .111.153
  and a CNAME: www → rowanbrandenberg-stack.github.io
- Enable "Enforce HTTPS" once it validates.

## Editing pricing
- Services grid + booking list: the `SERVICES` array in the `<script>` near the bottom.
- Estimator math: the `SV` config + `CFG` (CREW_RATE, TRIP_MIN, MARKUP, OWNER_PIN) in the estimator `<script>`.
- Owner view PIN is currently "1234" — change it.
