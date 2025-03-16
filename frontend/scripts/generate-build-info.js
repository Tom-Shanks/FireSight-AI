/**
 * Build Info Generator
 * 
 * This script generates build-time information for debugging purposes.
 * It populates the build-info.json file with current environment values.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicPath = path.resolve(__dirname, '../public');
const buildInfoPath = path.join(publicPath, 'build-info.json');

// Ensure scripts directory exists
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Try to get git information if available
let commitHash = 'unknown';
let branchName = 'unknown';

try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Git info - commit: ${commitHash}, branch: ${branchName}`);
} catch (error) {
  console.log('Unable to get git information. This is normal in Vercel builds.');
}

// Build the info object
const buildInfo = {
  buildTime: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV || 'development',
  commit: commitHash,
  branch: branchName,
  vercel: {
    environment: process.env.VERCEL_ENV || 'local',
    region: process.env.VERCEL_REGION || 'local'
  }
};

// Read existing file if it exists (preserves placeholders in source control)
let existingContent = {};
try {
  if (fs.existsSync(buildInfoPath)) {
    const content = fs.readFileSync(buildInfoPath, 'utf8');
    existingContent = JSON.parse(content);
  }
} catch (error) {
  console.error('Error reading existing build-info.json', error);
}

// Merge with new values and write to file
const newContent = { ...existingContent, ...buildInfo };
fs.writeFileSync(buildInfoPath, JSON.stringify(newContent, null, 2));

console.log(`Build info generated at ${buildInfoPath}`);
console.log(newContent); 