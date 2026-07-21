import Foundation
import Combine

struct FocusSession: Identifiable, Codable, Equatable {
    let id: UUID
    let dateKey: String
    let minutes: Int
    let task: String?
    let endedAt: Date
}

@MainActor
final class HistoryStore: ObservableObject {
    @Published private(set) var sessions: [FocusSession] = []

    private let key = "foco.history.v1"

    init() {
        load()
    }

    func record(minutes: Int, task: String?) {
        let now = Date()
        let session = FocusSession(
            id: UUID(),
            dateKey: Self.dayKey(now),
            minutes: minutes,
            task: task?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            endedAt: now
        )
        sessions.insert(session, at: 0)
        prune()
        save()
    }

    var todayCount: Int {
        let key = Self.dayKey()
        return sessions.filter { $0.dateKey == key }.count
    }

    func last7Days() -> [(date: Date, key: String, label: String, count: Int, minutes: Int, isToday: Bool)] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "EEE"

        return (0..<7).reversed().map { offset in
            let date = calendar.date(byAdding: .day, value: -offset, to: calendar.startOfDay(for: Date())) ?? Date()
            let key = Self.dayKey(date)
            let daySessions = sessions.filter { $0.dateKey == key }
            let label = formatter.string(from: date)
                .replacingOccurrences(of: ".", with: "")
                .prefix(3)
                .capitalized
            return (
                date: date,
                key: key,
                label: String(label),
                count: daySessions.count,
                minutes: daySessions.reduce(0) { $0 + $1.minutes },
                isToday: offset == 0
            )
        }
    }

    var weekFocusCount: Int {
        last7Days().reduce(0) { $0 + $1.count }
    }

    var weekFocusMinutes: Int {
        last7Days().reduce(0) { $0 + $1.minutes }
    }

    private func prune() {
        let cutoff = Calendar.current.date(byAdding: .day, value: -60, to: Date()) ?? Date()
        let cutoffKey = Self.dayKey(cutoff)
        sessions = sessions.filter { $0.dateKey >= cutoffKey }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([FocusSession].self, from: data) else {
            sessions = []
            return
        }
        sessions = decoded.sorted { $0.endedAt > $1.endedAt }
        prune()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    static func dayKey(_ date: Date = Date()) -> String {
        let c = Calendar.current
        let y = c.component(.year, from: date)
        let m = c.component(.month, from: date)
        let d = c.component(.day, from: date)
        return String(format: "%04d-%02d-%02d", y, m, d)
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}
