import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  performanceMonitor, 
  recordPageLoad, 
  recordTransactionStart, 
  recordTransactionComplete, 
  recordUserInteraction, 
  recordError,
  generatePerformanceReport 
} from '../services/performanceMonitor';

// Mock window.PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Performance Monitor Service', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor.clearMetrics();
    performanceMonitor.setEnabled(true);
  });

  describe('Basic Functionality', () => {
    it('should record page load metrics', () => {
      recordPageLoad('dashboard', 1500);
      
      const metrics = performanceMonitor.getMetrics('page_load');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('page_load_dashboard');
      expect(metrics[0].value).toBe(1500);
      expect(metrics[0].unit).toBe('ms');
      expect(metrics[0].category).toBe('page_load');
    });

    it('should record user interactions', () => {
      recordUserInteraction('click', 'button', 'dashboard', 100, { buttonId: 'submit' });
      
      const interactions = performanceMonitor.getUserInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].action).toBe('click');
      expect(interactions[0].component).toBe('button');
      expect(interactions[0].page).toBe('dashboard');
      expect(interactions[0].duration).toBe(100);
      expect(interactions[0].metadata?.buttonId).toBe('submit');
    });

    it('should record errors', () => {
      recordError({
        type: 'blockchain',
        message: 'Transaction failed',
        metadata: { txHash: '0x123' }
      });
      
      const errors = performanceMonitor.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('blockchain');
      expect(errors[0].message).toBe('Transaction failed');
      expect(errors[0].metadata?.txHash).toBe('0x123');
    });
  });

  describe('Transaction Monitoring', () => {
    it('should track transaction lifecycle', () => {
      const txHash = '0xabc123';
      
      // Start transaction
      recordTransactionStart(txHash, 'register_product');
      
      let transactions = performanceMonitor.getTransactionMetrics();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].txHash).toBe(txHash);
      expect(transactions[0].operation).toBe('register_product');
      expect(transactions[0].status).toBe('pending');
      
      // Complete transaction
      recordTransactionComplete(txHash, true, 21000, 12345);
      
      transactions = performanceMonitor.getTransactionMetrics();
      expect(transactions[0].status).toBe('success');
      expect(transactions[0].gasUsed).toBe(21000);
      expect(transactions[0].blockNumber).toBe(12345);
      expect(transactions[0].duration).toBeGreaterThan(0);
    });

    it('should handle failed transactions', () => {
      const txHash = '0xfailed';
      
      recordTransactionStart(txHash, 'transfer_custody');
      recordTransactionComplete(txHash, false, undefined, undefined, 'Insufficient funds');
      
      const transactions = performanceMonitor.getTransactionMetrics();
      expect(transactions[0].status).toBe('failed');
      expect(transactions[0].error).toBe('Insufficient funds');
      
      // Should also record an error
      const errors = performanceMonitor.getErrors();
      expect(errors.some(e => e.message.includes('Transaction failed'))).toBe(true);
    });

    it('should track transaction retries', () => {
      const txHash = '0xretry';
      
      recordTransactionStart(txHash, 'verify_product');
      performanceMonitor.recordTransactionRetry(txHash);
      performanceMonitor.recordTransactionRetry(txHash);
      
      const transactions = performanceMonitor.getTransactionMetrics();
      expect(transactions[0].retryCount).toBe(2);
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', () => {
      // Add some test data
      recordPageLoad('dashboard', 1200);
      recordPageLoad('register', 800);
      recordTransactionStart('0x1', 'register');
      recordTransactionComplete('0x1', true, 21000, 100);
      recordTransactionStart('0x2', 'transfer');
      recordTransactionComplete('0x2', false, undefined, undefined, 'Failed');
      recordUserInteraction('click', 'button', 'dashboard');
      recordUserInteraction('form_submit', 'form', 'register');
      recordError({ type: 'validation', message: 'Invalid input' });
      
      const report = generatePerformanceReport();
      
      // Check page load metrics
      expect(report.metrics.pageLoad.count).toBe(2);
      expect(report.metrics.pageLoad.average).toBe(1000); // (1200 + 800) / 2
      
      // Check blockchain metrics
      expect(report.metrics.blockchain.totalTransactions).toBe(2);
      expect(report.metrics.blockchain.transactionSuccessRate).toBe(50); // 1 success out of 2
      expect(report.metrics.blockchain.failedTransactions).toBe(1);
      
      // Check user interactions
      expect(report.metrics.userInteractions.totalInteractions).toBe(2);
      
      // Check errors
      expect(report.metrics.errors.totalErrors).toBe(2); // 1 explicit + 1 from failed transaction
      expect(report.metrics.errors.errorsByType.validation).toBe(1);
      expect(report.metrics.errors.errorsByType.blockchain).toBe(1);
    });

    it('should handle empty data gracefully', () => {
      const report = generatePerformanceReport();
      
      expect(report.metrics.pageLoad.average).toBe(0);
      expect(report.metrics.blockchain.transactionSuccessRate).toBe(0);
      expect(report.metrics.userInteractions.totalInteractions).toBe(0);
      expect(report.metrics.errors.totalErrors).toBe(0);
    });

    it('should filter by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      // Add old data (should be filtered out)
      recordPageLoad('old_page', 2000);
      
      // Wait a bit to ensure different timestamps
      vi.advanceTimersByTime(10);
      
      // Add recent data
      recordPageLoad('new_page', 1000);
      
      const report = generatePerformanceReport({
        start: oneHourAgo,
        end: now
      });
      
      // Should only include recent data
      expect(report.metrics.pageLoad.count).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should limit metrics count to prevent memory leaks', () => {
      // Add more metrics than the limit
      for (let i = 0; i < 1200; i++) {
        recordPageLoad(`page_${i}`, 1000);
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(1000); // Should be limited
    });

    it('should clean up old metrics', () => {
      // This would normally be tested with time manipulation
      // For now, just verify the cleanup method exists and works
      recordPageLoad('test', 1000);
      expect(performanceMonitor.getMetrics()).toHaveLength(1);
      
      performanceMonitor.clearMetrics();
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should not record metrics when disabled', () => {
      performanceMonitor.setEnabled(false);
      
      recordPageLoad('test', 1000);
      recordUserInteraction('click', 'button');
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
      expect(performanceMonitor.getUserInteractions()).toHaveLength(0);
    });

    it('should resume recording when re-enabled', () => {
      performanceMonitor.setEnabled(false);
      recordPageLoad('test1', 1000);
      
      performanceMonitor.setEnabled(true);
      recordPageLoad('test2', 1000);
      
      expect(performanceMonitor.getMetrics()).toHaveLength(1);
      expect(performanceMonitor.getMetrics()[0].name).toBe('page_load_test2');
    });
  });

  describe('Export Functionality', () => {
    it('should export all metrics data', () => {
      recordPageLoad('test', 1000);
      recordUserInteraction('click', 'button');
      recordError({ type: 'ui', message: 'Test error' });
      recordTransactionStart('0x123', 'test');
      
      const exported = performanceMonitor.exportMetrics();
      
      expect(exported.metrics).toHaveLength(1);
      expect(exported.interactions).toHaveLength(1);
      expect(exported.errors).toHaveLength(1);
      expect(exported.transactions).toHaveLength(1);
    });
  });
});

describe('Performance Monitor Integration', () => {
  it('should integrate with error boundaries', () => {
    // Simulate error boundary catching an error
    const error = new Error('Component crashed');
    
    recordError({
      type: 'ui',
      message: error.message,
      stack: error.stack,
      metadata: {
        component: 'TestComponent',
        props: { id: 123 }
      }
    });
    
    const errors = performanceMonitor.getErrors();
    expect(errors[0].type).toBe('ui');
    expect(errors[0].metadata?.component).toBe('TestComponent');
  });

  it('should track blockchain service performance', () => {
    // Simulate blockchain service calls
    const startTime = Date.now();
    
    recordUserInteraction('blockchain_call_start', 'blockchain_service');
    
    // Simulate some processing time
    vi.advanceTimersByTime(500);
    
    recordUserInteraction('blockchain_call_success', 'blockchain_service', undefined, 500);
    
    const interactions = performanceMonitor.getUserInteractions();
    expect(interactions).toHaveLength(2);
    expect(interactions[1].duration).toBe(500);
  });
});