import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHashService } from './password-hash.service';

describe('PasswordHashService', () => {
  let service: PasswordHashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordHashService],
    }).compile();

    service = module.get<PasswordHashService>(PasswordHashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'Test@123';
      const hashed = await service.hash(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(typeof hashed).toBe('string');
    });

    it('should produce different hashes for the same password (different salts)', async () => {
      const password = 'Test@123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'Test@123';
      const hashed = await service.hash(password);
      const result = await service.compare(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'Test@123';
      const wrongPassword = 'Wrong@456';
      const hashed = await service.hash(password);
      const result = await service.compare(wrongPassword, hashed);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'Test@123';
      const hashed = await service.hash(password);
      const result = await service.compare('', hashed);

      expect(result).toBe(false);
    });
  });
});
