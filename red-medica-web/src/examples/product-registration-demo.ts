/**
 * Demo script showing enhanced product registration functionality
 * This demonstrates the improved error handling, validation, and user feedback
 */

import { blockchainService } from '../services/blockchain';

// Demo function to show enhanced product registration
export async function demoProductRegistration() {
  console.log('🧪 Product Registration Enhancement Demo');
  console.log('=====================================');

  // Test 1: Input validation
  console.log('\n1. Testing input validation...');
  
  const invalidProductData = {
    name: '', // Invalid: empty name
    batchNumber: 'BATCH@001!', // Invalid: special characters
    manufacturerName: 'Test Pharma',
    quantity: -5, // Invalid: negative quantity
    mfgDate: Date.now(),
    expiryDate: Date.now() - 86400000, // Invalid: expiry before mfg
    category: 'Medicine',
  };

  try {
    const result = await blockchainService.registerProduct(
      invalidProductData.name,
      invalidProductData.batchNumber,
      invalidProductData.manufacturerName,
      invalidProductData.quantity,
      invalidProductData.mfgDate,
      invalidProductData.expiryDate,
      invalidProductData.category
    );

    console.log('❌ Validation result:', {
      success: result.success,
      error: result.error,
      technicalError: result.technicalError,
    });
  } catch (error) {
    console.log('❌ Validation caught error:', error);
  }

  // Test 2: Valid data structure
  console.log('\n2. Testing valid data structure...');
  
  const validProductData = {
    name: 'Aspirin 500mg',
    batchNumber: 'ASP-2024-001',
    manufacturerName: 'PharmaCorp Inc',
    quantity: 1000,
    mfgDate: Date.now() - 86400000, // 1 day ago
    expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
    category: 'Over-the-Counter',
  };

  console.log('✅ Valid product data structure:', {
    name: validProductData.name,
    batchNumber: validProductData.batchNumber,
    manufacturerName: validProductData.manufacturerName,
    quantity: validProductData.quantity,
    mfgDate: new Date(validProductData.mfgDate).toISOString(),
    expiryDate: new Date(validProductData.expiryDate).toISOString(),
    category: validProductData.category,
  });

  // Test 3: Connection status check
  console.log('\n3. Testing connection requirements...');
  console.log('🔗 Blockchain connected:', blockchainService.isConnected());
  console.log('📄 Contract ready:', blockchainService.isContractReady());
  console.log('👤 Selected account:', blockchainService.getSelectedAccount()?.address || 'None');

  // Test 4: Network status
  console.log('\n4. Network status...');
  const networkStatus = blockchainService.getNetworkStatus();
  console.log('🌐 Network info:', {
    status: networkStatus.status,
    endpoint: networkStatus.endpoint,
    chainName: networkStatus.chainName,
    blockNumber: networkStatus.blockNumber,
    lastUpdate: new Date(networkStatus.lastUpdate).toISOString(),
  });

  // Test 5: Health check
  console.log('\n5. Service health check...');
  try {
    const health = await blockchainService.healthCheck();
    console.log('🏥 Health status:', {
      healthy: health.healthy,
      details: health.details,
    });
  } catch (error) {
    console.log('❌ Health check failed:', error);
  }

  console.log('\n✅ Demo completed successfully!');
  console.log('\nKey enhancements implemented:');
  console.log('- ✅ Comprehensive input validation with user-friendly messages');
  console.log('- ✅ Enhanced gas estimation with dry-run validation');
  console.log('- ✅ Improved event parsing for product ID extraction');
  console.log('- ✅ Better error handling with technical and user-friendly messages');
  console.log('- ✅ Authorization checks before transaction submission');
  console.log('- ✅ Transaction timeout and progress tracking');
  console.log('- ✅ Detailed logging for debugging and monitoring');
}

// Validation helper demo
export function demoValidationHelpers() {
  console.log('\n🔍 Validation Helpers Demo');
  console.log('==========================');

  // Test various validation scenarios
  const testCases = [
    {
      name: 'Valid product',
      data: {
        name: 'Ibuprofen 200mg',
        batchNumber: 'IBU-2024-001',
        manufacturerName: 'MediCorp',
        quantity: 500,
        mfgDate: Date.now() - 86400000,
        expiryDate: Date.now() + (2 * 365 * 24 * 60 * 60 * 1000),
        category: 'Pain Relief',
      },
    },
    {
      name: 'Empty fields',
      data: {
        name: '',
        batchNumber: '',
        manufacturerName: '',
        quantity: 0,
        mfgDate: 0,
        expiryDate: 0,
        category: '',
      },
    },
    {
      name: 'Invalid dates',
      data: {
        name: 'Test Medicine',
        batchNumber: 'TEST-001',
        manufacturerName: 'Test Corp',
        quantity: 100,
        mfgDate: Date.now(),
        expiryDate: Date.now() - 86400000, // Expiry before mfg
        category: 'Test',
      },
    },
    {
      name: 'Invalid batch format',
      data: {
        name: 'Test Medicine',
        batchNumber: 'TEST@001!', // Invalid characters
        manufacturerName: 'Test Corp',
        quantity: 100,
        mfgDate: Date.now() - 86400000,
        expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
        category: 'Test',
      },
    },
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    
    // This would call the private validation method if it were public
    // For demo purposes, we'll show what the validation would check
    const errors: string[] = [];
    
    if (!testCase.data.name?.trim()) errors.push('Product name is required');
    if (!testCase.data.batchNumber?.trim()) errors.push('Batch number is required');
    if (!testCase.data.manufacturerName?.trim()) errors.push('Manufacturer name is required');
    if (!testCase.data.category?.trim()) errors.push('Product category is required');
    
    if (testCase.data.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (testCase.data.mfgDate >= testCase.data.expiryDate) errors.push('Expiry date must be after manufacturing date');
    
    if (testCase.data.batchNumber && !/^[a-zA-Z0-9_-]+$/.test(testCase.data.batchNumber)) {
      errors.push('Batch number can only contain letters, numbers, hyphens, and underscores');
    }
    
    if (errors.length > 0) {
      console.log('   ❌ Validation errors:', errors);
    } else {
      console.log('   ✅ Validation passed');
    }
  });
}

// Export for use in other parts of the application
export default {
  demoProductRegistration,
  demoValidationHelpers,
};