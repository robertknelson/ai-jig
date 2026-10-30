import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseSchemaDoc, parsePageBlocks } from './schema-blocks.mjs';

// browsers fold CRLF to LF when parsing, so the tests read the page the same way
const page = readFileSync(new URL('../jigs/c-rexx.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const schemaDoc = readFileSync(new URL('../.docs/jigs/c-rexx/schema.md', import.meta.url), 'utf8');
const schema = parseSchemaDoc(schemaDoc);
const blocks = parsePageBlocks(page);

const catalogKeys = [...page.matchAll(/^\s*\{ code: '[A-H]\d?', key: '(\w+)'/gm)].map(m => m[1]);

function textBlock(id) {
    const match = page.match(new RegExp(`<script type="text/plain" id="${id}">\\n([\\s\\S]*?)\\n</script>`));
    return match[1];
}

function sampleReport() {
    const script = page.match(/<script>\n'use strict';\n\/\* =+\n   Sample reply([\s\S]*?)<\/script>/)[1];
    const context = {};
    vm.runInNewContext(`/*${script}; this.SAMPLE_REPORT = SAMPLE_REPORT;`, context);
    return context.SAMPLE_REPORT;
}

test('every schema.md skeleton is carried verbatim by the page', () => {
    assert.equal(blocks.shared, schema.shared);
    assert.equal(blocks.envelope, schema.envelope);
    for (const [key, skeleton] of Object.entries(schema.modules)) {
        assert.equal(blocks[key], skeleton, `skel-${key} differs from schema.md`);
    }
});

test('the catalog, the schema, and the page blocks name the same modules in the same order', () => {
    assert.deepEqual(catalogKeys, Object.keys(schema.modules));
    const pageModuleBlocks = Object.keys(blocks).filter(k => k !== 'shared' && k !== 'envelope');
    assert.deepEqual(pageModuleBlocks, catalogKeys);
});

test('the envelope still has the slot the page fills with module fragments', () => {
    assert.ok(schema.envelope.includes('"<module key>": { ... one fragment per requested module, below ... }'));
});

test('every lens names only catalog modules', () => {
    const lensBlock = page.match(/const LENSES = \[([\s\S]*?)\n\];/)[1];
    for (const match of lensBlock.matchAll(/keys: \[([^\]]*)\]/g)) {
        for (const key of match[1].matchAll(/'(\w+)'/g)) {
            assert.ok(catalogKeys.includes(key[1]), `lens names unknown module ${key[1]}`);
        }
    }
});

test('the sample runs only catalog modules and returns every one it lists', () => {
    const sample = sampleReport();
    for (const key of sample.heuristics_run) assert.ok(catalogKeys.includes(key), key);
    assert.deepEqual(Object.keys(sample.modules).sort(), [...sample.heuristics_run].sort());
});

test('every sample quote is found at the line it cites', () => {
    const lines = textBlock('sample-source').split('\n');
    const normal = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
    const sample = sampleReport();
    assert.equal(sample.coverage.files[0].lines_seen, lines.length);
    let count = 0;
    const visit = (node) => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!node || typeof node !== 'object') return;
        if (typeof node.quote === 'string') {
            count++;
            const [from, to] = String(node.lines).split('-').map(Number);
            const window = lines.slice(from - 1, (to || from)).map(normal);
            assert.ok(window.some(l => l.includes(normal(node.quote))),
                `"${node.quote}" is not on line ${node.lines}`);
        }
        Object.values(node).forEach(visit);
    };
    visit(sample.modules);
    assert.ok(count > 30, `only ${count} citations checked`);
});
