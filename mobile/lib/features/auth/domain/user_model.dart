class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? avatarUrl;
  final int streakCount;
  final int dailyGoalMinutes;
  final String preferredExplanationMode;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.avatarUrl,
    this.streakCount = 0,
    this.dailyGoalMinutes = 30,
    this.preferredExplanationMode = 'SIMPLE',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final pref = json['preference'] as Map<String, dynamic>?;
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'STUDENT',
      avatarUrl: json['avatarUrl'],
      streakCount: json['streakCount'] ?? 0,
      dailyGoalMinutes: pref?['dailyGoalMinutes'] ?? 30,
      preferredExplanationMode: pref?['preferredExplanationMode'] ?? 'SIMPLE',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'avatarUrl': avatarUrl,
      'streakCount': streakCount,
      'preference': {
        'dailyGoalMinutes': dailyGoalMinutes,
        'preferredExplanationMode': preferredExplanationMode,
      },
    };
  }
}
