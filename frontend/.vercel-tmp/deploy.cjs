#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const projectPath = path.resolve(__dirname, '..');

const result = spawnSync('vercel', ['--yes', '--prod'], {
  cwd: projectPath,
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'pipe'],
  timeout: 300000,
  shell: true
});
const output = (result.stdout || '') + (result.stderr || '');
console.error(output);
if (result.status !== 0) {
  console.error('Deployment failed');
  process.exit(1);
}
const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
const deploymentMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
const finalUrl = aliasedMatch?.[1] || deploymentMatch?.[1];
if (finalUrl) {
  console.error(`Deployed to: ${finalUrl}`);
  console.log(JSON.stringify({ status: 'success', url: finalUrl }));
}
