const appJson = require('./app.json');

const trimTrailingSlash = (value) => value.replace(/\/$/, '');

module.exports = () => {
  const config = { ...appJson.expo };
  const webBasePath = process.env.EXPO_PUBLIC_WEB_BASE_PATH?.trim();

  if (webBasePath) {
    config.experiments = {
      ...config.experiments,
      baseUrl: trimTrailingSlash(webBasePath),
    };
  }

  return config;
};
