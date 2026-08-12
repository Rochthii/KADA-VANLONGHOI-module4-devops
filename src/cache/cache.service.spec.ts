import { CacheService } from './cache.service';

const getMock = jest.fn();
const setMock = jest.fn();
const delMock = jest.fn();
const pingMock = jest.fn();

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: getMock,
      set: setMock,
      del: delMock,
      ping: pingMock,
    })),
  };
});

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
    delMock.mockReset();
    pingMock.mockReset();
    process.env.REDIS_URL = 'redis://localhost:6379';
    service = new CacheService();
  });

  it('returns parsed JSON when the key exists', async () => {
    getMock.mockResolvedValue(JSON.stringify({ a: 1 }));
    const result = await service.get('key');
    expect(result).toEqual({ a: 1 });
  });

  it('returns null when the key does not exist', async () => {
    getMock.mockResolvedValue(null);
    const result = await service.get('key');
    expect(result).toBeNull();
  });

  it('sets a JSON-stringified value with a TTL', async () => {
    await service.set('key', { a: 1 }, 60);
    expect(setMock).toHaveBeenCalledWith(
      'key',
      JSON.stringify({ a: 1 }),
      'EX',
      60,
    );
  });

  it('deletes a key', async () => {
    await service.del('key');
    expect(delMock).toHaveBeenCalledWith('key');
  });

  it('returns false from checkConnection when ping throws', async () => {
    pingMock.mockRejectedValue(new Error('down'));
    expect(await service.checkConnection()).toBe(false);
  });
});
