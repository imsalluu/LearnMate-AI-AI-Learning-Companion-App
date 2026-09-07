import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/local_storage.dart';
import '../domain/user_model.dart';

class AuthRepository {
  final Dio _dio = ApiClient().dio;

  Future<UserModel> login(String email, String password) async {
    try {
      final res = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (res.data['success'] == true) {
        final data = res.data['data'];
        final tokens = data['tokens'];
        await LocalStorage.saveTokens(
          accessToken: tokens['accessToken'],
          refreshToken: tokens['refreshToken'],
        );

        return UserModel.fromJson(data['user']);
      }
      throw Exception(res.data['message'] ?? 'Login failed');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message ?? 'Login failed');
    }
  }

  Future<UserModel> register(String name, String email, String password) async {
    try {
      final res = await _dio.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'role': 'STUDENT',
      });

      if (res.data['success'] == true) {
        final data = res.data['data'];
        final tokens = data['tokens'];
        await LocalStorage.saveTokens(
          accessToken: tokens['accessToken'],
          refreshToken: tokens['refreshToken'],
        );

        return UserModel.fromJson(data['user']);
      }
      throw Exception(res.data['message'] ?? 'Registration failed');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? e.message ?? 'Registration failed');
    }
  }

  Future<UserModel> getCurrentUser() async {
    try {
      final res = await _dio.get('/auth/me');
      if (res.data['success'] == true) {
        return UserModel.fromJson(res.data['data']['user']);
      }
      throw Exception('Failed to load user profile');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to load user');
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {}
    await LocalStorage.clearAuth();
  }
}
