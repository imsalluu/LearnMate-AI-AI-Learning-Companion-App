import 'package:flutter/material.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class QuizScreen extends StatefulWidget {
  final String quizId;

  const QuizScreen({super.key, required this.quizId});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  Map<String, dynamic>? _quiz;
  bool _isLoading = true;
  int _currentQuestionIndex = 0;
  final Map<String, String> _selectedAnswers = {};
  Map<String, dynamic>? _attemptResult;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    try {
      final res = await ApiClient().dio.get('/quizzes/${widget.quizId}');
      if (res.data['success'] == true) {
        setState(() => _quiz = res.data['data']['quiz']);
      }
    } catch (_) {
      setState(() {
        _quiz = {
          'id': widget.quizId,
          'title': 'Database Normalization Quiz',
          'topic': 'Database Normalization',
          'questions': [
            {
              'id': 'q_1',
              'question': 'Which normal form eliminates transitive functional dependencies?',
              'options': ['1NF', '2NF', '3NF', 'BCNF'],
            },
            {
              'id': 'q_2',
              'question': 'True or False: A table in 2NF must already satisfy 1NF rules.',
              'options': ['True', 'False'],
            },
            {
              'id': 'q_3',
              'question': 'What is the primary goal of database normalization?',
              'options': [
                'Minimize data redundancy and prevent anomalies',
                'Increase table duplication',
                'Disable foreign key constraints',
                'Speed up offline batch renders only',
              ],
            },
          ],
        };
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitQuiz() async {
    final questions = (_quiz?['questions'] as List<dynamic>?) ?? [];
    final answersPayload = questions.map((q) {
      return {
        'questionId': q['id'],
        'userAnswer': _selectedAnswers[q['id']] ?? '',
      };
    }).toList();

    setState(() => _isLoading = true);

    try {
      final res = await ApiClient().dio.post(
        '/quizzes/${widget.quizId}/submit',
        data: {
          'timeSpentSeconds': 180,
          'answers': answersPayload,
        },
      );

      if (res.data['success'] == true) {
        setState(() {
          _attemptResult = res.data['data']['attempt'];
        });
      }
    } catch (_) {
      // Demo grading calculation fallback
      int correct = 0;
      for (final a in answersPayload) {
        if (a['userAnswer']!.isNotEmpty) correct++;
      }
      final total = questions.isEmpty ? 1 : questions.length;
      final score = ((correct / total) * 100).roundToDouble();

      setState(() {
        _attemptResult = {
          'score': score,
          'correctCount': correct,
          'totalQuestions': questions.length,
          'recommendation': score >= 70
              ? '🎉 Outstanding work! Your topic comprehension is high.'
              : '📖 Good effort! Review the questions you missed to reinforce your memory.',
          'weakTopics': score < 70 ? ['Database Normalization'] : [],
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

    if (_attemptResult != null) {
      return _buildResultView();
    }

    final questions = (_quiz?['questions'] as List<dynamic>?) ?? [];
    if (questions.isEmpty) {
      return const Scaffold(
        backgroundColor: AppColors.darkBackground,
        body: Center(child: Text('No questions found')),
      );
    }

    final currentQ = questions[_currentQuestionIndex];
    final progress = (_currentQuestionIndex + 1) / questions.length;
    final options = (currentQ['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];
    final selectedOption = _selectedAnswers[currentQ['id']];

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: Text(_quiz?['title'] ?? 'Quiz', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress bar
            LinearPercentIndicator(
              percent: progress,
              lineHeight: 8,
              backgroundColor: AppColors.darkSurface,
              progressColor: AppColors.primary,
              barRadius: const Radius.circular(4),
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: 12),
            Text(
              'Question ${_currentQuestionIndex + 1} of ${questions.length}',
              style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),

            // Question Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Text(
                currentQ['question'] ?? '',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, height: 1.4),
              ),
            ),
            const SizedBox(height: 24),

            // Options List
            Expanded(
              child: ListView.separated(
                itemCount: options.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, idx) {
                  final opt = options[idx];
                  final isSelected = selectedOption == opt;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedAnswers[currentQ['id']] = opt;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary.withOpacity(0.15) : AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.darkBorder,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSelected ? AppColors.primary : Colors.transparent,
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.darkTextSecondary,
                              ),
                            ),
                            child: isSelected
                                ? const Icon(Icons.check, size: 18, color: Colors.white)
                                : null,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              opt,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? Colors.white : AppColors.darkTextPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Action Button (Next or Submit)
            Row(
              children: [
                if (_currentQuestionIndex > 0) ...[
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.darkBorder),
                        minimumSize: const Size(0, 50),
                      ),
                      onPressed: () => setState(() => _currentQuestionIndex--),
                      child: const Text('Previous'),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_currentQuestionIndex < questions.length - 1) {
                        setState(() => _currentQuestionIndex++);
                      } else {
                        _submitQuiz();
                      }
                    },
                    child: Text(_currentQuestionIndex == questions.length - 1 ? 'Submit Answers' : 'Next Question'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildResultView() {
    final score = _attemptResult!['score'] ?? 0;
    final isPassed = score >= 60;

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(title: const Text('Quiz Results', style: TextStyle(fontWeight: FontWeight.bold))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                children: [
                  Text(isPassed ? '🎉' : '📚', style: const TextStyle(fontSize: 48)),
                  const SizedBox(height: 12),
                  Text(
                    '$score%',
                    style: TextStyle(
                      fontSize: 44,
                      fontWeight: FontWeight.bold,
                      color: isPassed ? AppColors.success : AppColors.warning,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You scored ${_attemptResult!['correctCount']} out of ${_attemptResult!['totalQuestions']} correct',
                    style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 14),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _attemptResult!['recommendation'] ?? '',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Back to Quizzes'),
            ),
          ],
        ),
      ),
    );
  }
}
