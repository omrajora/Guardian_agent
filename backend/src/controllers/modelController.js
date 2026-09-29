const ModelVersion = require('../models/ModelVersion');

async function listModels(req, res, next) {
  try {
    const models = await ModelVersion.find().sort({ createdAt: -1 });
    res.json({ count: models.length, models });
  } catch (err) {
    next(err);
  }
}

async function registerModel(req, res, next) {
  try {
    const model = await ModelVersion.create(req.body);
    res.status(201).json({ message: 'Model registered successfully', model });
  } catch (err) {
    next(err);
  }
}

async function activateModel(req, res, next) {
  try {
    const { version } = req.params;
    await ModelVersion.updateMany({}, { active: false });
    const active = await ModelVersion.findOneAndUpdate({ version }, { active: true }, { new: true });
    if (!active) {
      return res.status(404).json({ error: 'Not Found', message: `Model version '${version}' not found` });
    }
    res.json({ message: `Model version '${version}' is now active`, model: active });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listModels,
  registerModel,
  activateModel,
};
