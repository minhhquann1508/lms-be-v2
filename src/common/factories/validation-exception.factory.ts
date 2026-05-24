import { ValidationError } from 'class-validator';
import { ValidationException } from '../exceptions';
import { ValidationErrorCode } from '../constants';

export const validationExceptionFactory = (
  errors: ValidationError[],
): ValidationException => {
  const formatErrors = (
    validationErrors: ValidationError[],
    parentPath: string = '',
  ): { field: string; code: string }[] => {
    return validationErrors.flatMap((error) => {
      const fieldPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      const currentErrors: { field: string; code: string }[] = [];
      // Handle whitelist validation error (property should not exist)
      if (error.constraints?.whitelistValidation) {
        currentErrors.push({
          field: fieldPath,
          code: ValidationErrorCode.PROPERTY_NOT_ALLOWED,
        });
      } else if (error.constraints) {
        // Handle standard validation errors
        currentErrors.push(
          ...Object.values(error.constraints).map((code) => ({
            field: fieldPath,
            code,
          })),
        );
      }

      if (error.children && error.children.length > 0) {
        currentErrors.push(...formatErrors(error.children, fieldPath));
      }

      return currentErrors;
    });
  };

  return new ValidationException(formatErrors(errors));
};
