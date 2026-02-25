import { bold, fmt, italic } from "telegraf/format";

const keyMsg = fmt`
${bold`Before we get started...`}

${italic`Please ensure you have enabled API access on your Binance account and have the api restriction set to Enable Reading only`}

${bold`Enter your Binance account API Key`}
`;

const secretMsg = fmt`
${bold`Enter the secret key associated with the provided api key`}`;

const typeMsg = fmt`
${bold`Select the type of Binance account you want to add`}

${italic`Choose whether this account is for Spot trading, Futures trading, or both`}
`;

export { keyMsg, secretMsg, typeMsg };
