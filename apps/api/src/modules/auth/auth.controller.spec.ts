import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login', () => {
    it('should call authService.login with DTO and IP', async () => {
      const dto = { email: 'user@test.com', password: 'Test@123' };
      const req = { ip: '127.0.0.1' } as any;
      const expectedResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(dto, req);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto, '127.0.0.1');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call authService.refresh with refresh token', async () => {
      const dto = { refreshToken: 'some-refresh-token' };
      const expectedResponse = { accessToken: 'new-token' };

      mockAuthService.refresh.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(dto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.refresh).toHaveBeenCalledWith('some-refresh-token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should call authService.logout with refresh token', async () => {
      const dto = { refreshToken: 'some-refresh-token' };
      const expectedResponse = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(dto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith('some-refresh-token');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should call authService.forgotPassword with DTO', async () => {
      const dto = { email: 'user@test.com' };
      const expectedResponse = {
        message: 'If the email is registered, reset instructions were sent',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should call authService.resetPassword with DTO', async () => {
      const dto = { token: 'reset-token', password: 'NewPass@456' };
      const expectedResponse = { message: 'Password reset successfully' };

      mockAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword(dto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });
});
