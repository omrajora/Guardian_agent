/**
 * Weather Tool (Safe / READ / Public)
 */
async function executeWeather(params) {
  const city = params.city || 'San Francisco';
  return {
    city,
    temperatureC: 21,
    temperatureF: 70,
    condition: 'Sunny',
    humidity: 45,
    source: 'public-weather-service',
  };
}

module.exports = {
  id: 'weather_api',
  name: 'Weather Information API',
  category: 'READ',
  sensitivity: 'PUBLIC',
  destinations: ['https://api.weather.internal', 'https://weather.service.net'],
  schema: {
    type: 'object',
    properties: {
      city: { type: 'string' },
    },
    required: ['city'],
  },
  execute: executeWeather,
};
