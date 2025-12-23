
function formatPhoneNumber(phone: string): string {
    // 1. Remove all non-numeric characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // 2. if starts with +, return as is (assume already E.164)
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // 3. if starts with 0, remove it and prepend +234
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // 4. prepend +234 (default to Nigeria if no country code)
    return `+234${cleaned}`;
}

const testCases = [
    { input: '08012345678', expected: '+2348012345678' },
    { input: '09012345678', expected: '+2349012345678' },
    { input: '+2348012345678', expected: '+2348012345678' }, // Already formatted
    { input: '8012345678', expected: '+2348012345678' },   // Missing 0
    { input: '0915916XXXX', expected: '+234915916XXXX' }   // The user's specific case (ignoring the X's which are placeholders but verifying the prefix logic)
];

console.log('Running Phone Number Formatting Tests...');
let passed = 0;
testCases.forEach(({ input, expected }) => {
    const result = formatPhoneNumber(input);
    if (result === expected) {
        console.log(`✅ Passed: ${input} -> ${result}`);
        passed++;
    } else {
        console.error(`❌ Failed: ${input} -> Expected ${expected}, got ${result}`);
    }
});

if (passed === testCases.length) {
    console.log('\nAll tests passed!');
} else {
    console.error(`\n${testCases.length - passed} tests failed.`);
    process.exit(1);
}
