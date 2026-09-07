import 'dart:math';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class FlashcardsScreen extends StatefulWidget {
  const FlashcardsScreen({super.key});

  @override
  State<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends State<FlashcardsScreen> with SingleTickerProviderStateMixin {
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;

  List<dynamic> _cards = [];
  int _currentIndex = 0;
  bool _isFront = true;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOut),
    );

    _loadFlashcards();
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  Future<void> _loadFlashcards() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.get('/flashcards');
      if (res.data['success'] == true) {
        setState(() => _cards = res.data['data']['flashcards'] ?? []);
      }
    } catch (_) {
      setState(() {
        _cards = [
          {
            'id': 'fc_1',
            'topic': 'Database Normalization',
            'front': 'What is the key criterion for a relation to be in 1NF?',
            'back': 'Each column must contain atomic (indivisible) values, and there must be no repeating groups or arrays.',
            'isFavorite': false,
            'easeFactor': 2.5,
          },
          {
            'id': 'fc_2',
            'topic': 'Database Normalization',
            'front': 'What is Second Normal Form (2NF)?',
            'back': 'The table is in 1NF AND all non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies).',
            'isFavorite': true,
            'easeFactor': 2.5,
          },
          {
            'id': 'fc_3',
            'topic': 'Database Normalization',
            'front': 'What defines Third Normal Form (3NF)?',
            'back': 'The table is in 2NF AND there are no transitive functional dependencies between non-prime attributes.',
            'isFavorite': false,
            'easeFactor': 2.5,
          },
        ];
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _flipCard() {
    if (_isFront) {
      _flipController.forward();
    } else {
      _flipController.reverse();
    }
    setState(() => _isFront = !_isFront);
  }

  void _nextCard(int quality) async {
    if (_cards.isEmpty) return;
    final currentCard = _cards[_currentIndex];

    try {
      await ApiClient().dio.post(
        '/flashcards/${currentCard['id']}/review',
        data: {'quality': quality, 'isKnown': quality >= 3},
      );
    } catch (_) {}

    if (_currentIndex < _cards.length - 1) {
      if (!_isFront) {
        _flipController.reverse();
        _isFront = true;
      }
      setState(() => _currentIndex++);
    } else {
      // Reached end of deck
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 Awesome! You completed all cards in this review session.'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  void _showGenerateModal() {
    final topicController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        title: const Text('Generate Flashcard Deck', style: TextStyle(color: Colors.white, fontSize: 18)),
        content: TextField(
          controller: topicController,
          decoration: const InputDecoration(hintText: 'e.g. SQL Transactions & Isolation'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              setState(() => _isLoading = true);
              try {
                final res = await ApiClient().dio.post('/flashcards/generate', data: {
                  'topic': topicController.text.isNotEmpty ? topicController.text : 'Database Indexing',
                  'numCards': 5,
                });
                if (res.data['success'] == true) {
                  _loadFlashcards();
                }
              } catch (_) {
                _loadFlashcards();
              }
            },
            child: const Text('Generate AI Deck'),
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

    if (_cards.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.darkBackground,
        appBar: AppBar(title: const Text('Spaced Flashcards')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.style_outlined, size: 60, color: AppColors.darkTextSecondary),
              const SizedBox(height: 16),
              const Text('No flashcards available', style: TextStyle(color: AppColors.darkTextSecondary)),
              const SizedBox(height: 20),
              ElevatedButton(onPressed: _showGenerateModal, child: const Text('Generate Deck with AI')),
            ],
          ),
        ),
      );
    }

    final card = _cards[_currentIndex];

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Spaced Repetition (SM-2)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: _showGenerateModal,
            tooltip: 'Generate Deck',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
        child: Column(
          children: [
            // Deck Progress
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Card ${_currentIndex + 1} of ${_cards.length}',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary, fontSize: 14),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    card['topic'] ?? 'General',
                    style: const TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // 3D Flippable Flashcard
            Expanded(
              child: GestureDetector(
                onTap: _flipCard,
                child: AnimatedBuilder(
                  animation: _flipAnimation,
                  builder: (context, child) {
                    final angle = _flipAnimation.value * pi;
                    final isUnder = angle > pi / 2;

                    return Transform(
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001)
                        ..rotateY(angle),
                      alignment: Alignment.center,
                      child: isUnder
                          ? Transform(
                              transform: Matrix4.identity()..rotateY(pi),
                              alignment: Alignment.center,
                              child: _buildCardSide(
                                title: 'Back / Answer',
                                content: card['back'] ?? '',
                                color: AppColors.secondary,
                                isFront: false,
                              ),
                            )
                          : _buildCardSide(
                              title: 'Front / Question',
                              content: card['front'] ?? '',
                              color: AppColors.primary,
                              isFront: true,
                            ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Tap card to flip 🔄', style: TextStyle(color: AppColors.darkTextSecondary, fontSize: 13)),
            const SizedBox(height: 24),

            // SM-2 Review Rating Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () => _nextCard(1), // Hard / Again
                    child: const Text('Hard (Again)', style: TextStyle(fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () => _nextCard(3), // Good
                    child: const Text('Good (3d)', style: TextStyle(fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () => _nextCard(5), // Easy
                    child: const Text('Easy (6d)', style: TextStyle(fontSize: 13)),
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

  Widget _buildCardSide({
    required String title,
    required String content,
    required Color color,
    required bool isFront,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withOpacity(0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.12),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              title,
              style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            content,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              height: 1.5,
              color: AppColors.darkTextPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
