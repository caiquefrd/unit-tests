import request from 'supertest';
import app from '../../src/index';
import db from '../../src/configs/db';

describe('Users Integration Tests', () => {
  // afterEach removed; global setup handles truncation

  it('should create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        username: 'testuser1',
        password: 'password123'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('message', 'Usuário criado com sucesso.');
  });

  it('should not allow duplicate usernames', async () => {
    // Cria usuário
    await request(app)
      .post('/users')
      .send({ username: 'duplicado', password: 'password123' });
    // Tenta criar novamente com mesmo username
    const res = await request(app)
      .post('/users')
      .send({ username: 'duplicado', password: 'password123' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('should not allow username too short', async () => {
    const res = await request(app)
      .post('/users')
      .send({ username: 'ab', password: 'password123' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('should not allow password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/users')
      .send({ username: 'validuser', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });
});