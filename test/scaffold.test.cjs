const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const { scaffold, parseArgs, isDirectoryEmpty, collectTemplateFiles } = require('../src/index.cjs');
const { parsePlatformsOption, PLATFORMS } = require('../src/platforms.cjs');
const { decideWrite, parseRoadmapStatuses } = require('../hooks/sdd-guard.cjs');
const ROOT = path.resolve(__dirname, '..');

function runNode(args, options = {}) {
  return childProcess.execFileSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
}

function runNpm(args, options = {}) {
  const npmExecPath = process.env.npm_execpath;

  const cacheDir = path.join(os.tmpdir(), 'agile-sdd-npm-cache');
  fs.mkdirSync(cacheDir, { recursive: true });

  if (npmExecPath) {
    return childProcess.execFileSync(process.execPath, [npmExecPath, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
      env: {
        ...process.env,
        npm_config_cache: cacheDir,
        npm_config_tmp: path.join(os.tmpdir(), 'agile-sdd-npm-tmp'),
        ...(options.env || {})
      }
    });
  }

  const fallbackCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const fallbackArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args;

  return childProcess.execFileSync(fallbackCommand, fallbackArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
    env: {
      ...process.env,
      npm_config_cache: cacheDir,
      npm_config_tmp: path.join(os.tmpdir(), 'agile-sdd-npm-tmp'),
      ...(options.env || {})
    }
  });
}

test('parseArgs reads flags and target dir', () => {
  const parsed = parseArgs(['my-project', '--force', '--yes', '--no-skills', '--skills', 'none', '--platforms', 'claude']);
  assert.strictEqual(parsed.targetDir, 'my-project');
  assert.strictEqual(parsed.force, true);
  assert.strictEqual(parsed.yes, true);
  assert.strictEqual(parsed.noSkills, true);
  assert.strictEqual(parsed.skillsOption, 'none');
  assert.strictEqual(parsed.sawTarget, true);
  assert.strictEqual(parsed.platformsOption, 'claude');
});

