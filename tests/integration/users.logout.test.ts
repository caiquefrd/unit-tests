import request from 'supertest';
import app from '../../src/index';
import db from '../../src/configs/db';

describe('Users Integration Tests', () => {

  it('should logout a logged-in user', async () => {
    // Cria usuário e faz login
    await request(app)
      .post('/users')
      .send({ username: 'testuser3', password: 'password123' });

    const loginRes = await request(app)
      .post('/users/login')
      .send({ username: 'testuser3', password: 'password123' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('data');
    expect(loginRes.body.data).toHaveProperty('token');

    const token = loginRes.body.data.token;

    // Faz logout
    const res = await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('message');
  });


  it('should reject requests with a logged-out token', async () => {
    // Cria usuário e faz login
    await request(app)
      .post('/users')
      .send({ username: 'testuser4', password: 'password123' });

    const loginRes = await request(app)
      .post('/users/login')
      .send({ username: 'testuser4', password: 'password123' });

    const token = loginRes.body.data.token;

    // Faz logout
    await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${token}`);

    // Tenta acessar rota protegida com o token já deslogado
    const res = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  
  it('should reject requests with a token that was logged out after login', async () => {
    // Create user and login
    await request(app)
      .post('/users')
      .send({ username: 'testuser5', password: 'password123' });

    const loginRes = await request(app)
      .post('/users/login')
      .send({ username: 'testuser5', password: 'password123' });
    const token = loginRes.body.data.token;

    // Logout
    await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${token}`);

    // Try to access a protected route with the logged-out token
    const res = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });
});
