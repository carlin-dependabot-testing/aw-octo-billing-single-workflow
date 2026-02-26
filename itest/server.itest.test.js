/**
 * @jest-environment node
 */
const { GenericContainer, Wait } = require('testcontainers');
const axios = require('axios');

jest.setTimeout(180000);

describe('Octo Billing integration (Docker + Testcontainers)', () => {
  let container;
  let baseUrl;

  beforeAll(async () => {
    // Use the image built ahead of time in CI/local
    const imageTag = process.env.IMAGE_NAME || 'octo-billing:itest';

    container = await new GenericContainer(imageTag)
      .withExposedPorts(3000)
      .start();

    const mappedPort = container.getMappedPort(3000);
    const host = container.getHost();
    baseUrl = `http://${host}:${mappedPort}`;
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  test('GET /api/health returns ok', async () => {
    const res = await axios.get(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
  });

  test('user, bill and payment flow', async () => {
    const user = {
      username: 'itest-user',
      email: 'itest@example.com',
      password: 'secretpass'
    };

    const createUser = await axios.post(`${baseUrl}/api/users`, user);
    expect(createUser.status).toBe(201);
    expect(createUser.data).toMatchObject({ username: user.username, email: user.email });

    const listUsers = await axios.get(`${baseUrl}/api/users`);
    expect(listUsers.status).toBe(200);
    expect(Array.isArray(listUsers.data)).toBe(true);
    expect(listUsers.data.some(u => u.username === user.username)).toBe(true);

    const bill = {
      userId: 1,
      amount: 25.5,
      description: 'Subscription'
    };
    const createBill = await axios.post(`${baseUrl}/api/bills`, bill);
    expect(createBill.status).toBe(201);
    expect(createBill.data).toMatchObject({ userId: 1, amount: 25.5, description: 'Subscription' });

    const listBills = await axios.get(`${baseUrl}/api/bills`);
    expect(listBills.status).toBe(200);
    expect(Array.isArray(listBills.data)).toBe(true);
    const createdBill = listBills.data.find(b => b.description === 'Subscription');
    expect(createdBill).toBeTruthy();

    const payment = {
      billId: createdBill.id,
      amount: createdBill.amount,
      paymentMethod: 'card'
    };
    const createPayment = await axios.post(`${baseUrl}/api/payments`, payment);
    expect(createPayment.status).toBe(201);
    expect(createPayment.data).toMatchObject({ billId: createdBill.id, amount: createdBill.amount, paymentMethod: 'card' });

    const listPayments = await axios.get(`${baseUrl}/api/payments`);
    expect(listPayments.status).toBe(200);
    expect(Array.isArray(listPayments.data)).toBe(true);
  });
});
