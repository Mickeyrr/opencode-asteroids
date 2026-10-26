# AGENTS.md

Clon de Asteroids en HTML5 Canvas, JS puro. Sin dependencias, bundler ni build.

## Correr / verificar

```bash
npx serve .          # o abrir index.html directamente
node --check game.js # única verificación automática disponible (no hay tests ni lint)
```

No existen tests, CI, package.json ni formatter. La verificación real es abrir el juego y jugar.

## Estructura

- `index.html` — layout y `<canvas id="canvas" width="800" height="600">`; carga `game.js` como script clásico (no módulo, sin imports).
- `game.js` — todo el juego: clase `Bullet`, `Asteroid`, `Ship`, `Particle`, estado global y loop `requestAnimationFrame`.
- `favicon.svg`, `README.md`.

## Quirks a respetar

- `W = 800` / `H = 600` en `game.js` deben coincidir con los atributos del canvas en `index.html`. Cambiar uno solo rompe el wrapping.
- Espacio toroidal: todo lo que se mueve debe pasar por `wrap(v, max)`. No hay colisiones en bordes.
- Física con `dt` en segundos (clamp a `0.05` en `loop`). No usar constantes por frame; multiplicar por `dt`.
- `pressed(code)` consume `justPressed`; llamarlo una sola vez por frame para la misma tecla.
- `RADII`, `SPEEDS`, `POINTS` están indexados por tamaño: `1` = pequeño (100 pts), `2` = mediano (50), `3` = grande (20) y es el que se parte con `split()`.
- Estados en `state`: `'playing' | 'dead' | 'gameover'`; `update()` sale temprano según el estado.
- Cambiar el tamaño del canvas o las velocidades afecta el balance; ajustar `RADII`/`SPEEDS`/`THRUST` en conjunto.

## Convenciones

- Código e identificadores en inglés; textos visibles al usuario en español (`SCORE`, `NIVEL`... son excepción existente).
- Comentarios solo donde aportan; los bloques actuales usan separadores `// ── Sección ───`.
- Sin frameworks ni dependencias: no introducir npm, bundler ni módulos ES.
