import packageJson from '../../package.json';

export const environment = {
    production: false,
    serverless: false,
    appName: 'FoodChain-Lab',
    supportContact: 'foodrisklabs@bfr.bund.de',
    version: packageJson.version,
    lastChange: packageJson.fclConfig.lastChange
};
