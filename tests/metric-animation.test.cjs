const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

// Exercise the production observer and animation with a deterministic frame clock.
// No browser or external packages are required: node --test tests/*.test.cjs
const source = fs.readFileSync(process.env.SCRIPT_UNDER_TEST || path.join(__dirname, '..', 'script.js'), 'utf8');
const start = source.indexOf('    // Add subtle animations to metrics');
const end = source.indexOf('    // Mobile tab switching functionality', start);
assert.ok(start >= 0 && end > start, 'Production metric animation section must exist');

function animate(text) {
    const frames = [];
    const timers = [];
    const span = { textContent: '0' };
    const metric = {
        textContent: text,
        innerHTML: '',
        querySelector: () => span,
    };
    const card = {
        dataset: {},
        querySelector: () => metric,
        querySelectorAll: () => [metric],
    };
    let observeEntries;
    vm.runInNewContext(source.slice(start, end), {
        observerOptions: {},
        performance: { now: () => 0 },
        requestAnimationFrame: callback => frames.push(callback),
        setTimeout: callback => timers.push(callback),
        IntersectionObserver: class {
            constructor(callback) { observeEntries = callback; }
            observe(target) { assert.equal(target, card); }
        },
        document: {
            querySelectorAll: () => [card],
            createElement: () => ({ textContent: '', outerHTML: '<span>0</span>' }),
        },
    });
    observeEntries([{ isIntersecting: true, target: card }]);
    assert.equal(timers.length, 1);
    timers.shift()();
    return {
        tick(time) {
            assert.equal(frames.length, 1);
            frames.shift()(time);
            return metric.innerHTML.replace('<span>0</span>', span.textContent);
        },
        revisit() { observeEntries([{ isIntersecting: true, target: card }]); },
        frames,
        timers,
    };
}

for (const text of ['Gini: 0.55', 'GDP: $1.1 Trillion', 'Population: 8.34M', 'Unemployment: 4.8%', 'GDP Growth: -0.5%', 'GDP Growth: +2.5%', 'Tax Revenue: -$3.2B', 'Rent: $3,500', 'Growth: 15%', 'Rate: 1.10%']) {
    test(`animation restores the original numeric precision: ${text}`, () => {
        const animation = animate(text);
        animation.tick(0);
        animation.tick(500);
        assert.equal(animation.tick(1000), text);
        assert.equal(animation.frames.length, 0, 'Animation stops at its target');
        animation.revisit();
        assert.equal(animation.timers.length, 0, 'Re-entering the viewport does not restart it');
    });
}

test('fractional values retain precision during animation and after a delayed frame', () => {
    const animation = animate('Gini: 0.55');
    assert.equal(animation.tick(0), 'Gini: 0.00');
    assert.equal(animation.tick(500), 'Gini: 0.28');
    assert.equal(animation.tick(1500), 'Gini: 0.55');
    assert.equal(animation.frames.length, 0);
});
