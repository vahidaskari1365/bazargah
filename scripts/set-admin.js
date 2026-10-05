const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.update({ where: { phone: '09121112233' }, data: { roles: '["BUYER","ADMIN"]' } })
  .then(u => console.log('ADMIN-SET:', u.phone, u.roles))
  .catch(e => console.error('ERR:', e.message))
  .finally(() => p.$disconnect());
