#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates all required environment variables and configurations
 */

console.log('🔍 Validating configuration...\n');

const errors = [];
const warnings = [];

// Check required environment variables
if (!process.env.FAL_KEY) {
    errors.push('❌ FAL_KEY is required (get it from https://fal.ai/dashboard/keys)');
} else {
    console.log('✅ FAL_KEY is configured');
}

// Check optional but recommended configurations
if (!process.env.AUTH_PASSWORD) {
    warnings.push('⚠️  AUTH_PASSWORD not set - web interface will be publicly accessible');
} else {
    console.log('✅ AUTH_PASSWORD is configured');
}

// Check Lsky Pro configuration
if (process.env.LSKY_URL && !process.env.LSKY_TOKEN) {
    warnings.push('⚠️  LSKY_URL set but LSKY_TOKEN missing - image hosting will not work');
} else if (process.env.LSKY_URL && process.env.LSKY_TOKEN) {
    console.log('✅ Lsky Pro is configured');
}

// Validate PORT
const port = parseInt(process.env.PORT || '8787', 10);
if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`❌ Invalid PORT: ${port} (must be 1-65535)`);
} else {
    console.log(`✅ PORT is valid: ${port}`);
}

// Validate request timeout
const timeout = parseInt(process.env.REQUEST_TIMEOUT || '120000', 10);
if (isNaN(timeout) || timeout < 1000) {
    warnings.push(`⚠️  REQUEST_TIMEOUT is too low: ${timeout}ms (recommended: >= 1000ms)`);
} else {
    console.log(`✅ REQUEST_TIMEOUT is valid: ${timeout}ms`);
}

// Validate max bulk requests
const maxBulk = parseInt(process.env.MAX_BULK_REQUESTS || '5', 10);
if (isNaN(maxBulk) || maxBulk < 1 || maxBulk > 10) {
    warnings.push(`⚠️  MAX_BULK_REQUESTS out of range: ${maxBulk} (recommended: 1-10)`);
} else {
    console.log(`✅ MAX_BULK_REQUESTS is valid: ${maxBulk}`);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (majorVersion < 18) {
    errors.push(`❌ Node.js version ${nodeVersion} is not supported (requires >= 18.0.0)`);
} else {
    console.log(`✅ Node.js version is supported: ${nodeVersion}`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length > 0) {
    console.log('\n❌ VALIDATION FAILED\n');
    errors.forEach(error => console.log(error));
    console.log('\nPlease fix these errors before starting the server.');
    process.exit(1);
}

if (warnings.length > 0) {
    console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS\n');
    warnings.forEach(warning => console.log(warning));
    console.log('\n✅ Server can start, but review warnings for best results.');
} else {
    console.log('\n✅ VALIDATION PASSED - All checks successful!\n');
}

process.exit(0);
