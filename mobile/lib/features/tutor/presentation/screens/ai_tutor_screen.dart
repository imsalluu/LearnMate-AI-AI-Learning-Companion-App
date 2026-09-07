import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../voice/presentation/screens/voice_tutor_sheet.dart';

class ChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final String? mode;
  final List<dynamic>? citations;
  final List<String>? suggestedFollowUps;
  final DateTime timestamp;

  ChatMessage({
    required this.role,
    required this.content,
    this.mode,
    this.citations,
    this.suggestedFollowUps,
    required this.timestamp,
  });
}

class AiTutorScreen extends StatefulWidget {
  const AiTutorScreen({super.key});

  @override
  State<AiTutorScreen> createState() => _AiTutorScreenState();
}

class _AiTutorScreenState extends State<AiTutorScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String _selectedMode = 'simple';

  final List<String> _modes = [
    'simple',
    'detailed',
    'exam-focused',
    'beginner-friendly',
    'example-based',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(
      ChatMessage(
        role: 'assistant',
        content:
            'Hello! I am your **LearnMate AI Tutor**. I answer questions directly grounded in your uploaded study materials with exact citations.\n\nHow can I help you study today?',
        timestamp: DateTime.now(),
        suggestedFollowUps: [
          'What is normalization in DBMS?',
          'Explain SQL Joins with an example',
          'Create a quiz from my lecture notes',
        ],
      ),
    );
  }

  Future<void> _sendMessage([String? overrideText]) async {
    final text = overrideText ?? _textController.text.trim();
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text, timestamp: DateTime.now()));
      _isLoading = true;
    });
    _textController.clear();
    _scrollToBottom();

    try {
      final res = await ApiClient().dio.post('/conversations/messages', data: {
        'message': text,
        'mode': _selectedMode,
      });

      if (res.data['success'] == true) {
        final data = res.data['data'];
        final assistantMsg = data['assistantMessage'];
        final citations = data['citations'] as List<dynamic>?;
        final followUps = (data['suggestedFollowUps'] as List<dynamic>?)?.map((e) => e.toString()).toList();

        setState(() {
          _messages.add(
            ChatMessage(
              role: 'assistant',
              content: assistantMsg['content'],
              mode: _selectedMode,
              citations: citations,
              suggestedFollowUps: followUps,
              timestamp: DateTime.now(),
            ),
          );
        });
      }
    } catch (e) {
      setState(() {
        _messages.add(
          ChatMessage(
            role: 'assistant',
            content: '⚠️ I had trouble retrieving your study materials. Please check your connection.',
            timestamp: DateTime.now(),
          ),
        );
      });
    } finally {
      setState(() => _isLoading = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 150), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openVoiceTutor() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => VoiceTutorSheet(
        onVoiceResponseReceived: (transcript, response, citations) {
          setState(() {
            _messages.add(ChatMessage(role: 'user', content: transcript, timestamp: DateTime.now()));
            _messages.add(
              ChatMessage(
                role: 'assistant',
                content: response,
                citations: citations,
                timestamp: DateTime.now(),
              ),
            );
          });
          _scrollToBottom();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('AI Study Tutor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.mic, color: AppColors.secondary),
            onPressed: _openVoiceTutor,
            tooltip: 'Voice Tutor Mode',
          ),
        ],
      ),
      body: Column(
        children: [
          // Explanation Mode Selector Bar
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.darkBorder, width: 0.5)),
            ),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _modes.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final m = _modes[idx];
                final isSelected = _selectedMode == m;
                return ChoiceChip(
                  label: Text(
                    m.replaceAll('-', ' ').toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : AppColors.darkTextSecondary,
                    ),
                  ),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.darkSurface,
                  onSelected: (selected) {
                    if (selected) setState(() => _selectedMode = m);
                  },
                );
              },
            ),
          ),

          // Message List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.role == 'user';
                return _buildMessageBubble(msg, isUser);
              },
            ),
          ),

          if (_isLoading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              alignment: Alignment.centerLeft,
              child: Row(
                children: const [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                  ),
                  SizedBox(width: 10),
                  Text('Searching materials & generating grounded answer...', style: TextStyle(fontSize: 12, color: AppColors.darkTextSecondary)),
                ],
              ),
            ),

          // Chat Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppColors.darkSurface,
              border: Border(top: BorderSide(color: AppColors.darkBorder)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.mic_none_rounded, color: AppColors.secondary),
                    onPressed: _openVoiceTutor,
                  ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      decoration: InputDecoration(
                        hintText: 'Ask your study notes...',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        filled: true,
                        fillColor: AppColors.darkBackground,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                      onPressed: () => _sendMessage(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : AppColors.darkSurface,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(16),
            bottomLeft: !isUser ? const Radius.circular(0) : const Radius.circular(16),
          ),
          border: isUser ? null : Border.all(color: AppColors.darkBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MarkdownBody(
              data: msg.content,
              styleSheet: MarkdownStyleSheet(
                p: TextStyle(color: isUser ? Colors.white : AppColors.darkTextPrimary, fontSize: 14, height: 1.4),
                h3: TextStyle(color: isUser ? Colors.white : AppColors.primaryLight, fontSize: 16, fontWeight: FontWeight.bold),
                strong: const TextStyle(fontWeight: FontWeight.bold),
                code: TextStyle(
                  backgroundColor: isUser ? Colors.black26 : AppColors.darkBackground,
                  color: AppColors.secondary,
                  fontFamily: 'monospace',
                ),
              ),
            ),

            // Source Citations Section
            if (msg.citations != null && msg.citations!.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(color: AppColors.darkBorder, height: 1),
              const SizedBox(height: 8),
              const Text('📚 Source Citations:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primaryLight)),
              const SizedBox(height: 6),
              ...msg.citations!.map((c) => Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.darkBackground.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.darkBorder.withOpacity(0.5)),
                    ),
                    child: Text(
                      '📄 ${c['materialTitle'] ?? c['source']} • Page ${c['pageNumber'] ?? 1} (${((c['score'] ?? 0.8) * 100).toInt()}% Match)',
                      style: const TextStyle(fontSize: 11, color: AppColors.darkTextSecondary),
                    ),
                  )),
            ],

            // Suggested Follow-up Questions
            if (msg.suggestedFollowUps != null && msg.suggestedFollowUps!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: msg.suggestedFollowUps!.map((q) {
                  return ActionChip(
                    backgroundColor: AppColors.darkBackground,
                    label: Text(q, style: const TextStyle(fontSize: 11, color: AppColors.secondary)),
                    onPressed: () => _sendMessage(q),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
