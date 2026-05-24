import { ParseBoolPipe, Query } from '@nestjs/common';

export type OptionalBooleanQueryValue = boolean | string | undefined;

/**
 * Type params as OptionalBooleanQueryValue so global implicit conversion does
 * not coerce invalid strings to false before ParseBoolPipe validates them.
 */
export const OptionalBooleanQuery = (property: string): ParameterDecorator =>
  Query(property, new ParseBoolPipe({ optional: true }));
