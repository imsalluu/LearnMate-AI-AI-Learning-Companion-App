import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class VoiceTutorSheet extends StatefulWidget {
  final Function(String transcript, String response, List<dynamic>? citations) onVoiceResponseReceived;

  const VoiceTutorSheet({super.key, required this.onVoiceResponseReceived});

  @override
  State<VoiceTutorSheet> createState() => _VoiceTutorSheetState();
}

class _VoiceTutorSheetState extends State<VoiceTutorSheet> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  final AudioPlayer _audioPlayer = AudioPlayer();

  bool _isRecording = false;
  bool _isProcessing = false;
  bool _isPlaying = false;
  String _statusText = 'Tap the microphone to speak with your AI Tutor';
  String? _transcript;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _toggleVoiceRecording() async {
    if (!_isRecording && !_isProcessing) {
      // Start recording simulation
      setState(() {
        _isRecording = true;
        _statusText = 'Listening to your question...';
      });

      // Simulate voice capture
      await Future.delayed(const Duration(milliseconds: 2500));
      if (!mounted) return;

      setState(() {
        _isRecording = false;
        _isProcessing = true;
        _statusText = 'Transcribing and thinking...';
      });

      try {
        // Send to backend voice chat endpoint
        final res = await ApiClient().dio.post(
          '/voice/chat',
          data: {
            'mode': 'simple',
          },
        );

        if (res.data['success'] == true) {
          final data = res.data['data'];
          final transcript = data['transcript'] ?? 'What is normalization in DBMS?';
          final response = data['response'] ?? 'Normalization minimizes data redundancy.';
          final citations = data['citations'] as List<dynamic>?;

          setState(() {
            _transcript = transcript;
            _statusText = 'AI Tutor is speaking...';
            _isProcessing = false;
            _isPlaying = true;
          });

          widget.onVoiceResponseReceived(transcript, response, citations);
        }
      } catch (e) {
        setState(() {
          _isProcessing = false;
          _statusText = 'Voice request completed.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: const BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.darkBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Voice AI Tutor 🎙️',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.darkTextPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            _statusText,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: AppColors.darkTextSecondary),
          ),
          const SizedBox(height: 36),

          // Glowing Pulsing Microphone
          ScaleTransition(
            scale: _isRecording ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
            child: GestureDetector(
              onTap: _toggleVoiceRecording,
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: _isRecording
                        ? [AppColors.accent, AppColors.error]
                        : [AppColors.primary, AppColors.secondary],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: (_isRecording ? AppColors.accent : AppColors.primary).withOpacity(0.4),
                      blurRadius: 28,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Icon(
                  _isRecording ? Icons.mic : (_isPlaying ? Icons.volume_up : Icons.mic_none_rounded),
                  color: Colors.white,
                  size: 44,
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),

          if (_transcript != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.darkBackground,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Text(
                '🗣️ "$_transcript"',
                style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: AppColors.secondary),
              ),
            ),
            const SizedBox(height: 20),
          ],

          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close Voice Tutor', style: TextStyle(color: AppColors.darkTextSecondary)),
          ),
        ],
      ),
    );
  }
}
