// Generates docs/postman_collection.json — run with: node docs/make-postman.js
const fs = require('fs');
const path = require('path');

const json = (obj) => ({ mode: 'raw', raw: JSON.stringify(obj, null, 2), options: { raw: { language: 'json' } } });
const bearer = (variable) => ({ type: 'bearer', bearer: [{ key: 'token', value: `{{${variable}}}`, type: 'string' }] });

function req(name, method, urlPath, { body, auth = 'userToken', query, test, description } = {}) {
  const raw = `{{baseUrl}}${urlPath}${query ? `?${query.map(([k, v]) => `${k}=${v}`).join('&')}` : ''}`;
  const item = {
    name,
    request: {
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      url: {
        raw,
        host: ['{{baseUrl}}'],
        path: urlPath.split('/').filter(Boolean),
        ...(query ? { query: query.map(([key, value]) => ({ key, value })) } : {}),
      },
      ...(auth ? { auth: bearer(auth) } : { auth: { type: 'noauth' } }),
      ...(body ? { body: json(body) } : {}),
      ...(description ? { description } : {}),
    },
  };
  if (test) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: test } }];
  return item;
}

const saveToken = (variable) => [
  `pm.test('status is 2xx', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));`,
  `const data = pm.response.json().data;`,
  `if (data && data.token) pm.collectionVariables.set('${variable}', data.token);`,
];

const collection = {
  info: {
    name: 'HelpDesk – Support Ticket Management API',
    description:
      'Run "Auth" first: the login requests store userToken/adminToken, and "Create ticket" stores ticketId for the requests after it. Set baseUrl to your deployment if not running locally.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api' },
    { key: 'userToken', value: '' },
    { key: 'adminToken', value: '' },
    { key: 'ticketId', value: '' },
    { key: 'notificationId', value: '' },
  ],
  item: [
    req('Health', 'GET', '/health', { auth: null }),
    {
      name: 'Auth',
      item: [
        req('Register user', 'POST', '/auth/register', {
          auth: null,
          body: { name: 'Asha Verma', email: 'asha@example.com', password: 'Secret123' },
          test: saveToken('userToken'),
          description: 'Returns 409 if the email already exists — then just use "Login user".',
        }),
        req('Login user (demo)', 'POST', '/auth/login', {
          auth: null,
          body: { email: 'user@helpdesk.dev', password: 'User@12345' },
          test: saveToken('userToken'),
        }),
        req('Login admin (demo)', 'POST', '/auth/login', {
          auth: null,
          body: { email: 'admin@helpdesk.dev', password: 'Admin@12345' },
          test: saveToken('adminToken'),
        }),
        req('Me', 'GET', '/auth/me'),
      ],
    },
    {
      name: 'Tickets (user)',
      item: [
        req('Create ticket', 'POST', '/tickets', {
          body: {
            title: 'Cannot download my invoice',
            description: 'The download button on the billing page does nothing.',
            category: 'billing',
            priority: 'high',
          },
          test: [
            `pm.test('created', () => pm.response.to.have.status(201));`,
            `pm.collectionVariables.set('ticketId', pm.response.json().data.ticket.id);`,
          ],
        }),
        req('List my tickets', 'GET', '/tickets', {
          query: [['page', '1'], ['limit', '10'], ['sort', '-createdAt']],
        }),
        req('Get ticket', 'GET', '/tickets/{{ticketId}}'),
        req('Edit ticket (while open)', 'PATCH', '/tickets/{{ticketId}}', {
          body: { title: 'Cannot download my November invoice', priority: 'urgent' },
        }),
        req('Try to change status as user (403)', 'PATCH', '/tickets/{{ticketId}}', { body: { status: 'closed' } }),
        req('Add comment', 'POST', '/tickets/{{ticketId}}/comments', {
          body: { body: 'Tried in Chrome and Firefox, same problem.' },
        }),
        req('List comments', 'GET', '/tickets/{{ticketId}}/comments'),
        req('Ticket activity log', 'GET', '/tickets/{{ticketId}}/activity'),
      ],
    },
    {
      name: 'Admin',
      item: [
        req('List all tickets (filtered)', 'GET', '/tickets', {
          auth: 'adminToken',
          query: [['status', 'open'], ['priority', 'urgent'], ['search', 'invoice'], ['sort', '-priority']],
        }),
        req('Change status & priority', 'PATCH', '/tickets/{{ticketId}}', {
          auth: 'adminToken',
          body: { status: 'in_progress', priority: 'high' },
        }),
        req('Reply to ticket', 'POST', '/tickets/{{ticketId}}/comments', {
          auth: 'adminToken',
          body: { body: 'Thanks — we found the bug and are deploying a fix today.' },
        }),
        req('Resolve ticket', 'PATCH', '/tickets/{{ticketId}}', { auth: 'adminToken', body: { status: 'resolved' } }),
        req('Dashboard stats', 'GET', '/admin/stats', { auth: 'adminToken' }),
      ],
    },
    {
      name: 'Notifications',
      item: [
        req('My notifications', 'GET', '/notifications', {
          test: [
            `const list = pm.response.json().data.notifications;`,
            `if (list.length) pm.collectionVariables.set('notificationId', list[0].id);`,
          ],
        }),
        req('Mark one read', 'PATCH', '/notifications/{{notificationId}}/read'),
        req('Mark all read', 'PATCH', '/notifications/read-all'),
      ],
    },
    {
      name: 'Cleanup',
      item: [req('Delete ticket (admin)', 'DELETE', '/tickets/{{ticketId}}', { auth: 'adminToken' })],
    },
  ],
};

fs.writeFileSync(path.join(__dirname, 'postman_collection.json'), `${JSON.stringify(collection, null, 2)}\n`);
console.log('Wrote docs/postman_collection.json');
