// Unit test for AllExceptionsFilter pass-through and Throttler mapping
// **Validates: Requirements R8.AC1, R12.AC1, R12.AC2, R12.AC3**

import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../http-exception.filter';
import { ValidationErrorCode } from '@common/constants/error-codes';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: { status: jest.Mock };
  let mockRequest: { url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };
    mockRequest = { url: '/api/auth/login' };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  describe('HttpException with string body', () => {
    it('should use string response as both code and message', () => {
      const exception = new HttpException(
        'USER_NOT_FOUND',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          code: 'USER_NOT_FOUND',
          message: 'USER_NOT_FOUND',
          path: '/api/auth/login',
        }),
      );
    });
  });

  describe('HttpException with object body containing code and details (409 ACCOUNT_IN_USE_ON_ANOTHER_DEVICE)', () => {
    it('should pass-through code and details fields', () => {
      const activeDevices = [
        {
          deviceId: 'device-1',
          deviceName: 'MacBook Pro',
          deviceType: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
          ipAddress: '192.168.1.1',
          lastLoginAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const exception = new HttpException(
        {
          code: ValidationErrorCode.ACCOUNT_IN_USE_ON_ANOTHER_DEVICE,
          message: ValidationErrorCode.ACCOUNT_IN_USE_ON_ANOTHER_DEVICE,
          details: { activeDevices },
        },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(409);
      expect(responseBody.code).toBe('ACCOUNT_IN_USE_ON_ANOTHER_DEVICE');
      expect(responseBody.message).toBe('ACCOUNT_IN_USE_ON_ANOTHER_DEVICE');
      expect(responseBody.details).toEqual({ activeDevices });
      expect(responseBody.path).toBe('/api/auth/login');
      expect(responseBody.timestamp).toBeDefined();
    });

    it('should include details with nested objects intact', () => {
      const details = {
        activeDevices: [
          {
            deviceId: 'a',
            deviceName: 'Phone',
            deviceType: 'mobile',
            os: 'iOS',
            browser: 'Safari',
            ipAddress: '10.0.0.1',
            lastLoginAt: '2025-06-01T12:00:00Z',
          },
          {
            deviceId: 'b',
            deviceName: 'Laptop',
            deviceType: 'desktop',
            os: 'Windows',
            browser: 'Edge',
            ipAddress: '10.0.0.2',
            lastLoginAt: '2025-06-02T12:00:00Z',
          },
        ],
      };

      const exception = new HttpException(
        {
          code: ValidationErrorCode.ACCOUNT_IN_USE_ON_ANOTHER_DEVICE,
          message: ValidationErrorCode.ACCOUNT_IN_USE_ON_ANOTHER_DEVICE,
          details,
        },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockHost);

      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.details.activeDevices).toHaveLength(2);
      expect(responseBody.details.activeDevices[0].deviceId).toBe('a');
      expect(responseBody.details.activeDevices[1].deviceId).toBe('b');
    });
  });

  describe('ThrottlerException mapping → TOO_MANY_REQUESTS', () => {
    it('should map ThrottlerException to 429 with code TOO_MANY_REQUESTS', () => {
      // Simulate ThrottlerException (which extends HttpException but has constructor.name === 'ThrottlerException')
      class ThrottlerException extends HttpException {
        constructor() {
          super('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
        }
      }

      const exception = new ThrottlerException();

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(429);
      expect(responseBody.code).toBe(ValidationErrorCode.TOO_MANY_REQUESTS);
      expect(responseBody.message).toBe(ValidationErrorCode.TOO_MANY_REQUESTS);
    });
  });

  describe('generic Error → 500 + hide message in production', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 500 and hide message when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const exception = new Error('Sensitive database connection error');

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(500);
      expect(responseBody.message).toBe('Internal server error');
      expect(responseBody.message).not.toContain('Sensitive');
      expect(responseBody.path).toBe('/api/auth/login');
    });

    it('should return 500 and show message when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      const exception = new Error('Sensitive database connection error');

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(500);
      expect(responseBody.message).toBe('Sensitive database connection error');
    });

    it('should not hide message for non-500 errors in production', () => {
      process.env.NODE_ENV = 'production';
      const exception = new HttpException(
        'USER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockHost);

      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(404);
      expect(responseBody.message).toBe('USER_NOT_FOUND');
    });
  });

  describe('response structure', () => {
    it('should always include timestamp and path', () => {
      const exception = new HttpException('TEST', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(responseBody.path).toBe('/api/auth/login');
    });

    it('should handle HttpException with object response that has no code', () => {
      const exception = new HttpException(
        { message: 'Validation failed', error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(400);
      expect(responseBody.message).toBe('Validation failed');
      expect(responseBody.code).toBeUndefined();
    });
  });
});
