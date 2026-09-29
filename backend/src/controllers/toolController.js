const Tool = require('../models/Tool');
const { getAvailableTools } = require('../tools/toolExecutor');

async function listTools(req, res, next) {
  try {
    const tools = await Tool.find();
    res.json({ count: tools.length, tools });
  } catch (err) {
    next(err);
  }
}

async function registerTool(req, res, next) {
  try {
    const { toolId, name, category, description, sensitivity, schema, destinations, isSensitive, enabled } = req.body;

    const existing = await Tool.findOne({ toolId });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: `Tool '${toolId}' already registered` });
    }

    const tool = await Tool.create({
      toolId,
      name,
      category,
      description,
      sensitivity,
      schema,
      destinations,
      isSensitive,
      enabled: enabled !== undefined ? enabled : true,
    });

    res.status(201).json({ message: 'Tool registered successfully', tool });
  } catch (err) {
    next(err);
  }
}

async function seedDefaultTools(req, res, next) {
  try {
    const safeTools = getAvailableTools();
    const created = [];

    for (const toolDef of safeTools) {
      let doc = await Tool.findOne({ toolId: toolDef.id });
      if (!doc) {
        doc = await Tool.create({
          toolId: toolDef.id,
          name: toolDef.name,
          category: toolDef.category,
          sensitivity: toolDef.sensitivity,
          schema: toolDef.schema,
          destinations: toolDef.destinations,
          isSensitive: toolDef.sensitivity === 'CONFIDENTIAL' || toolDef.category === 'DELETE',
          enabled: true,
        });
        created.push(doc);
      }
    }

    res.json({ message: 'Default tools seeded', createdCount: created.length, tools: created });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTools,
  registerTool,
  seedDefaultTools,
};
