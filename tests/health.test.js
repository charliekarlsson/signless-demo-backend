import request from 'supertest';
import app from '../src/app.js';

describe('health endpoint', () => {
  it('responds with environment metadata', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        environment: expect.any(String),
        timestamp: expect.any(String),
      }),
    );
  });
});
