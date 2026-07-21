import SwiftUI

struct SettingsView: View {
    @ObservedObject var settingsStore: SettingsStore
    var onChange: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Duraciones") {
                    minuteStepper("Enfoque", value: $settingsStore.settings.focusMinutes, range: 1...90)
                    minuteStepper("Descanso corto", value: $settingsStore.settings.shortMinutes, range: 1...30)
                    minuteStepper("Descanso largo", value: $settingsStore.settings.longMinutes, range: 1...60)
                    Stepper(value: $settingsStore.settings.roundsUntilLong, in: 2...8) {
                        HStack {
                            Text("Hasta descanso largo")
                            Spacer()
                            Text("\(settingsStore.settings.roundsUntilLong)")
                                .foregroundStyle(.secondary)
                                .monospacedDigit()
                        }
                    }
                }

                Section("Comportamiento") {
                    Toggle("Sonido al terminar", isOn: $settingsStore.settings.soundEnabled)
                    Toggle("Autoavanzar", isOn: $settingsStore.settings.autoAdvance)
                }
            }
            .navigationTitle("Ajustes")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: settingsStore.settings) { _, _ in
                onChange()
            }
        }
    }

    private func minuteStepper(_ title: String, value: Binding<Int>, range: ClosedRange<Int>) -> some View {
        Stepper(value: value, in: range) {
            HStack {
                Text(title)
                Spacer()
                Text("\(value.wrappedValue) min")
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
        }
    }
}
