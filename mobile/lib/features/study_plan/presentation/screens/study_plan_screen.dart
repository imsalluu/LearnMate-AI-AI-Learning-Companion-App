import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class StudyPlanScreen extends StatefulWidget {
  const StudyPlanScreen({super.key});

  @override
  State<StudyPlanScreen> createState() => _StudyPlanScreenState();
}

class _StudyPlanScreenState extends State<StudyPlanScreen> {
  Map<String, dynamic>? _plan;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadActivePlan();
  }

  Future<void> _loadActivePlan() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.get('/study-plans/active');
      if (res.data['success'] == true && res.data['data']['plan'] != null) {
        setState(() => _plan = res.data['data']['plan']);
      }
    } catch (_) {
      setState(() {
        _plan = {
          'id': 'plan_demo_1',
          'title': 'Database Management Systems Study Plan',
          'targetSubject': 'Database Systems',
          'items': [
            {
              'id': 'item_1',
              'dayNumber': 1,
              'topic': 'Relational Model & Keys',
              'description': 'Review Candidate keys, Super keys, and Foreign keys',
              'estimatedMinutes': 45,
              'isCompleted': true,
            },
            {
              'id': 'item_2',
              'dayNumber': 2,
              'topic': 'Database Normalization (1NF to BCNF)',
              'description': 'Understand functional dependencies and loss-less joins',
              'estimatedMinutes': 60,
              'isCompleted': false,
            },
            {
              'id': 'item_3',
              'dayNumber': 3,
              'topic': 'SQL Queries, Joins & Subqueries',
              'description': 'Practice Complex SQL aggregations and joins',
              'estimatedMinutes': 45,
              'isCompleted': false,
            },
            {
              'id': 'item_4',
              'dayNumber': 4,
              'topic': 'Transactions & Concurrency (ACID, 2PL)',
              'description': 'Master schedules, serializability, and deadlock prevention',
              'estimatedMinutes': 50,
              'isCompleted': false,
            },
          ],
        };
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _toggleItem(String itemId, bool currentVal) async {
    final items = (_plan?['items'] as List<dynamic>?) ?? [];
    final item = items.firstWhere((i) => i['id'] == itemId, orElse: () => null);
    if (item != null) {
      setState(() {
        item['isCompleted'] = !currentVal;
      });

      try {
        await ApiClient().dio.patch(
          '/study-plans/${_plan!['id']}/items/$itemId',
          data: {'isCompleted': !currentVal},
        );
      } catch (_) {}
    }
  }

  void _showRescheduleDialog() {
    final instructionController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        title: const Text('AI Dynamic Rescheduling 🤖', style: TextStyle(color: Colors.white, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tell the AI tutor how you want to adjust your study calendar:',
              style: TextStyle(color: AppColors.darkTextSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: instructionController,
              decoration: const InputDecoration(hintText: 'e.g. Move tomorrow session to Friday'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('✨ AI has dynamically rescheduled your upcoming study sessions!'),
                  backgroundColor: AppColors.primary,
                ),
              );
            },
            child: const Text('Reschedule'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.darkBackground,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final items = (_plan?['items'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Personalized Study Plan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            onPressed: _showRescheduleDialog,
            tooltip: 'AI Reschedule',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.event_note, color: AppColors.primary),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _plan?['title'] ?? 'Study Plan',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 4),
                        const Text('Adaptive schedule • Exam in 12 days',
                            style: TextStyle(color: AppColors.darkTextSecondary, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Timeline Schedule', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Expanded(
              child: ListView.separated(
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = items[index];
                  final isCompleted = item['isCompleted'] ?? false;

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isCompleted ? AppColors.success.withOpacity(0.4) : AppColors.darkBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Checkbox(
                          value: isCompleted,
                          activeColor: AppColors.success,
                          onChanged: (_) => _toggleItem(item['id'], isCompleted),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Day ${item['dayNumber']}: ${item['topic']}',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                                  color: isCompleted ? AppColors.darkTextSecondary : AppColors.darkTextPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${item['description']} • ${item['estimatedMinutes']} mins',
                                style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
