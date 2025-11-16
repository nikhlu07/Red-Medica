import React from 'react';
import { ethers } from 'ethers';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule;
  label?: string;
}

export class FormValidator {
  private fields: Record<string, FieldValidation> = {};
  private errors: Record<string, string> = {};

  // Add field for validation
  addField(name: string, value: any, rules: ValidationRule, label?: string): FormValidator {
    this.fields[name] = { value, rules, label: label || name };
    return this;
  }

  // Validate all fields
  validate(): ValidationResult {
    this.errors = {};

    for (const [fieldName, field] of Object.entries(this.fields)) {
      const error = this.validateField(field.value, field.rules, field.label);
      if (error) {
        this.errors[fieldName] = error;
      }
    }

    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: { ...this.errors },
      firstError: Object.values(this.errors)[0],
    };
  }

  // Validate single field
  validateField(value: any, rules: ValidationRule, label: string = 'Field'): string | null {
    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return `${label} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    const stringValue = String(value);

    // Length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      return `${label} must be at least ${rules.minLength} characters long`;
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return `${label} must not exceed ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return `${label} format is invalid`;
    }

    // Numeric validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `${label} must be at least ${rules.min}`;
      }

      if (rules.max !== undefined && value > rules.max) {
        return `${label} must not exceed ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  // Get errors for a specific field
  getFieldError(fieldName: string): string | null {
    return this.errors[fieldName] || null;
  }

  // Check if a specific field has errors
  hasFieldError(fieldName: string): boolean {
    return fieldName in this.errors;
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = {};
  }

  // Clear error for specific field
  clearFieldError(fieldName: string): void {
    delete this.errors[fieldName];
  }
}

// Predefined validation rules for common use cases
export const ValidationRules = {
  // Product validation rules
  productName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-\.\(\)]+$/,
  },

  batchNumber: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9\-]+$/,
  },

  manufacturerName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-\.\,\&]+$/,
  },

  quantity: {
    required: true,
    min: 1,
    max: 1000000,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return 'Quantity must be a whole number';
      }
      return null;
    },
  },

  category: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },

  // Address validation
  ethereumAddress: {
    required: true,
    custom: (value: string) => {
      if (!ethers.isAddress(value)) {
        return 'Invalid Ethereum address format';
      }
      return null;
    },
  },

  // Location validation
  location: {
    required: true,
    minLength: 3,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-\.\,\(\)]+$/,
  },

  // Date validation
  date: {
    required: true,
    custom: (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      return null;
    },
  },

  futureDate: {
    required: true,
    custom: (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      if (date <= new Date()) {
        return 'Date must be in the future';
      }
      return null;
    },
  },

  pastDate: {
    required: true,
    custom: (value: any) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      if (date >= new Date()) {
        return 'Date must be in the past';
      }
      return null;
    },
  },

  // QR Code validation
  productId: {
    required: true,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
        return 'Product ID must be a positive integer';
      }
      return null;
    },
  },
};

// Specific validation functions for different forms
export class ProductRegistrationValidator {
  static validate(data: {
    name: string;
    batchNumber: string;
    manufacturerName: string;
    quantity: number;
    mfgDate: string;
    expiryDate: string;
    category: string;
  }): ValidationResult {
    const validator = new FormValidator()
      .addField('name', data.name, ValidationRules.productName, 'Product Name')
      .addField('batchNumber', data.batchNumber, ValidationRules.batchNumber, 'Batch Number')
      .addField('manufacturerName', data.manufacturerName, ValidationRules.manufacturerName, 'Manufacturer Name')
      .addField('quantity', data.quantity, ValidationRules.quantity, 'Quantity')
      .addField('category', data.category, ValidationRules.category, 'Category')
      .addField('mfgDate', data.mfgDate, ValidationRules.pastDate, 'Manufacturing Date')
      .addField('expiryDate', data.expiryDate, ValidationRules.futureDate, 'Expiry Date');

    // Additional cross-field validation
    const result = validator.validate();
    
    if (result.isValid && data.mfgDate && data.expiryDate) {
      const mfgDate = new Date(data.mfgDate);
      const expiryDate = new Date(data.expiryDate);
      
      if (expiryDate <= mfgDate) {
        result.isValid = false;
        result.errors.expiryDate = 'Expiry date must be after manufacturing date';
      }
    }

    return result;
  }
}

export class TransferValidator {
  static validate(data: {
    productId: number;
    toAddress: string;
    location: string;
  }): ValidationResult {
    return new FormValidator()
      .addField('productId', data.productId, ValidationRules.productId, 'Product ID')
      .addField('toAddress', data.toAddress, ValidationRules.ethereumAddress, 'Recipient Address')
      .addField('location', data.location, ValidationRules.location, 'Location')
      .validate();
  }
}

export class ProductVerificationValidator {
  static validate(data: {
    productId: string | number;
  }): ValidationResult {
    return new FormValidator()
      .addField('productId', data.productId, ValidationRules.productId, 'Product ID')
      .validate();
  }
}

// QR Code validation
export class QRCodeValidator {
  static validateQRData(qrData: string): ValidationResult {
    const validator = new FormValidator();
    
    try {
      // Try to parse as URL first
      const url = new URL(qrData);
      const params = new URLSearchParams(url.search);
      
      const productId = params.get('productId');
      const batchNumber = params.get('batch');
      
      if (!productId) {
        return {
          isValid: false,
          errors: { qrData: 'QR code does not contain valid product information' },
          firstError: 'QR code does not contain valid product information',
        };
      }

      validator.addField('productId', productId, ValidationRules.productId, 'Product ID');
      
      if (batchNumber) {
        validator.addField('batchNumber', batchNumber, ValidationRules.batchNumber, 'Batch Number');
      }

      return validator.validate();
    } catch (urlError) {
      // Try to parse as JSON
      try {
        const data = JSON.parse(qrData);
        
        if (!data.productId) {
          return {
            isValid: false,
            errors: { qrData: 'QR code does not contain valid product ID' },
            firstError: 'QR code does not contain valid product ID',
          };
        }

        validator.addField('productId', data.productId, ValidationRules.productId, 'Product ID');
        
        if (data.batchNumber) {
          validator.addField('batchNumber', data.batchNumber, ValidationRules.batchNumber, 'Batch Number');
        }

        return validator.validate();
      } catch (jsonError) {
        // Try to parse as plain product ID
        const productId = parseInt(qrData);
        if (!isNaN(productId) && productId > 0) {
          return {
            isValid: true,
            errors: {},
          };
        }

        return {
          isValid: false,
          errors: { qrData: 'Invalid QR code format' },
          firstError: 'Invalid QR code format',
        };
      }
    }
  }

  static extractProductId(qrData: string): number | null {
    try {
      // Try URL format
      const url = new URL(qrData);
      const params = new URLSearchParams(url.search);
      const productId = params.get('productId');
      if (productId) {
        const id = parseInt(productId);
        return isNaN(id) ? null : id;
      }
    } catch {
      // Try JSON format
      try {
        const data = JSON.parse(qrData);
        if (data.productId) {
          const id = parseInt(data.productId);
          return isNaN(id) ? null : id;
        }
      } catch {
        // Try plain number
        const id = parseInt(qrData);
        return isNaN(id) ? null : id;
      }
    }
    
    return null;
  }
}

// Real-time validation hook for React components
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, ValidationRule>
) {
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validateField = (name: keyof T, value: any): string | null => {
    const rule = validationRules[name];
    if (!rule) return null;

    const validator = new FormValidator();
    return validator.validateField(value, rule, String(name));
  };

  const updateField = (name: keyof T, value: any) => {
    setData(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it has been touched
    if (touched[name as string]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  };

  const touchField = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name as string]: true }));
    
    // Validate field when touched
    const error = validateField(name, data[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
  };

  const validateAll = (): ValidationResult => {
    const validator = new FormValidator();
    
    for (const [name, rule] of Object.entries(validationRules)) {
      validator.addField(name, data[name as keyof T], rule as ValidationRule, name);
    }

    const result = validator.validate();
    setErrors(result.errors);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    return result;
  };

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  const reset = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAll,
    clearErrors,
    reset,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0,
  };
}

export default FormValidator;