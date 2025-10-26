import cron from 'node-cron';
import { dailyFileCleanupService, weeklyCleanupService, monthlyCleanupService } from './cleanupService.js';
import { cleanupExpiredTokensService } from '../models/tokenBlacklistModel.js';
import { checkOverdueReservationsService } from '../models/reservationModel.js';

// Check overdue reservations - Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    await checkOverdueReservationsService();
  } catch (error) {
    // Overdue check failed - silent fail
  }
});

// Daily cleanup - Every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
  try {
    const result = await dailyFileCleanupService();
  } catch (error) {
    // Daily cleanup failed
  }
});

// Weekly cleanup - Every Sunday at 2:00 AM
cron.schedule('0 2 * * 0', async () => {
  try {
    const result = await weeklyCleanupService();
  } catch (error) {
    // Weekly cleanup failed
  }
});

// Token blacklist cleanup - Every Sunday at 2:30 AM (after weekly cleanup)
cron.schedule('30 2 * * 0', async () => {
  try {
    const deletedCount = await cleanupExpiredTokensService();
  } catch (error) {
    // Token cleanup failed
  }
});

// Monthly cleanup - Every 1st day of month at 3:00 AM
cron.schedule('0 3 1 * *', async () => {
  try {
    const result = await monthlyCleanupService();
  } catch (error) {
    // Monthly cleanup failed
  }
});

