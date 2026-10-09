/**
 * category-map tests — the kebab↔snake mapping (TRD §3, WAVE2 brief).
 *
 * Run: node --test tests/   (see tests/README.md)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { registerTsResolver } from './ts-resolver.mjs';
registerTsResolver();

const { CATEGORIES, REGIONS, toSnake, toKebab, isCategoryKebab, isCategorySnake, isRegion } =
  await import('../src/lib/category-map.ts');

test('there are exactly ten categories, in navigation order', () => {
  assert.equal(CATEGORIES.length, 10);
  const kebabs = CATEGORIES.map((c) => c.kebab);
  assert.deepEqual(kebabs, [
    'jobs',
    'remote',
    'hackathons',
    'grants',
    'accelerators',
    'visas',
    'scholarships',
    'internships',
    'ai-credits',
    'student-deals',
  ]);
});

test('every kebab maps to its snake value and back', () => {
  const expected: Record<string, string> = {
    jobs: 'jobs',
    remote: 'remote',
    hackathons: 'hackathons',
    grants: 'grants',
    accelerators: 'accelerators',
    visas: 'visas',
    scholarships: 'scholarships',
    internships: 'internships',
    'ai-credits': 'ai_credits',
    'student-deals': 'student_deals',
  };
  for (const category of CATEGORIES) {
    assert.equal(toSnake(category.kebab), expected[category.kebab]);
    assert.equal(toKebab(category.snake), category.kebab);
  }
});

test('the two hyphenated categories round-trip both directions', () => {
  assert.equal(toSnake('ai-credits'), 'ai_credits');
  assert.equal(toKebab('ai_credits'), 'ai-credits');
  assert.equal(toSnake('student-deals'), 'student_deals');
  assert.equal(toKebab('student_deals'), 'student-deals');
});

test('the snake forms the API must REJECT are not accepted as kebab', () => {
  assert.equal(isCategoryKebab('ai_credits'), false);
  assert.equal(isCategoryKebab('student_deals'), false);
  assert.equal(toSnake('ai_credits'), null);
  assert.equal(toSnake('student_deals'), null);
});

test('unknown and malformed category values are rejected', () => {
  for (const bad of ['fellowships', 'AI-CREDITS', 'Ai-credits', 'ai credits', ' ai-credits', '', 'jobs ', 'deals']) {
    assert.equal(isCategoryKebab(bad), false, `isCategoryKebab(${JSON.stringify(bad)}) must be false`);
    assert.equal(toSnake(bad), null, `toSnake(${JSON.stringify(bad)}) must be null`);
  }
});

test('isCategorySnake accepts the database forms', () => {
  assert.equal(isCategorySnake('ai_credits'), true);
  assert.equal(isCategorySnake('student_deals'), true);
  assert.equal(isCategorySnake('jobs'), true);
  assert.equal(isCategorySnake('ai-credits'), false);
  assert.equal(isCategorySnake('nonsense'), false);
  assert.equal(isCategorySnake(undefined), false);
});

test('toKebab passes unknown snake values through unchanged', () => {
  assert.equal(toKebab('unknown_value'), 'unknown_value');
});

test('REGIONS is exactly nigeria, africa, global — the Nigeria-first order', () => {
  assert.deepEqual([...REGIONS], ['nigeria', 'africa', 'global']);
});

test('isRegion accepts the three regions and nothing else', () => {
  for (const region of REGIONS) assert.equal(isRegion(region), true);
  for (const bad of ['europe', 'Nigeria', 'NIGERIA', ' global', '', 'naija', undefined, null, 42]) {
    assert.equal(isRegion(bad), false, `isRegion(${JSON.stringify(bad)}) must be false`);
  }
});
