// Mock Redis client for tests
const redisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  incr: jest.fn(),
  hGet: jest.fn(),
  hSet: jest.fn(),
  hGetAll: jest.fn(),
  hDel: jest.fn(),
  lPush: jest.fn(),
  lRange: jest.fn(),
  lTrim: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
  on: jest.fn(),
};

export default redisClient;
