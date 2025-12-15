import { createAPIClient } from '../api/client';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('createAPIClient', () => {
    it('should create API client with default config', () => {
      const client = createAPIClient({
        baseURL: 'http://localhost:8080',
      });

      expect(client).toBeDefined();
      expect(client.get).toBeDefined();
      expect(client.post).toBeDefined();
      expect(client.put).toBeDefined();
      expect(client.patch).toBeDefined();
      expect(client.delete).toBeDefined();
    });

    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockData,
        headers: new Headers(),
      });

      const client = createAPIClient({ baseURL: 'http://localhost:8080' });
      const response = await client.get('/test');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make POST request with body', async () => {
      const mockData = { id: 1, name: 'Created' };
      const postData = { name: 'Test' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => mockData,
        headers: new Headers(),
      });

      const client = createAPIClient({ baseURL: 'http://localhost:8080' });
      const response = await client.post('/test', postData);

      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should have retry configuration', () => {
      const client = createAPIClient({
        baseURL: 'http://localhost:8080',
        retries: 3,
        retryDelay: 10,
      });

      expect(client).toBeDefined();
    });

    it('should create client with cache enabled', () => {
      const client = createAPIClient({
        baseURL: 'http://localhost:8080',
        cache: true,
        cacheTTL: 5000,
      });

      expect(client).toBeDefined();
    });

    it('should cache GET requests when enabled', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockData,
        headers: new Headers(),
      });

      const client = createAPIClient({
        baseURL: 'http://localhost:8080',
        cache: true,
        cacheTTL: 1000,
      });

      // First request
      await client.get('/test');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second request (should use cache)
      await client.get('/test');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should not cache non-GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockData,
        headers: new Headers(),
      });

      const client = createAPIClient({
        baseURL: 'http://localhost:8080',
        cache: true,
      });

      await client.post('/test', {});
      await client.post('/test', {});
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
