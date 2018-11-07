import { environment as defaultEnv } from './default.environment';

export const environment = {
    ...defaultEnv,
    ...{
      serverless: true
    }
  };
