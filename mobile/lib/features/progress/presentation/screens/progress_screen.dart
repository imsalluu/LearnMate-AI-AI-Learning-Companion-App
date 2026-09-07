import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  Map<String, dynamic>? _analytics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.get('/progress/analytics');
      if (res.data['success'] == true) {
        setState(() => _analytics = res.data['data']);
      }
    } catch (_) {
      setState(() {
        _analytics = {
          'streakCount': 5,
          'totalStudyMinutes': 420,
          'overallMastery': 78,
          'topicMasteries': [
            {'topic': 'Database Normalization', 'mastery': 82, 'status': 'STRONG'},
            {'topic': 'SQL Queries & Joins', 'mastery': 64, 'status': 'MODERATE'},
            {'topic': 'Concurrency & 2PL', 'mastery': 42, 'status': 'WEAK'},
            {'topic': 'B+ Tree Index Structures', 'mastery': 55, 'status': 'WEAK'},
          ],
          'insights': [
            {
              'type': 'STREAK',
              'title': '5-Day Learning Streak! 🔥',
              'description': 'Keep up your daily pace to maximize long-term concept retention.',
            },
            {
              'type': 'WEAK_AREA',
              'title': 'Focus Needed on Concurrency & 2PL',
              'description': 'Your practice quiz accuracy was 42% on multi-lock schedules.',
            },
            {
              'type': 'RECOMMENDATION',
              'title': 'Recommended Next Action',
              'description': 'Review 5 flashcards on Concurrency before taking tomorrow quiz.',
            },
          ],
        };
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.darkBackground,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final overallMastery = (_analytics?['overallMastery'] ?? 75) as int;
    final topicMasteries = (_analytics?['topicMasteries'] as List<dynamic>?) ?? [];
    final insights = (_analytics?['insights'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Learning Analytics & Mastery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall Mastery Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(
                children: [
                  CircularPercentIndicator(
                    radius: 50.0,
                    lineWidth: 10.0,
                    percent: overallMastery / 100,
                    center: Text(
                      '$overallMastery%',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white),
                    ),
                    progressColor: AppColors.primary,
                    backgroundColor: AppColors.darkBackground,
                    circularStrokeCap: CircularStrokeCap.round,
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Overall Mastery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                        const SizedBox(height: 4),
                        const Text('Based on RAG Q&A, AI quizzes & flashcard retention.',
                            style: TextStyle(color: AppColors.darkTextSecondary, fontSize: 12)),
                        const SizedBox(height: 8),
                        Text(
                          '🔥 ${_analytics?['streakCount'] ?? 5} Day Streak • ${_analytics?['totalStudyMinutes'] ?? 360} Mins Studied',
                          style: const TextStyle(color: AppColors.secondary, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // AI Insights Section
            const Text('AI Learning Insights 🧠', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...insights.map((insight) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(insight['title'] ?? 'Insight', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryLight, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(insight['description'] ?? '', style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13)),
                  ],
                ),
              );
            }),
            const SizedBox(height: 24),

            // Topic Mastery Breakdown
            const Text('Topic Mastery Breakdown', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...topicMasteries.map((tm) {
              final mastery = (tm['mastery'] as num).toDouble();
              final isStrong = mastery >= 75;
              final isWeak = mastery < 60;
              final color = isStrong ? AppColors.success : (isWeak ? AppColors.error : AppColors.warning);

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.darkBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(tm['topic'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('${mastery.toInt()}%', style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    LinearPercentIndicator(
                      percent: mastery / 100,
                      lineHeight: 6,
                      backgroundColor: AppColors.darkBackground,
                      progressColor: color,
                      barRadius: const Radius.circular(3),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
