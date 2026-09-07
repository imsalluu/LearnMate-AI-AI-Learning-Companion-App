import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:learnmate_ai/main.dart';
import 'package:learnmate_ai/features/auth/presentation/screens/splash_screen.dart';

void main() {
  testWidgets('LearnMateApp builds and displays initial splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: LearnMateApp(),
      ),
    );

    // Initial build displays SplashScreen
    expect(find.byType(SplashScreen), findsOneWidget);
    expect(find.text('Your Intelligent Study Companion'), findsOneWidget);

    // Fast-forward animation and navigation timers
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
  });
}
