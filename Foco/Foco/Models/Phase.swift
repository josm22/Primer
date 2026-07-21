import SwiftUI

enum PomodoroPhase: String, CaseIterable, Identifiable {
    case focus
    case shortBreak
    case longBreak

    var id: String { rawValue }

    var label: String {
        switch self {
        case .focus: return "Enfoque"
        case .shortBreak: return "Descanso corto"
        case .longBreak: return "Descanso largo"
        }
    }

    var support: String {
        switch self {
        case .focus: return "Un bloque para concentrarte sin distracciones."
        case .shortBreak: return "Levántate un momento y suelta la mirada."
        case .longBreak: return "Respira. Has completado un ciclo completo."
        }
    }

    var accent: Color {
        switch self {
        case .focus: return Color(red: 0.85, green: 0.29, blue: 0.16)
        case .shortBreak: return Color(red: 0.16, green: 0.48, blue: 0.41)
        case .longBreak: return Color(red: 0.18, green: 0.37, blue: 0.54)
        }
    }

    var backgroundTop: Color {
        switch self {
        case .focus: return Color(red: 0.91, green: 0.94, blue: 0.92)
        case .shortBreak: return Color(red: 0.89, green: 0.95, blue: 0.93)
        case .longBreak: return Color(red: 0.90, green: 0.93, blue: 0.96)
        }
    }
}
