# Escoba — online

Juego de la **Escoba del 15** (baraja española) para iPhone y escritorio. Partidas online por código de invitación, o práctica contra la CPU.

## Jugar

Tras el deploy de GitHub Pages:

**https://josm22.github.io/Primer/escoba/**

En iPhone: Safari → Compartir → **Añadir a pantalla de inicio** para usarla como app.

### Online con un amigo

1. Uno pulsa **Invitar amigo** y comparte el código de 6 caracteres.
2. El otro pulsa **Unirme con código** e introduce el código.
3. La partida empieza sola (primeros en llegar a 21 puntos).

Ambos necesitan internet (sincronización por MQTT). La lógica de la partida la lleva el anfitrión.

### Contra la CPU

**Practicar vs CPU** — sin conexión entre dispositivos.

## Reglas implementadas

- Captura sumando exactamente 15 (Sota=8, Caballo=9, Rey=10).
- Escoba al vaciar la mesa.
- Puntos de ronda: escobas, más cartas, más oros, más sietes, 7 de oros.
- Victoria a 21 puntos.

## Desarrollo local

```bash
cd escoba
python3 -m http.server 8080
```

Abre http://localhost:8080 — los módulos ES y PeerJS requieren servir por HTTP (no `file://`).

## Tests del motor

```bash
node escoba/js/engine.test.js
```

## Nota

Esta carpeta `escoba/` es independiente de la PWA **Cuello** de la raíz del repositorio.
