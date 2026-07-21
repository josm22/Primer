import Foundation
import Combine

struct PomodoroSettings: Codable, Equatable {
    var focusMinutes: Int = 25
    var shortMinutes: Int = 5
    var longMinutes: Int = 15
    var roundsUntilLong: Int = 4
    var soundEnabled: Bool = true
    var autoAdvance: Bool = true
}

@MainActor
final class SettingsStore: ObservableObject {
    @Published var settings: PomodoroSettings {
        didSet { save() }
    }

    private let key = "foco.settings.v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode(PomodoroSettings.self, from: data) {
            settings = decoded
        } else {
            settings = PomodoroSettings()
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    func minutes(for phase: PomodoroPhase) -> Int {
        switch phase {
        case .focus: return settings.focusMinutes
        case .shortBreak: return settings.shortMinutes
        case .longBreak: return settings.longMinutes
        }
    }
}
