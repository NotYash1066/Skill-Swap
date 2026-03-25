const crypto = require('crypto');

function generateUniqueSuffix() {
  return crypto.randomBytes(8).toString('hex');
}

function testFilenameGeneration() {
  console.log("Testing secure filename suffix generation...");
  const suffixes = new Set();
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    const suffix = generateUniqueSuffix();

    // Check if suffix is 16 characters (8 bytes * 2 hex chars per byte)
    if (suffix.length !== 16) {
      console.error(`Error: Suffix length is ${suffix.length}, expected 16`);
      process.exit(1);
    }

    // Check if suffix is valid hex
    if (!/^[0-9a-f]{16}$/i.test(suffix)) {
      console.error(`Error: Suffix "${suffix}" is not a valid 16-character hex string`);
      process.exit(1);
    }

    // Check for uniqueness
    if (suffixes.has(suffix)) {
      console.error(`Error: Duplicate suffix generated: ${suffix}`);
      process.exit(1);
    }
    suffixes.add(suffix);
  }

  console.log(`Successfully verified ${iterations} unique 16-character hex suffixes.`);
}

try {
  testFilenameGeneration();
} catch (error) {
  console.error("Test failed with error:", error);
  process.exit(1);
}
