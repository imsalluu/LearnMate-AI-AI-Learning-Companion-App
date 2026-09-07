import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/router/app_router.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: AppBar(
        title: const Text('Student Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primary.withOpacity(0.25),
                    child: const Icon(Icons.person, size: 36, color: AppColors.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.name ?? 'Alex Johnson', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(user?.email ?? 'alex@student.edu', style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            user?.role ?? 'STUDENT',
                            style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Settings Tile
            ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              tileColor: AppColors.darkSurface,
              leading: const Icon(Icons.tune, color: AppColors.secondary),
              title: const Text('AI Tutor & Learning Preferences', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.darkTextSecondary),
              onTap: () => context.push(AppRoutes.settings),
            ),
            const SizedBox(height: 12),

            ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              tileColor: AppColors.darkSurface,
              leading: const Icon(Icons.offline_pin_outlined, color: AppColors.accent),
              title: const Text('Offline Synced Content', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.darkTextSecondary),
              onTap: () {},
            ),
            const Spacer(),

            // Logout Button
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error.withOpacity(0.15),
                foregroundColor: AppColors.error,
                side: BorderSide(color: AppColors.error.withOpacity(0.3)),
              ),
              icon: const Icon(Icons.logout),
              label: const Text('Sign Out'),
              onPressed: () async {
                await ref.read(authControllerProvider.notifier).logout();
                if (context.mounted) {
                  context.go(AppRoutes.login);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
