# RPG Unleashed v48 deployment

v48 bundles the Owlbear Rodeo SDK with Vite instead of loading the SDK from a CDN at runtime.

Render settings:

- Root Directory: `RPG-Unleashed-PWA`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Keep the existing response header:

`Access-Control-Allow-Origin: https://www.owlbear.rodeo`

The Owlbear manifest URL remains:

`https://rpgunleashedchara.onrender.com/owlbear/manifest.json`