test('scaffold writes the expected base files', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-'));

  try {
    const result = await scaffold(tempDir);
    const templateFiles = collectTemplateFiles(path.join(ROOT, 'templates', 'base'));
    const templateResults = result.results.filter((item) => !item.generated);
    assert.strictEqual(templateResults.length, templateFiles.length);
    assert.deepStrictEqual(result.skillModes, {
      'grill-me': 'auto',
      'zoom-out': 'manual',
      tdd: 'manual',
      review: 'auto',
      debugging: 'manual'
    });
    assert.deepStrictEqual(result.platforms, PLATFORMS);

    for (const relativePath of [
      'AGENTS.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'specs/SPECS.md',
      'specs/EPIC0/EPIC0.md',
      'specs/EPIC0/PLAN.md',
      'specs/EPIC0/TASKS.md',
      'skills/README.md',
      'skills/grill-me/SKILL.md',
      'skills/tdd/SKILL.md',
      'skills/zoom-out/SKILL.md',
      'skills/review/SKILL.md',
      'skills/review/catalogs/README.md',
      'skills/review/catalogs/java.md',
      'docs/METHODOLOGY.md',
      'specs/CAPABILITIES.md',
      'CLAUDE.md',
      '.claude/commands/sdd.md',
      '.claude/agents/sdd-reviewer.md',
      '.agent/workflows/sdd-review.md',
      '.opencode/commands/grillme.md',
      '.claude/settings.json',
      '.claude/hooks/sdd-guard.cjs'
    ]) {
      assert.ok(fs.existsSync(path.join(tempDir, relativePath)), `${relativePath} should exist`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('scaffold keeps grill-me when optional skills are disabled', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-no-skills-'));

  try {
    const result = await scaffold(tempDir, {
      skillModes: { 'grill-me': 'none', 'zoom-out': 'none', tdd: 'none', review: 'none', debugging: 'none' },
      platforms: ['claude']
    });

    assert.ok(fs.existsSync(path.join(tempDir, 'skills/README.md')), 'skills/README.md should exist');
    assert.ok(fs.existsSync(path.join(tempDir, 'skills/grill-me/SKILL.md')), 'grill-me should exist');
    assert.ok(!fs.existsSync(path.join(tempDir, 'skills/tdd/SKILL.md')), 'tdd should not exist');
    assert.ok(!fs.existsSync(path.join(tempDir, 'skills/zoom-out/SKILL.md')), 'zoom-out should not exist');
    assert.ok(!fs.existsSync(path.join(tempDir, 'skills/review')), 'review and its catalogs should not exist');
    assert.ok(!fs.existsSync(path.join(tempDir, '.claude/agents/sdd-reviewer.md')), 'no reviewer agent without the review skill');
    assert.ok(!fs.existsSync(path.join(tempDir, '.claude/commands/sdd-review.md')), 'no review command without the review skill');
    assert.ok(fs.existsSync(path.join(tempDir, '.claude/commands/grillme.md')), 'grill-me command is always installed');

    assert.deepStrictEqual(result.skillModes, {
      'grill-me': 'auto',
      'zoom-out': 'none',
      tdd: 'none',
      review: 'none',
      debugging: 'none'
    });

    const templateSkillFiles = collectTemplateFiles(path.join(ROOT, 'templates', 'base')).filter((file) => file.startsWith('skills'));
    const skippedSkills = result.results.filter((item) => item.status === 'skipped' && item.file.startsWith('skills'));
    // Everything under skills/ except README.md and grill-me is skipped.
    assert.strictEqual(skippedSkills.length, templateSkillFiles.length - 2);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('isDirectoryEmpty detects empty and populated directories', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-empty-'));

  try {
    assert.strictEqual(isDirectoryEmpty(tempDir), true);
    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'x', 'utf8');
    assert.strictEqual(isDirectoryEmpty(tempDir), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('packaged CLI can scaffold a target project', () => {
  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-pack-'));
  const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-install-'));
  const scaffoldDir = path.join(installDir, 'scaffold-target');

  try {
    const packOutput = runNpm(['pack', '--json', '--pack-destination', packDir]);
    const packInfo = JSON.parse(packOutput)[0];
    const tarballPath = path.join(packDir, packInfo.filename);

    runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], { cwd: installDir });
    runNode([
      path.join(installDir, 'node_modules', 'create-agile-sdd-plus', 'bin', 'create-agile-sdd-plus.cjs'),
      scaffoldDir
    ]);

    for (const relativePath of [
      'AGENTS.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'specs/SPECS.md',
      'specs/EPIC0/EPIC0.md',
      'specs/EPIC0/PLAN.md',
      'specs/EPIC0/TASKS.md',
      'skills/README.md',
      'skills/grill-me/SKILL.md',
      'skills/tdd/SKILL.md',
      'skills/zoom-out/SKILL.md',
      'skills/review/SKILL.md',
      'skills/review/catalogs/README.md',
      'skills/review/catalogs/java.md',
      'docs/METHODOLOGY.md',
      'specs/CAPABILITIES.md',
      'CLAUDE.md',
      '.claude/commands/sdd.md',
      '.claude/agents/sdd-reviewer.md',
      '.agent/workflows/sdd-review.md',
      '.opencode/commands/grillme.md',
      '.claude/settings.json',
      '.claude/hooks/sdd-guard.cjs'
    ]) {
      assert.ok(fs.existsSync(path.join(scaffoldDir, relativePath)), `${relativePath} should exist in packaged scaffold`);
    }
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installDir, { recursive: true, force: true });
  }
});

test('platform selection only generates the chosen adapters', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-platforms-'));

  try {
    const result = await scaffold(tempDir, { platforms: ['antigravity'] });

    assert.deepStrictEqual(result.platforms, ['antigravity']);
    assert.ok(fs.existsSync(path.join(tempDir, '.agent/workflows/sdd.md')));
    assert.ok(fs.existsSync(path.join(tempDir, '.agent/agents/sdd-reviewer.md')));
    assert.ok(!fs.existsSync(path.join(tempDir, '.claude')), 'no Claude Code files');
    assert.ok(!fs.existsSync(path.join(tempDir, '.opencode')), 'no OpenCode files');
    assert.ok(!fs.existsSync(path.join(tempDir, 'CLAUDE.md')), 'CLAUDE.md belongs to the Claude Code platform');

    // A malformed workflow frontmatter can break every slash command in Antigravity: keep it to `description` only.
    for (const file of fs.readdirSync(path.join(tempDir, '.agent/workflows'))) {
      const content = fs.readFileSync(path.join(tempDir, '.agent/workflows', file), 'utf8');
      const frontmatter = content.split('---')[1].trim().split('\n');
      assert.strictEqual(frontmatter.length, 1, `${file} should only declare description`);
      assert.ok(frontmatter[0].startsWith('description: '));
      assert.ok(!content.includes('$ARGUMENTS'), `${file} should not use a placeholder Antigravity does not support`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('parsePlatformsOption accepts lists, all and none, and rejects unknown names', () => {
  assert.deepStrictEqual(parsePlatformsOption('opencode,claude'), ['claude', 'opencode']);
  assert.deepStrictEqual(parsePlatformsOption('all'), PLATFORMS);
  assert.deepStrictEqual(parsePlatformsOption('none'), []);
  assert.strictEqual(parsePlatformsOption(null), null);
  assert.throws(() => parsePlatformsOption('vscode'), /Unknown platform/);
});

test('existing files are never overwritten without --force', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-existing-'));

  try {
    fs.writeFileSync(path.join(tempDir, 'CLAUDE.md'), 'my own rules', 'utf8');
    await scaffold(tempDir, { platforms: ['claude'] });
    assert.strictEqual(fs.readFileSync(path.join(tempDir, 'CLAUDE.md'), 'utf8'), 'my own rules');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('every doc path referenced by the scaffold exists in the scaffold', () => {
  const base = path.join(ROOT, 'templates', 'base');
  const files = collectTemplateFiles(base).filter((file) => file.endsWith('.md') && !file.includes('catalogs'));
  const missing = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(base, file), 'utf8');
    for (const match of content.matchAll(/`((?:docs|specs|skills)\/[A-Za-z0-9_\-/]+\.md)`/g)) {
      const referenced = match[1];
      // Per-epic placeholders (EPICX) and files created during the workflow are not shipped.
      if (referenced.includes('EPICX') || referenced.endsWith('REVIEW.md')) {
        continue;
      }
      if (!fs.existsSync(path.join(base, referenced))) {
        missing.push(`${file} -> ${referenced}`);
      }
    }
  }

  assert.deepStrictEqual(missing, []);
});

test('audit catalogs declare a valid axis and only compose with existing catalogs', () => {
  const dir = path.join(ROOT, 'templates', 'base', 'skills', 'review', 'catalogs');
  const catalogs = fs.readdirSync(dir).filter((file) => file.endsWith('.md') && file !== 'README.md');
  const names = new Set(catalogs.map((file) => file.replace(/\.md$/, '')));

  for (const file of catalogs) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n');
    const frontmatter = content.split('---')[1];
    const name = /^name: (.+)$/m.exec(frontmatter)[1].trim();
    const axis = /^axis: (.+)$/m.exec(frontmatter)[1].trim();
    const composes = /^composes_with: \[(.*)\]$/m.exec(frontmatter)[1].split(',').map((item) => item.trim()).filter(Boolean);

    assert.strictEqual(`${name}.md`, file, `${file} name should match its file name`);
    assert.ok(['language', 'framework', 'template'].includes(axis), `${file} has an invalid axis`);
    for (const dependency of composes) {
      assert.ok(names.has(dependency), `${file} composes with unknown catalog ${dependency}`);
    }

    const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
    assert.ok(readme.includes(`\`${name}\``), `${file} should be listed in the coverage table of catalogs/README.md`);
  }
});

test('no scaffold file is excluded by the repository .gitignore', () => {
  // The Visual Studio .gitignore of this repo ignores folders such as Debug/ and Release/:
  // a template inside one of them would be packaged by npm but never committed.
  let output = '';
  try {
    output = childProcess.execFileSync('git', ['check-ignore', ...collectTemplateFiles(path.join(ROOT, 'templates', 'base')).map((file) => path.join('templates', 'base', file))], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (error) {
    // git check-ignore exits with 1 when nothing is ignored, and git may be unavailable.
    output = error.stdout || '';
  }

  assert.strictEqual(output.trim(), '', `ignored template files:\n${output}`);
});

const ROADMAP_SAMPLE = [
  '| ID    | Name | Objective | Status    | Finished |',
  '| ----- | ---- | --------- | --------- | -------- |',
  '| EPIC0 | Foundation | x | `done` | 2026-10-01 |',
  '| EPIC1 | Login | y | implement |  |'
].join('\n');

test('sdd-guard reads epic statuses from the roadmap table', () => {
  const statuses = parseRoadmapStatuses(ROADMAP_SAMPLE);
  assert.strictEqual(statuses.get('EPIC0'), 'done');
  assert.strictEqual(statuses.get('EPIC1'), 'implement');
});

test('sdd-guard blocks writes to closed epics and allows everything else', () => {
  const root = path.join(os.tmpdir(), 'guard-project');

  assert.strictEqual(decideWrite('specs/EPIC0/TASKS.md', root, ROADMAP_SAMPLE).allow, false);
  assert.strictEqual(decideWrite(path.join(root, 'specs', 'EPIC0', 'EPIC0.md'), root, ROADMAP_SAMPLE).allow, false);
  assert.strictEqual(decideWrite('specs/EPIC1/TASKS.md', root, ROADMAP_SAMPLE).allow, true);
  assert.strictEqual(decideWrite('specs/CAPABILITIES.md', root, ROADMAP_SAMPLE).allow, true);
  assert.strictEqual(decideWrite('src/app.js', root, ROADMAP_SAMPLE).allow, true);
  // Fail-open: no roadmap, no decision.
  assert.strictEqual(decideWrite('specs/EPIC0/TASKS.md', root, '').allow, true);
});

test('sdd-guard works end to end as a Claude Code hook', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agile-sdd-guard-'));

  try {
    fs.mkdirSync(path.join(tempDir, 'docs'));
    fs.writeFileSync(path.join(tempDir, 'docs', 'ROADMAP.md'), ROADMAP_SAMPLE, 'utf8');
    const hook = path.join(ROOT, 'hooks', 'sdd-guard.cjs');
    const run = (filePath) => childProcess.spawnSync(process.execPath, [hook], {
      input: JSON.stringify({ tool_name: 'Edit', cwd: tempDir, tool_input: { file_path: filePath } }),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: tempDir }
    });

    const blocked = run(path.join(tempDir, 'specs', 'EPIC0', 'TASKS.md'));
    assert.strictEqual(blocked.status, 2);
    assert.match(blocked.stderr, /EPIC0 is marked done/);
    assert.strictEqual(run(path.join(tempDir, 'specs', 'EPIC1', 'TASKS.md')).status, 0);

    const garbage = childProcess.spawnSync(process.execPath, [hook], { input: 'not json', encoding: 'utf8' });
    assert.strictEqual(garbage.status, 0, 'a broken payload must never block');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
