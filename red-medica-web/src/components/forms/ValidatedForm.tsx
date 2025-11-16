import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormField {
  name: string;
  isValid: boolean;
  error?: string;
  required?: boolean;
}

interface ValidatedFormProps {
  children: React.ReactNode;
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  className?: string;
  showSummary?: boolean;
  submitText?: string;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  loading?: boolean;
  resetOnSubmit?: boolean;
}

export interface ValidatedFormRef {
  validate: () => boolean;
  reset: () => void;
  getFormData: () => Record<string, any>;
  setFieldError: (fieldName: string, error: string) => void;
  clearFieldError: (fieldName: string) => void;
  isValid: () => boolean;
}

export const ValidatedForm = forwardRef<ValidatedFormRef, ValidatedFormProps>(({
  children,
  onSubmit,
  className,
  showSummary = true,
  submitText = 'Submit',
  submitVariant = 'default',
  disabled = false,
  loading = false,
  resetOnSubmit = false,
}, ref) => {
  const [fields, setFields] = useState<Record<string, FormField>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  // Register field validation
  const registerField = (name: string, isValid: boolean, error?: string, required?: boolean) => {
    setFields(prev => ({
      ...prev,
      [name]: { name, isValid, error, required }
    }));
  };

  // Unregister field
  const unregisterField = (name: string) => {
    setFields(prev => {
      const newFields = { ...prev };
      delete newFields[name];
      return newFields;
    });
  };

  // Get form data from form elements
  const getFormData = (): Record<string, any> => {
    if (!formRef.current) return {};

    const formData = new FormData(formRef.current);
    const data: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      // Handle multiple values (checkboxes, multi-select)
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  };

  // Validate all fields
  const validateAll = (): boolean => {
    const fieldValues = Object.values(fields);
    const requiredFields = fieldValues.filter(field => field.required);
    const invalidFields = fieldValues.filter(field => !field.isValid);

    // Check if all required fields are present and valid
    const isFormValid = invalidFields.length === 0 && 
      requiredFields.every(field => field.isValid);

    return isFormValid;
  };

  // Set field error externally
  const setFieldError = (fieldName: string, error: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValid: false,
        error,
      }
    }));
  };

  // Clear field error externally
  const clearFieldError = (fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValid: true,
        error: undefined,
      }
    }));
  };

  // Reset form
  const reset = () => {
    formRef.current?.reset();
    setFields({});
    setSubmitError('');
    setSubmitSuccess('');
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    validate: validateAll,
    reset,
    getFormData,
    setFieldError,
    clearFieldError,
    isValid: validateAll,
  }));

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isSubmitting || loading) return;

    setSubmitError('');
    setSubmitSuccess('');

    // Validate all fields
    const isValid = validateAll();
    if (!isValid) {
      setSubmitError('Please fix the errors above before submitting');
      return;
    }

    if (!onSubmit) return;

    setIsSubmitting(true);

    try {
      const formData = getFormData();
      await onSubmit(formData);
      
      setSubmitSuccess('Form submitted successfully');
      
      if (resetOnSubmit) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while submitting the form'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get validation summary
  const getValidationSummary = () => {
    const fieldValues = Object.values(fields);
    const errors = fieldValues.filter(field => !field.isValid && field.error);
    const totalFields = fieldValues.length;
    const validFields = fieldValues.filter(field => field.isValid).length;

    return {
      totalFields,
      validFields,
      errors,
      isValid: errors.length === 0 && totalFields > 0,
    };
  };

  const summary = getValidationSummary();
  const isFormDisabled = disabled || isSubmitting || loading;

  // Clone children and inject field registration
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onValidationChange: (isValid: boolean, error?: string) => {
          const fieldName = (child.props as any).name || (child.props as any).id;
          if (fieldName) {
            registerField(
              fieldName, 
              isValid, 
              error, 
              (child.props as any).required || (child.props as any).validationRules?.required
            );
          }
          // Call original onValidationChange if it exists
          (child.props as any).onValidationChange?.(isValid, error);
        },
      });
    }
    return child;
  });

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
      noValidate
    >
      {enhancedChildren}

      {/* Validation Summary */}
      {showSummary && summary.totalFields > 0 && (
        <div className={cn(
          'p-3 rounded-md border',
          summary.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {summary.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={cn(
              'text-sm font-medium',
              summary.isValid ? 'text-green-800' : 'text-red-800'
            )}>
              Form Validation: {summary.validFields}/{summary.totalFields} fields valid
            </span>
          </div>

          {summary.errors.length > 0 && (
            <ul className="text-sm text-red-700 space-y-1">
              {summary.errors.map((field, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {field.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {submitError}
        </div>
      )}

      {/* Submit Success */}
      {submitSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
          <CheckCircle className="w-4 h-4" />
          {submitSuccess}
        </div>
      )}

      {/* Submit Button */}
      {onSubmit && (
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            variant={submitVariant}
            disabled={isFormDisabled || !summary.isValid}
            className="min-w-24"
          >
            {(isSubmitting || loading) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {submitText}
          </Button>
        </div>
      )}
    </form>
  );
});

ValidatedForm.displayName = 'ValidatedForm';

export default ValidatedForm;