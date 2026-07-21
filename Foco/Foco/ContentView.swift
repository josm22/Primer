import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: PomodoroTimerModel
    @State private var showSettings = false
    @State private var showStats = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    model.phase.backgroundTop,
                    Color(red: 0.91, green: 0.94, blue: 0.92),
                    Color(red: 0.84, green: 0.90, blue: 0.86),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.5), value: model.phase)

            VStack(spacing: 0) {
                HStack {
                    Text("Foco")
                        .font(.system(size: 42, weight: .semibold, design: .serif))
                        .tracking(-0.5)

                    Spacer()

                    HStack(spacing: 8) {
                        iconButton(systemName: "chart.bar") { showStats = true }
                        iconButton(systemName: "gearshape") { showSettings = true }
                    }
                }
                .padding(.horizontal, 22)
                .padding(.top, 8)

                Spacer(minLength: 12)

                ZStack {
                    TimerRing(
                        progress: model.progress,
                        accent: model.phase.accent,
                        isRunning: model.isRunning
                    )
                    .frame(width: 300, height: 300)

                    VStack(spacing: 10) {
                        Text(model.phase.label.uppercased())
                            .font(.subheadline.weight(.medium))
                            .tracking(1.4)
                            .foregroundStyle(model.phase.accent)

                        Text(timeString(model.remainingSeconds))
                            .font(.system(size: 72, weight: .medium, design: .serif))
                            .monospacedDigit()
                            .tracking(-1.5)
                            .minimumScaleFactor(0.7)
                            .lineLimit(1)

                        Text(model.phase.support)
                            .font(.body)
                            .foregroundStyle(Color(red: 0.29, green: 0.36, blue: 0.33))
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: 180)

                        if model.phase == .focus {
                            TextField("¿En qué estás?", text: $model.task)
                                .multilineTextAlignment(.center)
                                .textInputAutocapitalization(.sentences)
                                .submitLabel(.done)
                                .padding(.horizontal, 8)
                                .frame(maxWidth: 220)
                                .overlay(alignment: .bottom) {
                                    Rectangle()
                                        .fill(model.phase.accent.opacity(0.55))
                                        .frame(height: 1)
                                }
                        }
                    }
                }

                Spacer(minLength: 12)

                VStack(spacing: 14) {
                    Button(action: model.toggle) {
                        Text(model.primaryTitle)
                            .font(.title3.weight(.semibold))
                            .frame(minWidth: 196, minHeight: 56)
                            .foregroundStyle(Color(red: 0.96, green: 0.98, blue: 0.97))
                            .background(Color(red: 0.08, green: 0.13, blue: 0.11), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .buttonStyle(.plain)

                    HStack(spacing: 10) {
                        secondaryButton("Saltar", action: model.skip)
                        secondaryButton("Reiniciar", action: model.resetCurrent)
                    }

                    HStack(spacing: 18) {
                        metaLabel("Ronda", value: model.roundLabel)
                        metaLabel("Hoy", value: "\(model.historyStore.todayCount)")
                    }
                    .font(.subheadline)
                    .foregroundStyle(Color(red: 0.29, green: 0.36, blue: 0.33))
                }
                .padding(.bottom, 22)
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(settingsStore: model.settingsStore) {
                model.applySettingsRefresh()
            }
            .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $showStats) {
            StatsView(history: model.historyStore)
                .presentationDetents([.medium, .large])
        }
    }

    private func iconButton(systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.body.weight(.semibold))
                .frame(width: 44, height: 44)
                .background(.white.opacity(0.42), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.black.opacity(0.12), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
        .foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.11))
    }

    private func secondaryButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.body.weight(.medium))
                .frame(minHeight: 44)
                .padding(.horizontal, 16)
                .foregroundStyle(Color(red: 0.29, green: 0.36, blue: 0.33))
                .background(.white.opacity(0.42), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.black.opacity(0.12), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func metaLabel(_ title: String, value: String) -> some View {
        HStack(spacing: 4) {
            Text(title)
            Text(value).fontWeight(.semibold).foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.11))
        }
        .monospacedDigit()
    }

    private func timeString(_ total: Int) -> String {
        let m = max(0, total) / 60
        let s = max(0, total) % 60
        return String(format: "%02d:%02d", m, s)
    }
}

#Preview {
    ContentView()
        .environmentObject(PomodoroTimerModel())
}
