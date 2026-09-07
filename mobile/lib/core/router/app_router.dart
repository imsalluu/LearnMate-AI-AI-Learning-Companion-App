import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Screens
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/dashboard/presentation/screens/home_screen.dart';
import '../../features/tutor/presentation/screens/ai_tutor_screen.dart';
import '../../features/materials/presentation/screens/materials_screen.dart';
import '../../features/materials/presentation/screens/material_detail_screen.dart';
import '../../features/quiz/presentation/screens/quiz_list_screen.dart';
import '../../features/quiz/presentation/screens/quiz_screen.dart';
import '../../features/flashcards/presentation/screens/flashcards_screen.dart';
import '../../features/study_plan/presentation/screens/study_plan_screen.dart';
import '../../features/progress/presentation/screens/progress_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/settings_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String aiTutor = '/ai-tutor';
  static const String materials = '/materials';
  static const String materialDetail = '/material/:id';
  static const String quiz = '/quiz';
  static const String quizDetail = '/quiz/:id';
  static const String flashcards = '/flashcards';
  static const String studyPlan = '/study-plan';
  static const String progress = '/progress';
  static const String profile = '/profile';
  static const String settings = '/settings';
}

final GoRouter appRouter = GoRouter(
  initialLocation: AppRoutes.splash,
  routes: [
    GoRoute(
      path: AppRoutes.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: AppRoutes.onboarding,
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: AppRoutes.register,
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: AppRoutes.home,
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: AppRoutes.aiTutor,
      builder: (context, state) => const AiTutorScreen(),
    ),
    GoRoute(
      path: AppRoutes.materials,
      builder: (context, state) => const MaterialsScreen(),
    ),
    GoRoute(
      path: AppRoutes.materialDetail,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return MaterialDetailScreen(materialId: id);
      },
    ),
    GoRoute(
      path: AppRoutes.quiz,
      builder: (context, state) => const QuizListScreen(),
    ),
    GoRoute(
      path: AppRoutes.quizDetail,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return QuizScreen(quizId: id);
      },
    ),
    GoRoute(
      path: AppRoutes.flashcards,
      builder: (context, state) => const FlashcardsScreen(),
    ),
    GoRoute(
      path: AppRoutes.studyPlan,
      builder: (context, state) => const StudyPlanScreen(),
    ),
    GoRoute(
      path: AppRoutes.progress,
      builder: (context, state) => const ProgressScreen(),
    ),
    GoRoute(
      path: AppRoutes.profile,
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: AppRoutes.settings,
      builder: (context, state) => const SettingsScreen(),
    ),
  ],
);
