import request from 'supertest';
import app from '../../src/index';
import db from '../../src/configs/db';

describe('Contacts Integration Tests', () => {

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .get('/contacts');
    expect(res.statusCode).toBe(401);
  });

  it('should list only the contacts of the authenticated user and guarantee correct format', async () => {
    // Create two users
    await request(app)
      .post('/users')
      .send({ username: 'userA', password: 'passwordA' });
    await request(app)
      .post('/users')
      .send({ username: 'userB', password: 'passwordB' });

    // Login userA
    const loginA = await request(app)
      .post('/users/login')
      .send({ username: 'userA', password: 'passwordA' });
    const tokenA = loginA.body.data.token;

    // Login userB
    const loginB = await request(app)
      .post('/users/login')
      .send({ username: 'userB', password: 'passwordB' });
    const tokenB = loginB.body.data.token;

    // Create contacts for userA
    await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Alice', phone: '11999999999' });
    await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Bob', phone: '11888888888' });

    // Create contact for userB
    await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Charlie', phone: '11777777777' });

    // List contacts for userA
    const resA = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resA.statusCode).toBe(200);
    expect(resA.body).toHaveProperty('success', true);
    expect(Array.isArray(resA.body.data)).toBe(true);
    // Should only contain contacts for userA
    expect(resA.body.data.length).toBeGreaterThanOrEqual(2);
    resA.body.data.forEach((contact:any) => {
      expect(contact).toHaveProperty('id');
      expect(contact).toHaveProperty('user_id');
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('phone');
      expect(['Alice', 'Bob']).toContain(contact.name);
      expect(['11999999999', '11888888888']).toContain(contact.phone);
    });

    // List contacts for userB
    const resB = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resB.statusCode).toBe(200);
    expect(resB.body).toHaveProperty('success', true);
    expect(Array.isArray(resB.body.data)).toBe(true);
    // Should only contain contact for userB
    expect(resB.body.data.length).toBeGreaterThanOrEqual(1);
    resB.body.data.forEach((contact:any) => {
      expect(contact).toHaveProperty('id');
      expect(contact).toHaveProperty('user_id');
      expect(contact).toHaveProperty('name', 'Charlie');
      expect(contact).toHaveProperty('phone', '11777777777');
    });
  });

      it('should update a contact with success', async () => {
        // Create and login user
        await request(app)
          .post('/users')
          .send({ username: 'updateuser', password: 'password123' });
        const loginRes = await request(app)
          .post('/users/login')
          .send({ username: 'updateuser', password: 'password123' });
        const token = loginRes.body.data.token;

        // Create contact
        const createRes = await request(app)
          .post('/contacts')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Old Name', phone: '11999999999' });
        const contactId = createRes.body.data.contact.id;

        // Update contact
        const updateRes = await request(app)
          .put(`/contacts/${contactId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'New Name', phone: '11888888888' });
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body).toHaveProperty('success', true);
        expect(updateRes.body.data).toHaveProperty('name', 'New Name');
        expect(updateRes.body.data).toHaveProperty('phone', '11888888888');
      });

      it('should return error 404 while trying to update an inexistent contact', async () => {
        await request(app)
          .post('/users')
          .send({ username: 'updateuser404', password: 'password123' });
        const loginRes = await request(app)
          .post('/users/login')
          .send({ username: 'updateuser404', password: 'password123' });
        const token = loginRes.body.data.token;

        // Try to update a contact that does not exist
        const updateRes = await request(app)
          .put('/contacts/999999')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'No Contact', phone: '11777777777' });
        expect(updateRes.statusCode).toBe(404);
        expect(updateRes.body).toHaveProperty('success', false);
        expect(updateRes.body).toHaveProperty('error');
      });

      it('should delete a contact with success', async () => {
        await request(app)
          .post('/users')
          .send({ username: 'deleteuser', password: 'password123' });
        const loginRes = await request(app)
          .post('/users/login')
          .send({ username: 'deleteuser', password: 'password123' });
        const token = loginRes.body.data.token;

        // Create contact
        const createRes = await request(app)
          .post('/contacts')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Delete Me', phone: '11999999999' });
        const contactId = createRes.body.data.contact.id;

        // Delete contact
        const deleteRes = await request(app)
          .delete(`/contacts/${contactId}`)
          .set('Authorization', `Bearer ${token}`);
        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body).toHaveProperty('success', true);
        expect(deleteRes.body.data).toHaveProperty('message', 'Contato deletado com sucesso');
      });

      it('should return error 404 while trying to delete an inexistent contact', async () => {
        await request(app)
          .post('/users')
          .send({ username: 'deleteuser404', password: 'password123' });
        const loginRes = await request(app)
          .post('/users/login')
          .send({ username: 'deleteuser404', password: 'password123' });
        const token = loginRes.body.data.token;

        // Try to delete a contact that does not exist
        const deleteRes = await request(app)
          .delete('/contacts/999999')
          .set('Authorization', `Bearer ${token}`);
        expect(deleteRes.statusCode).toBe(404);
        expect(deleteRes.body).toHaveProperty('success', false);
        expect(deleteRes.body).toHaveProperty('error');
      });
    it('should create a valid contact with success (associated with authenticated user)', async () => {
      // Create and login user
      await request(app)
        .post('/users')
        .send({ username: 'contactuser', password: 'password123' });
      const loginRes = await request(app)
        .post('/users/login')
        .send({ username: 'contactuser', password: 'password123' });
      const token = loginRes.body.data.token;

      // Create contact
      const res = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Doe', phone: '11999999999' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('message');
    });

    it('should block contact creation without needed fields (name or phone)', async () => {
      await request(app)
        .post('/users')
        .send({ username: 'contactuser2', password: 'password123' });
      const loginRes = await request(app)
        .post('/users/login')
        .send({ username: 'contactuser2', password: 'password123' });
      const token = loginRes.body.data.token;

      // Missing name
      const res1 = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11999999999' });
      expect(res1.statusCode).toBe(400);
      expect(res1.body).toHaveProperty('success', false);
      expect(res1.body).toHaveProperty('error');

      // Missing phone
      const res2 = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Doe' });
      expect(res2.statusCode).toBe(400);
      expect(res2.body).toHaveProperty('success', false);
      expect(res2.body).toHaveProperty('error');
    });

    it('should block contact creation with too short name', async () => {
      await request(app)
        .post('/users')
        .send({ username: 'contactuser3', password: 'password123' });
      const loginRes = await request(app)
        .post('/users/login')
        .send({ username: 'contactuser3', password: 'password123' });
      const token = loginRes.body.data.token;

      const res = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Jo', phone: '11999999999' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should block contact creation with invalid phone format', async () => {
      await request(app)
        .post('/users')
        .send({ username: 'contactuser4', password: 'password123' });
      const loginRes = await request(app)
        .post('/users/login')
        .send({ username: 'contactuser4', password: 'password123' });
      const token = loginRes.body.data.token;

      const res = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Doe', phone: 'invalidphone' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
});