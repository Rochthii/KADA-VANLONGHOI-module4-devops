import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const dto = { name: 'Alice', email: 'alice@example.com' };
      const expectedUser = { id: 'uuid-1', ...dto, createdAt: new Date() };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(expectedUser);

      const result = await service.createUser(dto);
      expect(result).toEqual(expectedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw ConflictException if email exists', async () => {
      const dto = { name: 'Alice', email: 'alice@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'uuid-existing', ...dto });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUsers', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { id: 'uuid-1', name: 'Alice', email: 'alice@example.com', createdAt: new Date() },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);

      const result = await service.getUsers();
      expect(result).toEqual(expectedUsers);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });
});
