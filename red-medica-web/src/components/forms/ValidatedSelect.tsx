import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationRule, FormValidator } from '../../utils/validation';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ValidatedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  validationRules?: ValidationRule;
  showValidation?: boolean;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  onChange?: (value: string, isValid: boolean) => void;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  error: externalError,
  validationRules,
  showValidation = true,
  helperText,
  options,
  placeholder = 'Select an option...',
  onValidationChange,
  onChange,
  className,
  ...props
}) => {
  const [value, setValue] = useState(props.value || '');
  const [internalError, setInternalError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const error = externalError || internalError;
  const isValid = !error && touched && value !== '';
  const showError = touched && error;

  useEffect(() => {
    if (props.value !== undefined) {
      setValue(String(props.value));
    }
  }, [props.value]);

  const validateValue = (val: string): string => {
    if (!validationRules) return '';
    
    const validator = new FormValidator();
    return validator.validateField(val, validationRules, label || 'Field') || '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (touched && validationRules) {
      const validationError = validateValue(newValue);
      setInternalError(validationError);
      
      const isFieldValid = !validationError;
      onValidationChange?.(isFieldValid, validationError);
      onChange?.(newValue, isFieldValid);
    } else {
      onChange?.(newValue, true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTouched(true);
    
    if (validationRules) {
      const validationError = validateValue(value);
      setInternalError(validationError);
      
      const isFieldValid = !validationError;
      onValidationChange?.(isFieldValid, validationError);
    }
    
    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    props.onFocus?.(e);
  };

  const getValidationIcon = () => {
    if (!showValidation || !touched) return null;
    
    if (error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (isValid && validationRules) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return null;
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {validationRules?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn(
            'w-full px-3 py-2 border rounded-md shadow-sm transition-colors appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'pr-10', // Always add right padding for icons
            error && touched
              ? 'border-red-300 bg-red-50'
              : isValid
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400',
            props.disabled && 'bg-gray-100 cursor-not-allowed',
            className
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {getValidationIcon()}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {showError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      
      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default ValidatedSelect;