#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
function log(msg) { console.error(msg); }
function doDeploy() {
  const projectPath = process.argv[2] || '.';
  const absPath = path.resolve(projectPath);
  log(`Project path: ${absPath}`);
  log('\n========================================');
  log('Starting deployment...');
  log('========================================\n');
  const args = ['--yes', '--prod'];
  log(`Executing: vercel ${args.join(' ')}\n`);
  try {
    const result = spawnSync('vercel', args, {
      cwd: absPath,
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      timeout: 300000,
      shell: isWindows
    });
    const output = (result.stdout || '') + (result.stderr || '');
    log(output);
    if (result.status !== 0) throw new Error('Deployment failed');
    const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const deploymentMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const previewMatch = output.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/i);
    const finalUrl = aliasedMatch?.[1] || deploymentMatch?.[1] || previewMatch?.[1];
    log('\n========================================');
    log('Deployment successful!');
    log('========================================\n');
    if (finalUrl) {
      log(`Your site is live: ${finalUrl}`);
      console.log(JSON.stringify({ status: 'success', url: finalUrl }));
    } else {
      console.log(JSON.stringify({ status: 'success', message: 'Deployment successful' }));
    }
  } catch (error) {
    log(error.message || '');
    log('\nDeployment failed');
    process.exit(1);
  }
}
doDeploy();
