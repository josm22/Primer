import Foundation
import Combine
import UIKit

@MainActor
final class PomodoroTimerModel: ObservableObject {
    @Published var phase: PomodoroPhase = .focus
    @Published var remainingSeconds: Int = 25 * 60
    @Published var totalSeconds: Int = 25 * 60
    @Published var isRunning = false
    @Published var completedInCycle = 0
    @Published var task = ""

    let settingsStore = SettingsStore()
    let historyStore = HistoryStore()

    private var timer: Timer?
    private var endDate: Date?
    private var cancellables = Set<AnyCancellable>()

    var progress: Double {
        guard totalSeconds > 0 else { return 0 }
        return 1 - Double(remainingSeconds) / Double(totalSeconds)
    }

    var primaryTitle: String {
        if isRunning { return "Pausa" }
        if remainingSeconds < totalSeconds { return "Continuar" }
        return "Empezar"
    }

    var roundLabel: String {
        let rounds = settingsStore.settings.roundsUntilLong
        let current = min(completedInCycle + 1, rounds)
        return "\(current)/\(rounds)"
    }

    init() {
        resetPhase(.focus)
        settingsStore.objectWillChange
            .sink { [weak self] _ in self?.objectWillChange.send() }
            .store(in: &cancellables)
        historyStore.objectWillChange
            .sink { [weak self] _ in self?.objectWillChange.send() }
            .store(in: &cancellables)
    }

    func toggle() {
        if isRunning { pause() } else { start() }
    }

    func start() {
        guard !isRunning else { return }
        if remainingSeconds <= 0 {
            resetPhase(phase)
        }
        isRunning = true
        endDate = Date().addingTimeInterval(TimeInterval(remainingSeconds))
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tick()
            }
        }
        if let timer {
            RunLoop.main.add(timer, forMode: .common)
        }
        UIApplication.shared.isIdleTimerDisabled = true
        SoundPlayer.prepare()
    }

    func pause() {
        tick()
        isRunning = false
        endDate = nil
        timer?.invalidate()
        timer = nil
        UIApplication.shared.isIdleTimerDisabled = false
    }

    func resetCurrent() {
        pause()
        resetPhase(phase)
    }

    func skip() {
        pause()
        advance(from: phase, countFocus: false)
    }

    func applySettingsRefresh() {
        guard !isRunning else { return }
        resetPhase(phase)
    }

    private func tick() {
        guard isRunning, let endDate else { return }
        let left = Int(ceil(endDate.timeIntervalSinceNow))
        remainingSeconds = max(0, left)
        if remainingSeconds <= 0 {
            completePhase()
        }
    }

    private func completePhase() {
        let finished = phase
        let minutes = settingsStore.minutes(for: finished)
        pause()
        remainingSeconds = 0

        if settingsStore.settings.soundEnabled {
            SoundPlayer.playChime()
        }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        if finished == .focus {
            historyStore.record(minutes: minutes, task: task)
        }

        advance(from: finished, countFocus: finished == .focus)

        if settingsStore.settings.autoAdvance {
            start()
        }
    }

    private func advance(from finished: PomodoroPhase, countFocus: Bool) {
        let next: PomodoroPhase
        if finished == .focus {
            let nextCount = completedInCycle + 1
            if nextCount >= settingsStore.settings.roundsUntilLong {
                completedInCycle = 0
                next = .longBreak
            } else {
                completedInCycle = nextCount
                next = .shortBreak
            }
            _ = countFocus
        } else {
            next = .focus
        }
        resetPhase(next)
    }

    private func resetPhase(_ phase: PomodoroPhase) {
        self.phase = phase
        let seconds = settingsStore.minutes(for: phase) * 60
        totalSeconds = seconds
        remainingSeconds = seconds
    }
}
