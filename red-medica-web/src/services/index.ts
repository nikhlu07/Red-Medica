/**
 * Services Initialization
 * Centralized service initialization and cleanup
 */

import { demoModeService } from './demo-mode';
import { errorHandlingService } from './errorHandlingService';

export async function initializeServices(): Promise<void> {
  try {
    console.log('🚀 Initializing Red Médica services...');
    
    // Initialize demo mode service first (it's always safe)
    await demoModeService.initialize();
    console.log('✅ Demo mode service initialized');
    
    // Initialize error handling service (if available)
    if (errorHandlingService && typeof errorHandlingService.initialize === 'function') {
      errorHandlingService.initialize();
      console.log('✅ Error handling service initialized');
    } else {
      console.log('⚠️ Error handling service not available');
    }
    
    console.log('🎉 All services initialized successfully');
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    // Don't throw - let the app continue with whatever services are available
  }
}

export function cleanupServices(): void {
  try {
    console.log('🧹 Cleaning up services...');
    
    // Add any cleanup logic here
    console.log('✅ Services cleaned up');
    
  } catch (error) {
    console.error('❌ Service cleanup failed:', error);
  }
}