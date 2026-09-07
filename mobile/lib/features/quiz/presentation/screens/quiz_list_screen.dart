import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class QuizListScreen extends StatefulWidget {
  const QuizListScreen({super.key});

  @override
  State<QuizListScreen> createState() => _QuizListScreenState();
}

class _QuizListScreenState extends State<QuizListScreen> {
  List<dynamic> _quizzes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuizzes();
  }

  Future<void> _loadQuizzes() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.get('/quizzes');
      if (res.data['success'] == true) {
        setState(() => _quizzes = res.data['data']['quizzes'] ?? []);
      }
    } catch (_) {
      setState(() {
        _quizzes = [
          {
            'id': 'quiz_demo_1',
            'title': 'DBMS Normalization Mastery Quiz',
            'topic': 'Database Normalization',
            'difficulty': 'MEDIUM',
            'timeLimitSeconds': 600,
            'questionCount': 5,
          },
          {
            'id': 'quiz_demo_2',
            'title': 'SQL Joins & Aggregations',
            'topic': 'SQL Queries',
            'difficulty': 'HARD',
            'timeLimitSeconds': 900,
            'questionCount': 8,
          },
        ];
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showGenerateQuizModal() {
    final topicController = TextEditingController();
    String difficulty = 'MEDIUM';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppColors.darkSurface,
          title: const Text('Generate AI Quiz', style: TextStyle(color: Colors.white, fontSize: 18)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Target Topic', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: topicController,
                decoration: const InputDecoration(hintText: 'e.g., Transactions & ACID'),
              ),
              const SizedBox(height: 16),
              const Text('Difficulty Level', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: difficulty,
                dropdownColor: AppColors.darkSurface,
                decoration: const InputDecoration(),
                items: const [
                  DropdownMenuItem(value: 'EASY', child: Text('Easy')),
                  DropdownMenuItem(value: 'MEDIUM', child: Text('Medium')),
                  DropdownMenuItem(value: 'HARD', child: Text('Hard')),
                ],
                onChanged: (val) => setModalState(() => difficulty = val ?? 'MEDIUM'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                setState(() => _isLoading = true);
                try {
                  final res = await ApiClient().dio.post('/quizzes/generate', data: {
                    'topic': topicController.text.isNotEmpty ? topicController.text : 'Core Concepts',
                    'difficulty': difficulty,
                    'numQuestions': 4,
                  });
                  if (res.data['success'] == true) {
                    final quizId = res.data['data']['quiz']['id'];
                    context.push('/quiz/$quizId');
                  }
                } catch (_) {
                  _loadQuizzes();
                }
              },
              child: const Text('Generate Now'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Practice Quizzes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12),
        child: Column(
          children: [
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.separated(
                      itemCount: _quizzes.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final q = _quizzes[index];
                        return Container(
                          padding: const EdgeInsets.all(18),
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
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.secondary.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      q['difficulty'] ?? 'MEDIUM',
                                      style: const TextStyle(color: AppColors.secondary, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  Text(
                                    '${(q['timeLimitSeconds'] ?? 600) ~/ 60} mins',
                                    style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(q['title'] ?? 'Mastery Quiz', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text('Topic: ${q['topic'] ?? 'General'} • ${q['questionCount'] ?? 4} Questions',
                                  style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13)),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                icon: const Icon(Icons.play_arrow_rounded),
                                label: const Text('Start Quiz'),
                                onPressed: () => context.push('/quiz/${q['id']}'),
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
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.white,
        onPressed: _showGenerateQuizModal,
        icon: const Icon(Icons.add_task),
        label: const Text('New AI Quiz'),
      ),
    );
  }
}
