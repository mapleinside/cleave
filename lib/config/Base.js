import fs from 'fs';
import path from 'path';

// eslint-disable-next-line import/prefer-default-export
export const packages = fs.readdirSync(path.join(__dirname, '../..'));
