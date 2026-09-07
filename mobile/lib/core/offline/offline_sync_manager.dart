import 'dart:convert';
import '../storage/local_storage.dart';
import '../../features/auth/domain/user_model.dart';

class OfflineSyncManager {
  static const String _cachedFlashcardsKey = 'offline_cached_flashcards';
  static const String _cachedStudyPlanKey = 'offline_cached_study_plan';
  static const String _cachedMaterialsKey = 'offline_cached_materials';

  // Cache Flashcards
  static Future<void> cacheFlashcards(List<dynamic> flashcards) async {
    await LocalStorage.saveString(_cachedFlashcardsKey, jsonEncode(flashcards));
  }

  static Future<List<dynamic>> getCachedFlashcards() async {
    final data = await LocalStorage.getString(_cachedFlashcardsKey);
    if (data != null && data.isNotEmpty) {
      return jsonDecode(data) as List<dynamic>;
    }
    return [];
  }

  // Cache Study Plan
  static Future<void> cacheStudyPlan(Map<String, dynamic> plan) async {
    await LocalStorage.saveString(_cachedStudyPlanKey, jsonEncode(plan));
  }

  static Future<Map<String, dynamic>?> getCachedStudyPlan() async {
    final data = await LocalStorage.getString(_cachedStudyPlanKey);
    if (data != null && data.isNotEmpty) {
      return jsonDecode(data) as Map<String, dynamic>;
    }
    return null;
  }

  // Cache User Session
  static Future<void> cacheUser(UserModel user) async {
    await LocalStorage.saveString('offline_cached_user', jsonEncode(user.toJson()));
  }

  static Future<UserModel?> getCachedUser() async {
    final data = await LocalStorage.getString('offline_cached_user');
    if (data != null && data.isNotEmpty) {
      return UserModel.fromJson(jsonDecode(data));
    }
    return null;
  }
}
