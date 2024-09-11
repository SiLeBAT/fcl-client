import { environment as defaultEnv } from "./default.environment";

export const environment = {
    ...defaultEnv,
    ...{
        production: true,
        serverless: true,
    },
};
