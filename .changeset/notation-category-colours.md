---
'@randsum/roller': patch
'@randsum/mcp': patch
---

Recolour notation docs by spec category. Every `NotationDoc` in the `./docs` subpath now takes its `color` and `colorLight` from its category family (Filter, Generate/Accumulate, Substitute/Map, Clamp, Reinterpret, Scale, and a neutral for Order, Dispatch and Special), and dice (`xDN`, `d%`, `dF` and the other special dice) are plain ink. The shape of the data is unchanged; only the hex values moved.
