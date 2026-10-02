#!/usr/bin/env node
/**
 * sdd-guard: Claude Code PreToolUse hook installed by create-agile-sdd-plus.
 *
 * Enforces one rule of the constitution that prompts alone cannot guarantee:
 * the folders of epics marked `done` in docs/ROADMAP.md are read-only history.
 *
 * Protocol: Claude Code sends the tool call as JSON on stdin. Exit code 2 blocks
 * the call and shows stderr to the agent; exit code 0 allows it.
 * Fail-open by design: if anything goes wrong (no roadmap, unreadable input),
 * the write is allowed. A broken guard must never brick a session.
 */
const fs = require('fs');
const path = require('path');

/** Reads the epic statuses from the roadmap table: `| EPIC3 | name | objective | status | finished |`. */
function parseRoadmapStatuses(roadmapText) {
  const statuses = new Map();

  for (const line of roadmapText.split(/\r?\n/)) {
    const cells = line.split('|').map((cell) => cell.trim());
    // A table row starts and ends with a pipe, so cells[0] is empty.
    if (cells.length < 6 || !/^EPIC\d+$/i.test(cells[1])) {
      continue;
    }

    statuses.set(cells[1].toUpperCase(), cells[4].replace(/`/g, '').toLowerCase());
  }

  return statuses;
}

/**
 * Decides whether a write to `filePath` is allowed.
 * Returns `{ allow: true }` or `{ allow: false, reason }`.
 */
function decideWrite(filePath, projectRoot, roadmapText) {
  if (!filePath || !roadmapText) {
    return { allow: true };
  }

  const relative = path.relative(projectRoot, path.resolve(projectRoot, filePath)).split(path.sep).join('/');
  const match = /^specs\/(EPIC\d+)\//i.exec(relative);
  if (!match) {
    return { allow: true };
  }

  const epicId = match[1].toUpperCase();
  const status = parseRoadmapStatuses(roadmapText).get(epicId);
  if (status !== 'done') {
    return { allow: true };
  }

  return {
    allow: false,
    reason: `${epicId} is marked done in docs/ROADMAP.md, so ${relative} is read-only history. `
      + 'Changes to past behavior become a new user story or epic: ask the PM. '
      + 'If the PM really wants to edit a closed epic, they can do it by hand.'
  };
}

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const request = JSON.parse(input || '{}');
      const toolInput = request.tool_input || {};
      const filePath = toolInput.file_path || toolInput.notebook_path || toolInput.path;
      const projectRoot = process.env.CLAUDE_PROJECT_DIR || request.cwd || process.cwd();
      const roadmapPath = path.join(projectRoot, 'docs', 'ROADMAP.md');
      const roadmapText = fs.existsSync(roadmapPath) ? fs.readFileSync(roadmapPath, 'utf8') : '';
      const decision = decideWrite(filePath, projectRoot, roadmapText);

      if (!decision.allow) {
        process.stderr.write(`${decision.reason}\n`);
        process.exit(2);
      }
    } catch (error) {
      // Fail-open: never block because the guard itself failed.
    }

    process.exit(0);
  });
}

if (require.main === module) {
  main();
}

module.exports = { parseRoadmapStatuses, decideWrite };
