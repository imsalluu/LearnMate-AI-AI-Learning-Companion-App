import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class MaterialsScreen extends StatefulWidget {
  const MaterialsScreen({super.key});

  @override
  State<MaterialsScreen> createState() => _MaterialsScreenState();
}

class _MaterialsScreenState extends State<MaterialsScreen> {
  List<dynamic> _materials = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadMaterials();
  }

  Future<void> _loadMaterials() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.get('/materials', queryParameters: {
        'search': _searchQuery.isNotEmpty ? _searchQuery : null,
      });

      if (res.data['success'] == true) {
        setState(() {
          _materials = res.data['data']['items'] ?? [];
        });
      }
    } catch (_) {
      // Demo fallback materials
      setState(() {
        _materials = [
          {
            'id': 'mat_demo_1',
            'title': 'DBMS Normalization & Relational Theory',
            'fileName': 'DBMS_Lecture_Ch3.pdf',
            'fileType': 'application/pdf',
            'status': 'READY',
            'pageCount': 14,
            'chunkCount': 28,
            'createdAt': DateTime.now().toIso8601String(),
          },
          {
            'id': 'mat_demo_2',
            'title': 'SQL Query Optimization Notes',
            'fileName': 'SQL_Optimization.docx',
            'fileType': 'application/docx',
            'status': 'READY',
            'pageCount': 8,
            'chunkCount': 16,
            'createdAt': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
          },
        ];
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _simulateUpload() async {
    // Show upload dialog
    final titleController = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        title: const Text('Upload Study Material', style: TextStyle(color: Colors.white, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(
                hintText: 'Document Title (e.g. Operating Systems Ch 4)',
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Supports PDF, DOCX, TXT, and Markdown files.',
              style: TextStyle(color: AppColors.darkTextSecondary, fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              setState(() {
                _materials.insert(0, {
                  'id': 'mat_${DateTime.now().millisecondsSinceEpoch}',
                  'title': titleController.text.isNotEmpty ? titleController.text : 'New Study Material',
                  'fileName': 'StudyNotes_${DateTime.now().millisecond}.pdf',
                  'fileType': 'application/pdf',
                  'status': 'READY',
                  'pageCount': 6,
                  'chunkCount': 12,
                  'createdAt': DateTime.now().toIso8601String(),
                });
              });
            },
            child: const Text('Upload & Ingest'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Learning Materials', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMaterials,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12),
        child: Column(
          children: [
            // Search field
            TextField(
              onChanged: (val) {
                _searchQuery = val;
                _loadMaterials();
              },
              decoration: InputDecoration(
                hintText: 'Search documents & lecture notes...',
                prefixIcon: const Icon(Icons.search, color: AppColors.darkTextSecondary),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                filled: true,
                fillColor: AppColors.darkSurface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _materials.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.folder_off_outlined, size: 60, color: AppColors.darkTextSecondary.withOpacity(0.5)),
                              const SizedBox(height: 16),
                              const Text('No materials uploaded yet', style: TextStyle(color: AppColors.darkTextSecondary)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          itemCount: _materials.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final mat = _materials[index];
                            final status = mat['status'] ?? 'READY';
                            final isReady = status == 'READY';

                            return GestureDetector(
                              onTap: () => context.push('/material/${mat['id']}'),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.darkSurface,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.darkBorder),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(Icons.description_outlined, color: AppColors.primary),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            mat['title'] ?? mat['fileName'],
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${mat['pageCount'] ?? 1} Pages • ${mat['chunkCount'] ?? 0} RAG Chunks',
                                            style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                    // Status Badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isReady
                                            ? AppColors.success.withOpacity(0.15)
                                            : AppColors.warning.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: isReady ? AppColors.success : AppColors.warning,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11,
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
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _simulateUpload,
        icon: const Icon(Icons.upload_file),
        label: const Text('Upload Document'),
      ),
    );
  }
}
