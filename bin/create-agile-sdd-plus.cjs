#!/usr/bin/env node

const { main } = require('../src/index.cjs');

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    const message = error && error.stack ? error.stack : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
