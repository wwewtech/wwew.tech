// Searches GitHub discussions (not issues) for a query.
//
// Usage: node scripts/gh-discussions.mjs "<query>" [repo]

const queryArg = process.argv[2] ?? 'app router performance';
const repo = process.argv[3] ?? 'vercel/next.js';

const { execFileSync } = await import('node:child_process');

const gql = `query{search(query:"repo:${repo} ${queryArg.replace(/"/g, '\\"')}",type:DISCUSSION,first:8){nodes{... on Discussion{number title upvoteCount}}}}`;

const out = execFileSync('gh', ['api', 'graphql', '-f', `query=${gql}`], { encoding: 'utf8' });
const data = JSON.parse(out);
const nodes = data?.data?.search?.nodes ?? [];
if (!nodes.length) console.log('  (no discussions found)');
for (const n of nodes) {
  console.log(`  #${n.number} (${n.upvoteCount}up) ${n.title}`);
}
