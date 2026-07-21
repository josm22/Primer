import SwiftUI

@main
struct FocoApp: App {
    @StateObject private var timerModel = PomodoroTimerModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(timerModel)
                .preferredColorScheme(.light)
        }
    }
}
