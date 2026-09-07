import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class MaterialDetailScreen extends StatefulWidget {
  final String materialId;

  const MaterialDetailScreen({super.key, required this.materialId});

  @override
  State<MaterialDetailScreen> createState() => _MaterialDetailScreenState();
}

class _MaterialDetailScreenState extends State<MaterialDetailScreen> {
  Map<String, dynamic>? _material;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    try {
      final res = await ApiClient().dio.get('/materials/${widget.materialId}');
      if (res.data['success'] == true) {
        setState(() => _material = res.data['data']['material']);
      }
    } catch (_) {
      setState(() {
        _material = {
          'id': widget.materialId,
          'title': 'DBMS Normalization & Relational Theory',
          'fileName': 'DBMS_Lecture_Ch3.pdf',
          'pageCount': 14,
          'chunkCount': 28,
          'chunks': [
            {
              'chunkIndex': 0,
              'pageNumber': 1,
              'sectionTitle': '1.1 Relational Schema',
              'content': 'A relational schema consists of a set of attributes and a set of functional dependencies.',
            },
            {
              'chunkIndex': 1,
              'pageNumber': 2,
              'sectionTitle': '1.2 First Normal Form (1NF)',
              'content': '1NF requires all attributes to have atomic domains without repeating groups.',
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
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: Text(_material?['title'] ?? 'Document Details', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.darkBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.picture_as_pdf_outlined, color: AppColors.accent, size: 36),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_material?['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text('${_material?['pageCount'] ?? 1} Pages • ${_material?['chunkCount'] ?? 0} Indexed RAG Chunks',
                                  style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('Indexed RAG Semantic Chunks', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: (_material?['chunks'] as List<dynamic>?)?.length ?? 0,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, idx) {
                        final chunk = _material!['chunks'][idx];
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.darkSurface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.darkBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    chunk['sectionTitle'] ?? 'Chunk #${chunk['chunkIndex']}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryLight, fontSize: 13),
                                  ),
                                  Text('Page ${chunk['pageNumber']}', style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 11)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(chunk['content'], style: const TextStyle(fontSize: 13, height: 1.4)),
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
