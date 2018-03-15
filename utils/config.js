import fs from 'fs-extra';
import path from 'path';

export const packages = fs.readdirSync(path.join(__dirname, '../..'));
