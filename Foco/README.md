# Foco — app nativa iOS (SwiftUI)

Versión nativa de **Foco**, el temporizador Pomodoro. Misma idea que la PWA en `/pomodoro`, pensada para abrirla en Xcode y ejecutarla en iPhone o simulador.

## Requisitos

- macOS con **Xcode 15+**
- iOS 17 o superior

## Abrir y ejecutar

1. Clona el repo y abre `Foco/Foco.xcodeproj` en Xcode.
2. Elige un simulador o tu iPhone.
3. En el target **Foco**, pon tu **Team** de firma (Signing & Capabilities).
4. Pulsa ▶ Run.

## Qué incluye

- Ciclos enfoque / descanso corto / descanso largo
- Ajustes de duraciones, sonido y autoavance
- Tarea actual opcional
- Progreso semanal e historial reciente
- Campanilla al terminar y haptic feedback
- Pantalla que no se apaga mientras corre el timer

## PWA vs nativa

| | PWA (`/pomodoro`) | Nativa (`/Foco`) |
|---|---|---|
| Instalar | Safari → Añadir a inicio | Xcode → dispositivo |
| Offline | Sí | Sí |
| Notificaciones | Limitadas en iOS | Mejor base para ampliar |

La PWA sigue disponible en GitHub Pages para usarla al momento sin Mac.
