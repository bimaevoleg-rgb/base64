/**
 * Automated tests for Base64 encode/decode functions.
 * Run: node test_cli.js
 */

// ======================== CORE FUNCTIONS ========================

function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function decodeBase64(base64) {
  const clean = base64.replace(/\s/g, '');
  return Buffer.from(clean, 'base64').toString('utf8');
}

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
  const clean = base64.replace(/\s/g, '');
  return Buffer.from(clean, 'base64');
}

function isValidBase64(str) {
  const clean = str.replace(/\s/g, '');
  if (clean.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return false;
  return true;
}

const MIME_SIGNATURES = [
  { bytes: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png', ext: 'png' },
  { bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', ext: 'jpg' },
  { bytes: [0x47, 0x49, 0x46], mime: 'image/gif', ext: 'gif' },
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', ext: 'pdf' },
  { bytes: [0x50, 0x4B, 0x03, 0x04], mime: 'application/zip', ext: 'zip' },
];

function detectMimeType(bytes) {
  for (const sig of MIME_SIGNATURES) {
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[i] !== sig.bytes[i]) { match = false; break; }
    }
    if (match) return sig;
  }
  return null;
}

// ======================== TEST DEFINITIONS ========================

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// --- Encode: Text → Base64 ---
test('Encode: ASCII текст', () => {
  const input = 'Hello, World!';
  const expected = 'SGVsbG8sIFdvcmxkIQ==';
  const result = encodeBase64(input);
  assert(result === expected, `Expected "${expected}", got "${result}"`);
});

test('Encode: Кириллица (UTF-8)', () => {
  const input = 'Привет, мир!';
  const expected = '0J/RgNC40LLQtdGCLCDQvNC40YAh';
  const result = encodeBase64(input);
  assert(result === expected, `Expected "${expected}", got "${result}"`);
});

test('Encode: Эмодзи (round-trip)', () => {
  const input = '🚀🔥✅';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Round-trip failed: "${input}" → "${decoded}"`);
});

test('Encode: Пустая строка', () => {
  const result = encodeBase64('');
  assert(result === '', `Expected empty string, got "${result}"`);
});

test('Encode: Специальные символы (round-trip)', () => {
  const input = '<div class="test">&nbsp;</div>';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Round-trip failed`);
});

test('Encode: Переносы строк и табуляция (round-trip)', () => {
  const input = 'line1\nline2\r\nline3\ttab';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Round-trip failed`);
});

test('Encode: Длинный текст 10 KB (round-trip)', () => {
  const input = 'A'.repeat(10240);
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Round-trip failed for 10KB`);
});

test('Encode: Китайские иероглифы (round-trip)', () => {
  const input = '你好世界';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Round-trip failed: "${input}" → "${decoded}"`);
});

test('Encode: JSON (round-trip)', () => {
  const input = JSON.stringify({ name: 'Тест', value: 42, tags: ['a','b'] });
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `JSON round-trip failed`);
});

// --- Decode: Base64 → Text ---
test('Decode: Стандартный Base64', () => {
  const input = 'SGVsbG8sIFdvcmxkIQ==';
  const expected = 'Hello, World!';
  const result = decodeBase64(input);
  assert(result === expected, `Expected "${expected}", got "${result}"`);
});

test('Decode: Base64 с пробелами', () => {
  const input = 'SGVs bG8s I Fdv cmx kIQ==';
  const expected = 'Hello, World!';
  const result = decodeBase64(input);
  assert(result === expected, `Expected "${expected}", got "${result}"`);
});

test('Decode: Кириллица', () => {
  const input = '0J/RgNC40LLQtdGCLCDQvNC40YAh';
  const expected = 'Привет, мир!';
  const result = decodeBase64(input);
  assert(result === expected, `Expected "${expected}", got "${result}"`);
});

test('Decode: Без padding (длина не кратна 4)', () => {
  try {
    decodeBase64('SGVsbG8');
  } catch (e) {
    return; // expected
  }
  // Node.js Buffer doesn't throw, pads automatically — that's fine
  const result = decodeBase64('SGVsbG8');
  assert(result === 'Hello', `Expected "Hello", got "${result}"`);
});

test('Decode: Некорректный символ @', () => {
  try {
    const result = decodeBase64('SGVsbG8s@FdvcmxkIQ==');
    // If it doesn't throw, check the result is not the original
    assert(result !== 'Hello, World!', `Should not decode correctly with @`);
  } catch (e) {
    return; // also acceptable
  }
});

// --- Round-trip ---
test('Round-trip: Полный текст с кириллицей и эмодзи', () => {
  const original = 'Тестирование Base64 конвертера! 12345 🔐';
  const encoded = encodeBase64(original);
  const decoded = decodeBase64(encoded);
  assert(decoded === original, `Round-trip failed`);
});

test('Round-trip: Все printable ASCII', () => {
  const original = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  const encoded = encodeBase64(original);
  const decoded = decodeBase64(encoded);
  assert(decoded === original, `ASCII round-trip failed`);
});

// --- Validation ---
test('Validation: Корректный Base64', () => {
  assert(isValidBase64('SGVsbG8=') === true, `Should be valid`);
});

test('Validation: Некорректный символ @', () => {
  assert(isValidBase64('SGVsbG8@') === false, `Should be invalid`);
});

test('Validation: Неверная длина', () => {
  assert(isValidBase64('SGV') === false, `Should be invalid (length not % 4)`);
});

test('Validation: Пустая строка', () => {
  assert(isValidBase64('') === true, `Empty string should be valid`);
});

// --- ArrayBuffer round-trip ---
test('ArrayBuffer Round-trip: Бинарные данные', () => {
  const original = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD, 0x89, 0x50, 0x4E, 0x47]);
  const b64 = arrayBufferToBase64(original);
  const restored = base64ToArrayBuffer(b64);
  assert(original.equals(restored), `Binary round-trip failed`);
});

test('ArrayBuffer Round-trip: 1 KB случайных данных', () => {
  const original = Buffer.alloc(1024);
  for (let i = 0; i < 1024; i++) original[i] = Math.floor(Math.random() * 256);
  const b64 = arrayBufferToBase64(original);
  const restored = base64ToArrayBuffer(b64);
  assert(original.equals(restored), `1KB random round-trip failed`);
});

test('ArrayBuffer: PNG magic bytes detection', () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const b64 = arrayBufferToBase64(pngHeader);
  const restored = base64ToArrayBuffer(b64);
  const detected = detectMimeType(restored);
  assert(detected && detected.mime === 'image/png', `PNG detection failed, got: ${detected?.mime}`);
});

test('ArrayBuffer: JPEG magic bytes detection', () => {
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
  const b64 = arrayBufferToBase64(jpegHeader);
  const restored = base64ToArrayBuffer(b64);
  const detected = detectMimeType(restored);
  assert(detected && detected.mime === 'image/jpeg', `JPEG detection failed, got: ${detected?.mime}`);
});

test('ArrayBuffer: PDF magic bytes detection', () => {
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
  const b64 = arrayBufferToBase64(pdfHeader);
  const restored = base64ToArrayBuffer(b64);
  const detected = detectMimeType(restored);
  assert(detected && detected.mime === 'application/pdf', `PDF detection failed, got: ${detected?.mime}`);
});

// --- Format checks ---
test('Format: Base64 содержит только допустимые символы', () => {
  const result = encodeBase64('Test 123! Привет 🎉');
  assert(/^[A-Za-z0-9+/]*={0,2}$/.test(result), `Invalid chars in result: "${result}"`);
});

test('Format: Длина Base64 кратна 4', () => {
  const inputs = ['A', 'AB', 'ABC', 'ABCD', 'Hello, World! 123', 'Привет мир'];
  const allValid = inputs.every(s => encodeBase64(s).length % 4 === 0);
  assert(allValid, `Not all Base64 strings have length % 4 === 0`);
});

test('Overhead: Base64 ~33% больше оригинала', () => {
  const input = 'Hello, World! This is a test string for size overhead check.';
  const b64 = encodeBase64(input);
  const overhead = (b64.length / input.length - 1) * 100;
  assert(overhead >= 30 && overhead <= 40, `Overhead should be ~33%, got ${overhead.toFixed(1)}%`);
});

// --- Edge cases ---
test('Edge: Один символ', () => {
  const input = 'A';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Single char round-trip failed`);
});

