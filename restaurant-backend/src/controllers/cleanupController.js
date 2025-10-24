import {
  dailyFileCleanupService,
  weeklyCleanupService,
  monthlyCleanupService,
  manualCleanupService
} from '../utils/cleanupService.js';

// Daily file cleanup (Admin only)
export const dailyFileCleanup = async (req, res) => {
  try {
    const result = await dailyFileCleanupService();
    
    res.json({
      success: true,
      message: 'Daily file cleanup completed successfully',
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during daily file cleanup',
      error: error.message
    });
  }
};

// Weekly cleanup (Admin only)
export const weeklyCleanup = async (req, res) => {
  try {
    
    const result = await weeklyCleanupService();
    
    res.json({
      success: true,
      message: 'Weekly cleanup completed successfully',
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during weekly cleanup'
    });
  }
};

// Monthly cleanup (Admin only)
export const monthlyCleanup = async (req, res) => {
  try {
    
    const result = await monthlyCleanupService();
    
    res.json({
      success: true,
      message: 'Monthly cleanup completed successfully',
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during monthly cleanup'
    });
  }
};

// Manual cleanup with custom days (Admin only)
export const manualCleanup = async (req, res) => {
  try {
    const { days } = req.body;
    
    if (!days || isNaN(days) || days < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of days is required (minimum 1)'
      });
    }
    
    
    const result = await manualCleanupService(parseInt(days));
    
    res.json({
      success: true,
      message: `Manual cleanup completed successfully for ${days} days`,
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during manual cleanup',
      error: error.message
    });
  }
};
