/**
 * Customer Database Tool (READ / EXPORT / DELETE / Confidential)
 * Includes mock data store to demonstrate safe vs dangerous queries.
 */
const mockCustomers = [
  { id: 1, name: 'Alice Cooper', email: 'alice@example.com', ssn: '123-45-6789', balance: 4500 },
  { id: 2, name: 'Bob Sterling', email: 'bob@example.com', ssn: '987-65-4321', balance: 12000 },
  { id: 3, name: 'Charlie Dave', email: 'charlie@example.com', ssn: '555-00-1122', balance: 800 },
];

async function executeDatabase(params) {
  const { action, query, limit = 10, customerId } = params;

  if (action === 'delete') {
    return {
      affectedRows: customerId ? 1 : 0,
      deletedId: customerId,
      status: 'success',
      action: 'delete_record',
    };
  }

  if (action === 'export') {
    return {
      exportedRecordsCount: Math.min(limit, 100),
      records: mockCustomers.slice(0, limit),
      format: 'json',
      status: 'success',
    };
  }

  // Default read
  return {
    count: Math.min(limit, mockCustomers.length),
    records: mockCustomers.slice(0, limit).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
    })),
    status: 'success',
  };
}

module.exports = {
  id: 'customer_db',
  name: 'Customer Database Gateway',
  category: 'READ',
  sensitivity: 'CONFIDENTIAL',
  destinations: ['db.internal.cluster:5432', 'https://customer-service.internal'],
  schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['read', 'export', 'delete'] },
      query: { type: 'string' },
      limit: { type: 'number' },
      customerId: { type: 'number' },
    },
    required: ['action'],
  },
  execute: executeDatabase,
};
