const fs = require('fs');
const path = require('path');

const GUARD_SOURCE = path.join(__dirname, '..', 'hooks', 'sdd-guard.cjs');

/**
 * Platform adapters.
 *
 * The workflow lives in AGENTS.md, docs/METHODOLOGY.md and skills/*.md. Each
 * platform only receives thin wrappers (slash commands and a reviewer agent)
 * that point back to those files, so there is a single source of truth and the
 * three platforms can never drift apart (the main maintenance cost observed in
 * multi-variant bundles such as devAgent).
 */

const PLATFORMS = ['claude', 'antigravity', 'opencode'];

const PLATFORM_LAYOUT = {
  claude: {
    label: 'Claude Code',
    commandDir: path.join('.claude', 'commands'),
    agentPath: path.join('.claude', 'agents', 'sdd-reviewer.md'),
    argumentsText: '$ARGUMENTS',
    delegation: 'Use the Task tool to delegate to the `sdd-reviewer` subagent'
  },
  antigravity: {
    label: 'Antigravity',
    commandDir: path.join('.agent', 'workflows'),
    agentPath: path.join('.agent', 'agents', 'sdd-reviewer.md'),
    // Antigravity has no argument placeholder: the text stays in the user's message.
    argumentsText: 'whatever the user wrote after the command',
    delegation: 'Invoke the `sdd-reviewer` subagent'
  },
  opencode: {
    label: 'OpenCode',
    commandDir: path.join('.opencode', 'commands'),
    agentPath: path.join('.opencode', 'agents', 'sdd-reviewer.md'),
    argumentsText: '$ARGUMENTS',
    delegation: 'Delegate to the `@sdd-reviewer` subagent'
  }
};

/**
 * Command catalog. `skill: null` means the command is always installed.
 * `body` receives the platform layout and returns the command instructions.
 */
const COMMANDS = [
  {
    name: 'sdd',
    skill: null,
    description: 'Resume the Agile SDD workflow from the roadmap and propose the next step.',
    body: (layout) => [
      'Resume the Agile SDD workflow.',
      '',
      '1. Read `AGENTS.md`.',
      '2. Read `docs/ROADMAP.md` and locate the current epic and its status.',
      '3. Read only the matching section of `docs/METHODOLOGY.md`, then only the files of that epic you need.',
      '4. Report the current state to the PM (epic, phase, next task or open question) and propose the next step. Do not execute it until the PM agrees.',
      '',
      `Extra context from the PM: ${layout.argumentsText}`
    ]
  },
  {
    name: 'grillme',
    skill: 'grill-me',
    description: 'Clarify an idea, epic, user story or plan with one question at a time.',
    body: (layout) => [
      'Read `skills/grill-me/SKILL.md` and run a clarification pass exactly as it describes: one question at a time, each with your recommended answer.',
      '',
      `Topic: ${layout.argumentsText}. If empty, use the current epic or plan from \`docs/ROADMAP.md\`.`
    ]
  },
  {
    name: 'zoomout',
    skill: 'zoom-out',
    description: 'Consistency review of scope and architecture before implementing.',
    body: (layout) => [
      'Read `skills/zoom-out/SKILL.md` and run a consistency review as it describes.',
      '',
      `Focus: ${layout.argumentsText}. If empty, review the tasks of the current epic.`
    ]
  },
  {
    name: 'tdd',
    skill: 'tdd',
    description: 'Implement the current task with a red-green-refactor loop.',
    body: (layout) => [
      'Read `skills/tdd/SKILL.md` and implement with its red-green-refactor loop.',
      '',
      `Target: ${layout.argumentsText}. If empty, the task marked \`[-]\` in the current epic's \`TASKS.md\`.`
    ]
  },
  {
    name: 'sdd-debug',
    skill: 'debugging',
    description: 'Root-cause debugging of a failing test or a bug.',
    body: (layout) => [
      'Read `skills/debugging/SKILL.md` and follow it: reproduce, write a failing test, trace, fix the root cause, verify.',
      '',
      `Problem: ${layout.argumentsText}`
    ]
  },
  {
    name: 'sdd-review',
    skill: 'review',
    description: 'Independent review of a user story (EPICX/USn) or of an epic spec (spec EPICX).',
    body: (layout) => [
      'Run the independent review defined in `skills/review/SKILL.md`.',
      '',
      `Target: ${layout.argumentsText} (\`EPICX/USn\`, or \`spec EPICX\`). If empty, the user story currently in review.`,
      '',
      '1. Collect file pointers: the epic file, its `PLAN.md` and `TASKS.md`, `docs/ARCHITECTURE.md`, and the files changed for this user story (`git status --porcelain`, `git diff --name-only`).',
      `2. ${layout.delegation}, passing only the target and those paths. Never pass a summary of the work: the reviewer must read the files itself.`,
      '3. If subagents are not available, tell the PM to run the review in a new conversation; do not review your own work in this context.',
      '4. Show the verdict and the numbered findings, then continue with the Review section of `docs/METHODOLOGY.md`. Fixing findings is your job, not the reviewer\'s.'
    ]
  }
];

const REVIEWER_DESCRIPTION = 'Independent, read-only reviewer for Agile SDD. Reviews a user story against its acceptance criteria, or an epic spec before planning, and returns a deterministic verdict.';

const REVIEWER_BODY = [
  'You are `sdd-reviewer`, an independent and read-only reviewer.',
  '',
  'Read `skills/review/SKILL.md` and follow it exactly. You receive a target and file pointers: read every referenced file before judging, and gather any other evidence yourself (tests, diffs).',
  '',
  '- Write only to `specs/EPICX/REVIEW.md` (append a section).',
  '- Never edit code or specs. Never invoke other agents.',
  '- A check you could not run is `N/A` with a reason, never `PASS`.',
  '- Return to the caller only the verdict and the numbered findings.'
];

/** Builds the frontmatter of a command file for the given platform. */
function commandFrontmatter(platform, command) {
  const lines = ['---', `description: ${command.description}`];

  if (platform === 'claude' && command.name !== 'sdd') {
    lines.push('argument-hint: [optional target]');
  }

  lines.push('---');
  return lines;
}

/** Builds the frontmatter of the reviewer agent for the given platform. */
function reviewerFrontmatter(platform) {
  if (platform === 'claude') {
    return [
      '---',
      'name: sdd-reviewer',
      `description: ${REVIEWER_DESCRIPTION}`,
      'tools: Read, Grep, Glob, Bash, Write',
      '# Independence comes from a fresh context and file pointers. Raise to opus for a stronger judge if your plan allows it.',
      'model: sonnet',
      '---'
    ];
  }

  if (platform === 'antigravity') {
    return [
      '---',
      'name: sdd-reviewer',
      `description: ${REVIEWER_DESCRIPTION}`,
      'mainAgent: false',
      'subagent: true',
      'model: flash',
      '---'
    ];
  }

  return [
    '---',
    `description: ${REVIEWER_DESCRIPTION}`,
    'mode: subagent',
    'tools:',
    '  write: true',
    '  edit: false',
    '  bash: true',
    'permission:',
    '  edit:',
    '    "**": deny',
    '    "specs/**/REVIEW.md": allow',
    '---'
  ];
}

/** Parses a comma separated platform list (`claude,opencode`, `all`, `none`). */
function parsePlatformsOption(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'all' || normalized === '') {
    return [...PLATFORMS];
  }

  if (normalized === 'none') {
    return [];
  }

  const requested = normalized.split(',').map((item) => item.trim()).filter(Boolean);
  const unknown = requested.filter((item) => !PLATFORMS.includes(item));
  if (unknown.length > 0) {
    throw new Error(`Unknown platform(s): ${unknown.join(', ')}. Use: ${PLATFORMS.join(', ')}, all or none.`);
  }

  return PLATFORMS.filter((platform) => requested.includes(platform));
}

/**
 * Returns the generated adapter files for the selected platforms and skills,
 * as `{ file, content }` entries with paths relative to the target project.
 */
function buildPlatformFiles(platforms, skillModes) {
  const files = [];
  const isInstalled = (skillKey) => skillKey === null || (skillModes[skillKey] && skillModes[skillKey] !== 'none');

  for (const platform of platforms) {
    const layout = PLATFORM_LAYOUT[platform];

    for (const command of COMMANDS) {
      if (!isInstalled(command.skill)) {
        continue;
      }

      const content = [...commandFrontmatter(platform, command), '', ...command.body(layout), ''].join('\n');
      files.push({ file: path.join(layout.commandDir, `${command.name}.md`), content });
    }

    if (isInstalled('review')) {
      const content = [...reviewerFrontmatter(platform), '', ...REVIEWER_BODY, ''].join('\n');
      files.push({ file: layout.agentPath, content });
    }

    if (platform === 'claude') {
      // Enforced write scope: closed epics are read-only (PreToolUse hook).
      files.push({ file: path.join('.claude', 'hooks', 'sdd-guard.cjs'), content: fs.readFileSync(GUARD_SOURCE, 'utf8') });
      files.push({
        file: path.join('.claude', 'settings.json'),
        content: JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Write|Edit|MultiEdit|NotebookEdit',
                hooks: [{ type: 'command', command: 'node .claude/hooks/sdd-guard.cjs' }]
              }
            ]
          }
        }, null, 2) + '\n'
      });
      files.push({
        file: 'CLAUDE.md',
        content: [
          '# CLAUDE.md',
          '',
          'The agent rules of this project live in `AGENTS.md`, shared by every tool. Do not duplicate them here.',
          '',
          '@AGENTS.md',
          ''
        ].join('\n')
      });
    }
  }

  return files;
}

module.exports = {
  PLATFORMS,
  PLATFORM_LAYOUT,
  COMMANDS,
  parsePlatformsOption,
  buildPlatformFiles
};
