import request from 'supertest';
import app from '../../src/index';
import db from '../../src/configs/db';

describe('Users Integration Tests', () => {

  it('should login an existing user', async () => {
    // Primeiro cria o usuário
    await request(app)
      .post('/users')
      .send({ username: 'testuser2', password: 'password123' });

    // Tenta fazer login
    const res = await request(app)
      .post('/users/login')
      .send({ username: 'testuser2', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('username', 'testuser2');
  });


    it('should block login with incorrect password', async () => {
      await request(app)
        .post('/users')
        .send({ username: 'testuser_wrongpass', password: 'password123' });

      const res = await request(app)
        .post('/users/login')
        .send({ username: 'testuser_wrongpass', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });


    it('should block login with inexistent user', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({ username: 'nonexistentuser', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    
    it('should block login with empty fields', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({ username: '', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
});