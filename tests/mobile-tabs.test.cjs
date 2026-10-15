const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

// Run with node --test tests/mobile-tabs.test.cjs. No browser or packages needed.
const root = path.join(__dirname, '..');
const css = fs.readFileSync(process.env.CSS_UNDER_TEST || path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

// Resolve display for column divs using the actual stylesheet. This deliberately
// supports only this stylesheet's class selectors and max-width media queries;
// it is not a browser/layout engine. Fail loudly on unsupported column rules.
function displayRules(source, maxWidth = Infinity) {
    source = source.replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [];
    let cursor = 0;
    while (cursor < source.length) {
        const open = source.indexOf('{', cursor);
        if (open < 0) break;
        const selector = source.slice(cursor, open).trim();
        let close = open + 1;
        let depth = 1;
        while (depth && close < source.length) {
            if (source[close] === '{') depth++;
            if (source[close] === '}') depth--;
            close++;
        }
        assert.equal(depth, 0, 'Balanced CSS blocks');
        const body = source.slice(open + 1, close - 1);
        cursor = close;
        if (selector.startsWith('@media')) {
            const match = selector.match(/^@media\s*\(max-width:\s*(\d+)px\)$/);
            assert.ok(match, `Unsupported media query: ${selector}`);
            rules.push(...displayRules(body, Math.min(maxWidth, Number(match[1]))));
        } else if (/^@(?:-\w+-)?keyframes\b/.test(selector)) {
            continue;
        } else {
            const declarations = [...body.matchAll(/(?:^|;)\s*display\s*:\s*([^;]+)(?:;|$)/g)];
            for (const part of selector.split(',')) {
                if (!/\.column(?![\w-])/.test(part)) continue;
                for (const declaration of declarations) {
                    assert.match(part.trim(), /^(?:\.[\w-]+)+$/, `Unsupported column display selector: ${part}`);
                    const classes = part.match(/[\w-]+/g);
                    const important = /!important\s*$/.test(declaration[1]);
                    rules.push({ classes, maxWidth, important, value: declaration[1].replace(/\s*!important\s*$/, '').trim() });
                }
            }
        }
    }
    return rules;
}
const rules = displayRules(css);
function display(column, width) {
    let winner;
    for (const rule of rules) {
        if (width > rule.maxWidth || !rule.classes.every(c => column.classList.contains(c))) continue;
        if (!winner || Number(rule.important) > Number(winner.important) ||
            (rule.important === winner.important && rule.classes.length >= winner.classes.length)) winner = rule;
    }
    return winner ? winner.value : 'block'; // HTML div default
}
function element(classNames, dataPath) {
    const classes = new Set(classNames.split(/\s+/));
    const handlers = {};
    return {
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
        getAttribute: name => name === 'data-path' ? dataPath : null,
        addEventListener: (name, handler) => { handlers[name] = handler; },
        click: () => handlers.click(),
    };
}
function initialColumns() {
    return [...html.matchAll(/<div class="(column [^"]+)"/g)].map(m => element(m[1]));
}
function setup(width) {
    const columns = initialColumns();
    const buttons = [...html.matchAll(/<button class="([^"]*tab-button[^"]*)" data-path="([^"]+)"/g)].map(m => element(m[1], m[2]));
    assert.equal(buttons.length, 3);
    assert.ok(columns.length >= 3 && columns.length % 3 === 0);
    const start = script.indexOf('    // Mobile tab switching functionality');
    assert.ok(start >= 0);
    const window = { innerWidth: width, addEventListener() {} };
    vm.runInNewContext(script.slice(start, script.lastIndexOf('});')), {
        window,
        document: { querySelectorAll: selector => selector === '.column' ? columns : selector === '.tab-button' ? buttons : [] },
        setTimeout() {}, clearTimeout() {},
    });
    return { columns, buttons };
}
for (const width of [375, 768, 968, 969, 1280]) {
    test(`initial HTML preserves default column display without JavaScript at ${width}px`, () => {
        const columns = initialColumns();
        assert.equal(columns.length, 18);
        for (const column of columns) {
            assert.equal(display(column, width) !== 'none', width > 968 || column.classList.contains('socialist'));
        }
    });
    test(`column visibility follows tab selection at ${width}px`, () => {
        const { columns, buttons } = setup(width);
        function check(selected) {
            for (const column of columns) {
                const expected = width > 968 || column.classList.contains(selected);
                assert.equal(display(column, width) !== 'none', expected, `Only ${selected} should be visible on mobile`);
            }
        }
        check('socialist');
        for (const index of [1, 2, 0, 2, 1, 1, 0]) {
            buttons[index].click();
            check(buttons[index].getAttribute('data-path'));
        }
    });
}
