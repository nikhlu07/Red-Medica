import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationRule, FormValidator } from '../../utils/validation';

interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  validationRules?: ValidationRule;
  showValidation?: boolean;
  realTimeValidation?: boolean;
  helperText?: string;
  showCharCount?: boolean;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  onChange?: (value: string, isValid: boolean) => void;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  error: externalError,
  validationRules,
  showValidation = true,
  realTimeValidation = true,
  helperText,
  showCharCount = false,
  onValidationChange,
  onChange,
  className,
  maxLength,
  ...props
}) => {
  const [value, setValue] = useState(props.value || '');
  const [internalError, setInternalError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const error = externalError || internalError;
  const isValid = !error && touched;
  const showError = touched && error;
  const charCount = String(value).length;
  const maxChars = maxLength || validationRules?.maxLength;

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (realTimeValidation && touched && validationRules) {
      setIsValidating(true);
      
      // Debounce validation for better performance
      setTimeout(() => {
        const validationError = validateValue(newValue);
        setInternalError(validationError);
        setIsValidating(false);
        
        const isFieldValid = !validationError;
        onValidationChange?.(isFieldValid, validationError);
        onChange?.(newValue, isFieldValid);
      }, 300);
    } else {
      onChange?.(newValue, true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true);
    
    if (validationRules) {
      const validationError = validateValue(value);
      setInternalError(validationError);
      
      const isFieldValid = !validationError;
      onValidationChange?.(isFieldValid, validationError);
    }
    
    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    props.onFocus?.(e);
  };

  const getValidationIcon = () => {
    if (!showValidation || !touched) return null;
    
    if (isValidating) {
      return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
    
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
        <textarea
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          maxLength={maxLength}
          className={cn(
            'w-full px-3 py-2 border rounded-md shadow-sm transition-colors resize-vertical',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            showValidation && 'pr-10',
            error && touched
              ? 'border-red-300 bg-red-50'
              : isValid
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400',
            props.disabled && 'bg-gray-100 cursor-not-allowed',
            className
          )}
        />
        
        {showValidation && (
          <div className="absolute right-3 top-3">
            {getValidationIcon()}
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
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
        
        {showCharCount && maxChars && (
          <p className={cn(
            'text-xs ml-2 flex-shrink-0',
            charCount > maxChars * 0.9 ? 'text-orange-600' : 'text-gray-500',
            charCount >= maxChars ? 'text-red-600' : ''
          )}>
            {charCount}/{maxChars}
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidatedTextarea;