const fs = require('fs');
const path = require('path');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { PLATFORMS, parsePlatformsOption, buildPlatformFiles } = require('./platforms.cjs');

const TEMPLATE_ROOT = path.join(__dirname, '..', 'templates', 'base');
const SKILL_DEFINITIONS = [
  {
    key: 'grill-me',
    relativePath: path.join('skills', 'grill-me', 'SKILL.md'),
    allowedModes: ['manual', 'auto'],
    defaultMode: 'auto'
  },
  {
    key: 'zoom-out',
    relativePath: path.join('skills', 'zoom-out', 'SKILL.md'),
    allowedModes: ['none', 'manual', 'auto'],
    defaultMode: 'manual'
  },
  {
    key: 'tdd',
    relativePath: path.join('skills', 'tdd', 'SKILL.md'),
    allowedModes: ['none', 'manual', 'auto'],
    defaultMode: 'manual'
  },
  {
    key: 'review',
    relativePath: path.join('skills', 'review', 'SKILL.md'),
    allowedModes: ['none', 'manual', 'auto'],
    defaultMode: 'auto',
    // Every file under this folder (the audit catalogs) ships only when the skill is installed.
    resourceDir: path.join('skills', 'review')
  },
  {
    key: 'debugging',
    relativePath: path.join('skills', 'debugging', 'SKILL.md'),
    allowedModes: ['none', 'manual', 'auto'],
    defaultMode: 'manual'
  }
];
const SKILL_DEFINITION_BY_PATH = new Map(SKILL_DEFINITIONS.map((definition) => [definition.relativePath, definition]));

function collectTemplateFiles(rootDir) {
  const files = [];

  function walk(currentDir, relativeDir = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(relativeDir, entry.name);
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath, relativePath);
        continue;
      }

      files.push(relativePath);
    }
  }

  walk(rootDir);
  return files.sort((left, right) => left.localeCompare(right));
}

function getDefaultSkillModes() {
  return Object.fromEntries(SKILL_DEFINITIONS.map((definition) => [definition.key, definition.defaultMode]));
}

function getAllSkillModes(mode) {
  return Object.fromEntries(SKILL_DEFINITIONS.map((definition) => [definition.key, mode]));
}

function isSkillModeAllowed(definition, mode) {
  return definition.allowedModes.includes(mode);
}

function normalizeSkillModes(skillModes) {
  const defaults = getDefaultSkillModes();
  const normalized = { ...defaults };

  if (!skillModes) {
    return normalized;
  }

  for (const definition of SKILL_DEFINITIONS) {
    const selectedMode = skillModes[definition.key];

    if (!selectedMode) {
      continue;
    }

    if (isSkillModeAllowed(definition, selectedMode)) {
      normalized[definition.key] = selectedMode;
    }
  }

  normalized['grill-me'] = 'auto';

  return normalized;
}

function hasInstalledSkills(skillModes) {
  return SKILL_DEFINITIONS.some((definition) => skillModes[definition.key] !== 'none');
}

function buildSkillsList(skillModes) {
  const lines = [];

  for (const definition of SKILL_DEFINITIONS) {
    const mode = skillModes[definition.key];
    if (mode === 'none') {
      continue;
    }

    lines.push(`- \`${definition.key}\`: \`${mode}\``);
  }

  return lines.join('\n');
}

function shouldIncludeTemplate(relativePath, skillModes) {
  if (!relativePath.startsWith('skills' + path.sep) && relativePath !== path.join('skills', 'README.md')) {
    return true;
  }

  if (relativePath === path.join('skills', 'README.md')) {
    return hasInstalledSkills(skillModes);
  }

  const definition = SKILL_DEFINITION_BY_PATH.get(relativePath) || findSkillOwningResource(relativePath);
  if (!definition) {
    return true;
  }

  return skillModes[definition.key] !== 'none';
}

/**
 * Returns the skill whose resource folder contains the given template path
 * (for example the review catalogs), or undefined when no skill owns it.
 */
function findSkillOwningResource(relativePath) {
  return SKILL_DEFINITIONS.find((definition) => definition.resourceDir && relativePath.startsWith(definition.resourceDir + path.sep));
}

function getTemplateVariables(relativePath, baseVariables, skillModes) {
  const variables = { ...baseVariables };

  if (relativePath === path.join('skills', 'README.md')) {
    variables.skillsList = buildSkillsList(skillModes);
    return variables;
  }

  const definition = SKILL_DEFINITION_BY_PATH.get(relativePath);
  if (definition) {
    variables.skillMode = skillModes[definition.key];
  }

  return variables;
}

function getDefaultSkillSelection() {
  return normalizeSkillModes();
}

function getNoSkillSelection() {
  const selection = getAllSkillModes('none');
  selection['grill-me'] = 'auto';
  return normalizeSkillModes(selection);
}

function parseSkillSelectionOption(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === 'none') {
    return getNoSkillSelection();
  }

  return null;
}

async function promptSkillSelection() {
  const selection = {};
  const shouldInstallSkills = await confirm('Install the recommended skills bundle?', true);

  if (!shouldInstallSkills) {
    return getNoSkillSelection();
  }

  for (const definition of SKILL_DEFINITIONS) {
    const defaultMode = definition.defaultMode;
    const allowedModes = definition.allowedModes.join('/');
    const answer = await prompt(`Mode for ${definition.key} (${allowedModes})`, defaultMode);
    const normalized = answer.trim().toLowerCase();

    if (definition.allowedModes.includes(normalized)) {
      selection[definition.key] = normalized;
      continue;
    }

    selection[definition.key] = defaultMode;
  }

  return normalizeSkillModes(selection);
}

function getProjectName(targetDir) {
  const resolved = path.resolve(targetDir);
  const base = path.basename(resolved);
  return base || 'agile-sdd-project';
}

function render(content, variables) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : `{{${key}}}`;
  });
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeIfMissing(sourcePath, targetPath, variables, force) {
  if (fs.existsSync(targetPath) && !force) {
    return { status: 'skipped' };
  }

  ensureDir(targetPath);
  const template = fs.readFileSync(sourcePath, 'utf8');
  const output = render(template, variables);
  fs.writeFileSync(targetPath, output, 'utf8');
  return { status: 'written' };
}

function writeContentIfMissing(targetPath, content, force) {
  if (fs.existsSync(targetPath) && !force) {
    return { status: 'skipped' };
  }

  ensureDir(targetPath);
  fs.writeFileSync(targetPath, content, 'utf8');
  return { status: 'written' };
}

/**
 * Normalizes the platform selection: undefined means every platform,
 * unknown names are dropped, and the order is always the canonical one.
 */
function normalizePlatforms(platforms) {
  if (!Array.isArray(platforms)) {
    return [...PLATFORMS];
  }

  return PLATFORMS.filter((platform) => platforms.includes(platform));
}

async function promptPlatformSelection() {
  const answer = await prompt(`Platforms for slash commands and the reviewer agent (${PLATFORMS.join(',')}/all/none)`, 'all');

  try {
    return parsePlatformsOption(answer);
  } catch (error) {
    process.stdout.write(`${error.message} Using all.\n`);
    return [...PLATFORMS];
  }
}

function isDirectoryEmpty(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return true;
  }

  const entries = fs.readdirSync(targetDir);
  return entries.length === 0;
}

async function prompt(question, defaultValue) {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    const answer = await rl.question(`${question}${suffix}: `);
    const trimmed = answer.trim();
    return trimmed || defaultValue;
  } finally {
    rl.close();
  }
}

async function confirm(question, defaultValue = false) {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const answer = await prompt(`${question} [${hint}]`, '');
  const normalized = answer.trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  return normalized === 'y' || normalized === 'yes';
}

async function scaffold(targetDir, options = {}) {
  const force = Boolean(options.force);
  const resolvedTarget = path.resolve(targetDir);
  const variables = {
    projectName: getProjectName(resolvedTarget)
  };
  const templateFiles = collectTemplateFiles(TEMPLATE_ROOT);
  const skillModes = normalizeSkillModes(options.skillModes);
  const platforms = normalizePlatforms(options.platforms);

  const results = [];
  for (const relativePath of templateFiles) {
    if (!shouldIncludeTemplate(relativePath, skillModes)) {
      results.push({ file: relativePath, status: 'skipped' });
      continue;
    }

    const sourcePath = path.join(TEMPLATE_ROOT, relativePath);
    const targetPath = path.join(resolvedTarget, relativePath);
    const templateVariables = getTemplateVariables(relativePath, variables, skillModes);
    const result = writeIfMissing(sourcePath, targetPath, templateVariables, force);
    results.push({ file: relativePath, ...result });
  }

  for (const generated of buildPlatformFiles(platforms, skillModes)) {
    const targetPath = path.join(resolvedTarget, generated.file);
    const result = writeContentIfMissing(targetPath, generated.content, force);
    results.push({ file: generated.file, generated: true, ...result });
  }

  return { targetDir: resolvedTarget, projectName: variables.projectName, skillModes, platforms, results };
}

function printHelp() {
  process.stdout.write([
    'Usage: create-agile-sdd-plus [target-dir] [--force] [--yes] [--no-skills] [--platforms claude,antigravity,opencode|all|none]',
    '',
    'Scaffolds the AgileSDD Plus workflow into the target directory.',
    '',
    'Examples:',
    '  create-agile-sdd-plus',
    '  create-agile-sdd-plus my-project',
    '  create-agile-sdd-plus . --force',
    '  create-agile-sdd-plus --yes',
    '  create-agile-sdd-plus --no-skills',
    '  create-agile-sdd-plus my-project --platforms claude,antigravity'
  ].join('\n') + '\n');
}

function parseArgs(argv) {
  const args = [...argv];
  let targetDir = null;
  let sawTarget = false;
  let force = false;
  let yes = false;
  let noSkills = false;
  let skillsOption = null;
  let platformsOption = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }

    if (arg === '--force' || arg === '-f') {
      force = true;
      continue;
    }

    if (arg === '--yes' || arg === '-y') {
      yes = true;
      continue;
    }

    if (arg === '--no-skills') {
      noSkills = true;
      continue;
    }

    if (arg === '--skills' || arg.startsWith('--skills=')) {
      if (arg === '--skills') {
        skillsOption = args[index + 1] || null;
        index += 1;
      } else {
        skillsOption = arg.slice('--skills='.length);
      }

      continue;
    }

    if (arg === '--platforms' || arg.startsWith('--platforms=')) {
      if (arg === '--platforms') {
        platformsOption = args[index + 1] || null;
        index += 1;
      } else {
        platformsOption = arg.slice('--platforms='.length);
      }

      continue;
    }

    targetDir = arg;
    sawTarget = true;
  }

  return {
    help: false,
    targetDir,
    sawTarget,
    force,
    yes,
    noSkills,
    skillsOption,
    platformsOption
  };
}

async function main(argv) {
  const parsed = parseArgs(argv);

  if (parsed.help) {
    printHelp();
    return;
  }

  let targetDir = parsed.targetDir;
  if (!parsed.sawTarget && stdin.isTTY) {
    targetDir = await prompt('Target directory', '.');
  }

  if (!targetDir) {
    targetDir = '.';
  }

  const resolvedTarget = path.resolve(targetDir || '.');
  const targetExists = fs.existsSync(resolvedTarget);
  const targetNotEmpty = targetExists && !isDirectoryEmpty(resolvedTarget);
  const useForce = parsed.force;

  if (targetNotEmpty && !useForce && !parsed.yes && stdin.isTTY) {
    const proceed = await confirm(`The target directory already contains files. Continue in ${resolvedTarget}?`, false);
    if (!proceed) {
      process.stdout.write('Aborted.\n');
      return;
    }
  }

  let skillModes = getDefaultSkillSelection();
  if (parsed.noSkills) {
    skillModes = getNoSkillSelection();
  } else {
    const explicitSelection = parseSkillSelectionOption(parsed.skillsOption);
    if (explicitSelection) {
      skillModes = explicitSelection;
    } else if (stdin.isTTY && !parsed.yes) {
      skillModes = await promptSkillSelection();
    }
  }

  let platforms = parsePlatformsOption(parsed.platformsOption);
  if (platforms === null) {
    platforms = stdin.isTTY && !parsed.yes ? await promptPlatformSelection() : [...PLATFORMS];
  }

  const result = await scaffold(resolvedTarget, { force: useForce, skillModes, platforms });
  const written = result.results.filter((item) => item.status === 'written').length;
  const skipped = result.results.filter((item) => item.status === 'skipped').length;

  process.stdout.write(`Created AgileSDD Plus scaffold in ${result.targetDir}\n`);
  process.stdout.write(`Project name: ${result.projectName}\n`);
  process.stdout.write(`Platforms: ${result.platforms.length > 0 ? result.platforms.join(', ') : 'none'}\n`);
  process.stdout.write(`Written: ${written}, skipped: ${skipped}\n`);

  const claudeEntry = result.results.find((item) => item.file === 'CLAUDE.md');
  if (claudeEntry && claudeEntry.status === 'skipped') {
    process.stdout.write('Note: CLAUDE.md already existed. Add the line "@AGENTS.md" to it so Claude Code loads the constitution.\n');
  }

  const settingsEntry = result.results.find((item) => item.file === path.join('.claude', 'settings.json'));
  if (settingsEntry && settingsEntry.status === 'skipped') {
    process.stdout.write('Note: .claude/settings.json already existed. Merge the PreToolUse hook "node .claude/hooks/sdd-guard.cjs" into it to protect closed epics.\n');
  }
}

module.exports = {
  main,
  scaffold,
  getProjectName,
  render,
  parseArgs,
  collectTemplateFiles,
  getDefaultSkillModes,
  getNoSkillSelection,
  normalizeSkillModes,
  promptSkillSelection,
  shouldIncludeTemplate,
  normalizePlatforms,
  getTemplateVariables,
  isDirectoryEmpty,
  prompt,
  confirm
};
