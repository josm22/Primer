import AVFoundation
import Foundation

enum SoundPlayer {
    private static var engine: AVAudioEngine?
    private static var player: AVAudioPlayerNode?

    static func prepare() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)
    }

    static func playChime() {
        prepare()

        let engine = AVAudioEngine()
        let player = AVAudioPlayerNode()
        engine.attach(player)

        let sampleRate: Double = 44_100
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        engine.connect(player, to: engine.mainMixerNode, format: format)

        let tones: [(freq: Double, start: Double, duration: Double, gain: Float)] = [
            (784, 0.0, 0.22, 0.18),
            (1046.5, 0.16, 0.34, 0.15),
        ]

        let totalDuration = 0.55
        let frameCount = AVAudioFrameCount(sampleRate * totalDuration)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount
        guard let channel = buffer.floatChannelData?[0] else { return }

        for i in 0..<Int(frameCount) {
            let t = Double(i) / sampleRate
            var sample: Float = 0
            for tone in tones {
                let local = t - tone.start
                if local >= 0 && local <= tone.duration {
                    let env = Float(sin(min(1, local / 0.02) * .pi / 2)) *
                        Float(exp(-local * 4.5))
                    sample += tone.gain * env * Float(sin(2 * .pi * tone.freq * local))
                }
            }
            channel[i] = max(-1, min(1, sample))
        }

        do {
            try engine.start()
            player.scheduleBuffer(buffer, at: nil, options: []) {
                engine.stop()
            }
            player.play()
            self.engine = engine
            self.player = player
        } catch {
            // Silencio si el audio no está disponible.
        }
    }
}
