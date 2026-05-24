import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionService } from '../session.service';
import { Session } from '../entities/session.entity';

describe('SessionService.revokeById', () => {
  let service: SessionService;
  let mockRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  const userId = 'user-1';
  const sessionId = 'session-1';

  it('should return { revoked: false, existed: false } when session does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    const result = await service.revokeById(sessionId, userId);

    expect(result).toEqual({ revoked: false, existed: false });
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: sessionId, userId },
    });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should return { revoked: false, existed: false } when session belongs to another user', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    const result = await service.revokeById(sessionId, 'other-user');

    expect(result).toEqual({ revoked: false, existed: false });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should return { revoked: false, existed: true } when session is already revoked', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: sessionId,
      userId,
      status: 'revoked',
      logoutAt: new Date('2025-01-01'),
      expiredAt: new Date('2099-01-01'),
    });

    const result = await service.revokeById(sessionId, userId);

    expect(result).toEqual({ revoked: false, existed: true });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should return { revoked: false, existed: true } when session is expired', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: sessionId,
      userId,
      status: 'active',
      logoutAt: null,
      expiredAt: new Date('2020-01-01'), // already expired
    });

    const result = await service.revokeById(sessionId, userId);

    expect(result).toEqual({ revoked: false, existed: true });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should return { revoked: false, existed: true } when session has logoutAt set', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: sessionId,
      userId,
      status: 'active',
      logoutAt: new Date('2025-01-01'),
      expiredAt: new Date('2099-01-01'),
    });

    const result = await service.revokeById(sessionId, userId);

    expect(result).toEqual({ revoked: false, existed: true });
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should revoke an active session and return { revoked: true, existed: true }', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: sessionId,
      userId,
      status: 'active',
      logoutAt: null,
      expiredAt: new Date('2099-01-01'), // far future
    });
    mockRepository.update.mockResolvedValue({ affected: 1 });

    const result = await service.revokeById(sessionId, userId);

    expect(result).toEqual({ revoked: true, existed: true });
    expect(mockRepository.update).toHaveBeenCalledWith(sessionId, {
      status: 'revoked',
      logoutAt: expect.any(Date),
    });
  });

  it('should be idempotent — calling twice on same active session returns revoked=false on second call', async () => {
    // First call: session is active
    mockRepository.findOne.mockResolvedValueOnce({
      id: sessionId,
      userId,
      status: 'active',
      logoutAt: null,
      expiredAt: new Date('2099-01-01'),
    });
    mockRepository.update.mockResolvedValue({ affected: 1 });

    const result1 = await service.revokeById(sessionId, userId);
    expect(result1).toEqual({ revoked: true, existed: true });

    // Second call: session is now revoked
    mockRepository.findOne.mockResolvedValueOnce({
      id: sessionId,
      userId,
      status: 'revoked',
      logoutAt: new Date(),
      expiredAt: new Date('2099-01-01'),
    });

    const result2 = await service.revokeById(sessionId, userId);
    expect(result2).toEqual({ revoked: false, existed: true });
    // update should only have been called once (from first call)
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
  });
});
