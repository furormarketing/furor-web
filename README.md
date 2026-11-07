# Furor Marketing — sitio web

Home de furormarketing.com: un solo `index.html` (Three.js + GSAP + Lenis por CDN).

## Imágenes
Subilas a esta misma carpeta, con estos nombres exactos:

| Archivo | Qué es |
|---|---|
| `hero.jpg` | Imagen principal del hero (16:9) |
| `depth.png` | Mapa de profundidad del hero (Depth Anything V2 / MiDaS) |
| `water-mask.png` | (Opcional) máscara del estanque |
| `project-1.jpg` … `project-4.jpg` | Imágenes de los proyectos |

Mientras falten, el sitio usa ilustraciones de respaldo.

## Editar textos y datos
Todo está en el objeto `CONFIG`, al principio del `<script>` en `index.html`:
proyectos, mail, WhatsApp, redes, textos y tiempos de animación.

## Probar en tu compu
Abrí la carpeta en VS Code → extensión "Live Server" → click derecho en `index.html` → "Open with Live Server".
(No lo abras con doble click: Chrome bloquea las texturas WebGL desde archivos locales.)

## Publicación
Cada cambio que se sube a la rama `main` se publica solo en GitHub Pages en 1–2 minutos.
