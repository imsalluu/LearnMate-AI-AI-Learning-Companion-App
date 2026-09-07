import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _preferredMode = 'SIMPLE';
  double _voiceSpeed = 1.0;
  bool _offlineSync = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Preferences & Settings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('AI Tutor Defaults', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Default Explanation Mode', style: TextStyle(fontSize: 14)),
                      DropdownButton<String>(
                        value: _preferredMode,
                        dropdownColor: AppColors.darkSurface,
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(value: 'SIMPLE', child: Text('Simple')),
                          DropdownMenuItem(value: 'DETAILED', child: Text('Detailed')),
                          DropdownMenuItem(value: 'EXAM_FOCUSED', child: Text('Exam-focused')),
                        ],
                        onChanged: (val) => setState(() => _preferredMode = val ?? 'SIMPLE'),
                      ),
                    ],
                  ),
                  const Divider(color: AppColors.darkBorder),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Voice Tutor Speed', style: TextStyle(fontSize: 14)),
                      Text('${_voiceSpeed.toStringAsFixed(1)}x', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryLight)),
                    ],
                  ),
                  Slider(
                    value: _voiceSpeed,
                    min: 0.8,
                    max: 1.5,
                    divisions: 7,
                    activeColor: AppColors.primary,
                    onChanged: (val) => setState(() => _voiceSpeed = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text('Offline & Storage', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Auto-cache Flashcards & Study Plan', style: TextStyle(fontSize: 14)),
                subtitle: const Text('Allow offline study sessions without internet', style: TextStyle(color: AppColors.darkTextSecondary, fontSize: 12)),
                value: _offlineSync,
                activeColor: AppColors.primary,
                onChanged: (val) => setState(() => _offlineSync = val),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
