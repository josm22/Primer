import SwiftUI

struct TimerRing: View {
    let progress: Double
    let accent: Color
    let isRunning: Bool

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.black.opacity(0.08), lineWidth: 10)

            Circle()
                .trim(from: 0, to: max(0.001, 1 - progress))
                .stroke(accent, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.25), value: progress)
                .opacity(isRunning ? 0.86 : 1)
                .animation(
                    isRunning
                        ? .easeInOut(duration: 1.4).repeatForever(autoreverses: true)
                        : .default,
                    value: isRunning
                )
        }
    }
}
