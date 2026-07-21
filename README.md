# Cuello — mapa y cuaderno

App móvil para seguimiento cervical: diagrama anatómico interactivo, rutina por fases (Liberar → Activar → Reeducar), registro de dolor y progreso diario.

## Demo en vivo

**https://josm22.github.io/Primer/**

Instálala como PWA desde el navegador (móvil o escritorio) para recordatorios y uso offline.

## Contenido

- **Hoy** — rutina guiada, escala de dolor, logros, chin tuck y pausas activas
- **Mapa** — músculos tensos/débiles con enlace a ejercicios
- **Guía** — 9 ejercicios en 3 fases
- **Datos** — gráficos, informe para el fisio, exportar/importar backup

Los datos se guardan solo en el dispositivo (`localStorage`).

## Desarrollo local

Abre `index.html` con un servidor estático (necesario para el service worker):

```bash
python3 -m http.server 8080
```

Luego visita http://localhost:8080

## Otras apps en este repo

- **[Foco](./pomodoro/)** — Pomodoro para iPhone: [josm22.github.io/Primer/pomodoro/](https://josm22.github.io/Primer/pomodoro/)
- **[Escoba](./escoba/)** — Escoba del 15 online

## Despliegue

GitHub Pages despliegue automáticamente al hacer push a `main` (workflow `.github/workflows/pages.yml`).

**Primera vez:** en el repo de GitHub ve a **Settings → Pages → Build and deployment → Source: GitHub Actions**. Si el entorno `github-pages` tiene reglas de protección, permite despliegues desde la rama `main`.
