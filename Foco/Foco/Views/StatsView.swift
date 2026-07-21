import SwiftUI

struct StatsView: View {
    @ObservedObject var history: HistoryStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack(spacing: 12) {
                        statBlock(value: "\(history.weekFocusCount)", label: "Enfoques esta semana")
                        statBlock(value: "\(history.weekFocusMinutes)", label: "Minutos de foco")
                    }

                    Text("ÚLTIMOS 7 DÍAS")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .tracking(1)

                    weekChart

                    Text("RECIENTES")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .tracking(1)

                    if history.sessions.isEmpty {
                        Text("Aún no hay enfoques completados. Termina un bloque para verlo aquí.")
                            .foregroundStyle(.secondary)
                            .font(.subheadline)
                    } else {
                        VStack(spacing: 8) {
                            ForEach(history.sessions.prefix(8)) { session in
                                HStack {
                                    Text(session.task ?? "\(session.minutes) min")
                                        .font(.body.weight(.semibold))
                                    Spacer()
                                    Text(detail(for: session))
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                        .monospacedDigit()
                                }
                                .padding(14)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(Color.black.opacity(0.08), lineWidth: 1)
                                )
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(Color(red: 0.97, green: 0.98, blue: 0.97))
            .navigationTitle("Progreso")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var weekChart: some View {
        let days = history.last7Days()
        let maxCount = max(1, days.map(\.count).max() ?? 1)

        return HStack(alignment: .bottom, spacing: 8) {
            ForEach(days, id: \.key) { day in
                VStack(spacing: 6) {
                    Spacer(minLength: 0)
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(barColor(for: day))
                        .frame(height: max(4, CGFloat(day.count) / CGFloat(maxCount) * 100))
                    Text(day.count == 0 ? "·" : "\(day.count)")
                        .font(.caption2.weight(.semibold))
                        .monospacedDigit()
                    Text(day.label)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(day.isToday ? Color(red: 0.85, green: 0.29, blue: 0.16) : .secondary)
                }
                .frame(maxWidth: .infinity, minHeight: 140, alignment: .bottom)
            }
        }
    }

    private func barColor(for day: (date: Date, key: String, label: String, count: Int, minutes: Int, isToday: Bool)) -> Color {
        if day.isToday {
            return Color(red: 0.85, green: 0.29, blue: 0.16)
        }
        if day.count > 0 {
            return Color(red: 0.85, green: 0.29, blue: 0.16).opacity(0.45)
        }
        return Color.black.opacity(0.12)
    }

    private func statBlock(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(value)
                .font(.system(.largeTitle, design: .serif).weight(.semibold))
                .monospacedDigit()
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.black.opacity(0.08), lineWidth: 1)
        )
    }

    private func detail(for session: FocusSession) -> String {
        let time = session.endedAt.formatted(date: .omitted, time: .shortened)
        if let task = session.task, !task.isEmpty {
            return "\(session.minutes) min · \(relativeDay(session.endedAt)) · \(time)"
        }
        return "\(relativeDay(session.endedAt)) · \(time)"
    }

    private func relativeDay(_ date: Date) -> String {
        if Calendar.current.isDateInToday(date) { return "Hoy" }
        if Calendar.current.isDateInYesterday(date) { return "Ayer" }
        return date.formatted(.dateTime.day().month(.abbreviated))
    }
}
