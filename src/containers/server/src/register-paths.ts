// Register module aliases for runtime path resolution
import * as path from 'path';
import * as fs from 'fs';
import { addAliases } from 'module-alias';

// Locations to check for the common directory
const possibleCommonPaths = [
  path.join(__dirname, '../../src/common'),  // Production path after tsc compilation
  path.join(__dirname, '../src/common'),     // Alternative path
  path.join(__dirname, '../common'),         // Another alternative
  '/app/src/common'                          // Docker container mounted volume path
];

// Find the first path that exists
let commonPath = possibleCommonPaths.find(p => fs.existsSync(p));

if (!commonPath) {
  console.error('ERROR: Could not find common directory in any of the following paths:');
  possibleCommonPaths.forEach(p => console.error(`- ${p}`));
  commonPath = possibleCommonPaths[0]; // Use the first path as fallback
}

// Register path aliases
addAliases({
  '@common': commonPath,
});

// Print debug info
console.log('Module aliases registered:');
console.log('- @common path:', commonPath);
console.log('- Current directory:', __dirname);
console.log('- Files in @common:', fs.existsSync(commonPath)
  ? fs.readdirSync(commonPath).join(', ')
  : 'Directory not found'); 