test('Edge: Два символа', () => {
  const input = 'AB';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Two char round-trip failed`);
});

test('Edge: Три символа', () => {
  const input = 'ABC';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Three char round-trip failed`);
});

test('Edge: Четыре символа', () => {
  const input = 'ABCD';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Four char round-trip failed`);
});

test('Edge: Null byte', () => {
  const input = '\x00';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Null byte round-trip failed`);
});

test('Edge: Все control chars (0x00-0x1F)', () => {
  const input = Array.from({length: 32}, (_, i) => String.fromCharCode(i)).join('');
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Control chars round-trip failed`);
});

test('Edge: Unicode surrogate pairs', () => {
  const input = '𝄞𝄞𝄞'; // U+1D11E (musical symbol)
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `Surrogate pair round-trip failed`);
});

test('Edge: Zero-width joiner sequence (👨‍👩‍👧‍👦)', () => {
  const input = '👨‍👩‍👧‍👦';
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  assert(decoded === input, `ZWJ sequence round-trip failed`);
});

// --- Large data ---
test('Performance: 100 KB текст', () => {
  const input = 'X'.repeat(100 * 1024);
  const start = Date.now();
  const encoded = encodeBase64(input);
  const decoded = decodeBase64(encoded);
  const elapsed = Date.now() - start;
  assert(decoded === input, `100KB round-trip failed`);
  assert(elapsed < 1000, `100KB took too long: ${elapsed}ms`);
});

test('Performance: 1 MB бинарные данные', () => {
  const input = Buffer.alloc(1024 * 1024, 0xAB);
  const start = Date.now();
  const b64 = input.toString('base64');
  const restored = Buffer.from(b64, 'base64');
  const elapsed = Date.now() - start;
  assert(input.equals(restored), `1MB binary round-trip failed`);
  assert(elapsed < 1000, `1MB took too long: ${elapsed}ms`);
});

// ======================== ASSERTION ========================

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ======================== RUN ========================

console.log('\n' + '='.repeat(60));
console.log('  BASE64 AUTOMATED TESTS');
console.log('='.repeat(60) + '\n');

for (const { name, fn } of tests) {
  try {
    fn();
    passed++;
    console.log(`  ✅  ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌  ${name}`);
    console.log(`      Error: ${e.message}`);
  }
}

console.log('\n' + '-'.repeat(60));
console.log(`  TOTAL: ${tests.length} | ✅ PASSED: ${passed} | ❌ FAILED: ${failed}`);
console.log('-'.repeat(60) + '\n');

if (failures.length > 0) {
  console.log('FAILURES:');
  for (const f of failures) {
    console.log(`  ❌ ${f.name}: ${f.error}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
}
