import { HttpException, HttpStatus } from '@nestjs/common';

export interface ValidationErrorDetail {
  field: string;
  code: string;
}

export class ValidationException extends HttpException {
  constructor(public errors: ValidationErrorDetail[]) {
    super('Validation failed', HttpStatus.BAD_REQUEST);
  }
}
