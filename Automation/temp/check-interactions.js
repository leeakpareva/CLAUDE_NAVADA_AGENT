const fs = require('fs');
const lines = fs.readFileSync(process.env.HOME + '/CLAUDE_NAVADA_AGENT/Automation/logs/telegram-interactions.jsonl', 'utf8').trim().split('\n');

const users = {};
lines.forEach(l => {
  try {
    const d = JSON.parse(l);
    const uid = String(d.userId || '?');
    if (!users[uid]) users[uid] = { msgs: 0, responses: 0, tools: 0, cost: 0, firstSeen: d.timestamp, lastSeen: d.timestamp };
    if (d.direction === 'in') users[uid].msgs++;
    if (d.direction === 'out') { users[uid].responses++; users[uid].cost += (d.cost_gbp || 0); }
    if (d.direction === 'tool') users[uid].tools++;
    users[uid].lastSeen = d.timestamp;
  } catch {}
});

const names = { '6920669447': 'Lee (admin)', '7603217134': 'Malcolm (guest)', '7796797076': 'Steph (guest)' };

console.log('TELEGRAM INTERACTION LOG — ALL USERS');
console.log('====================================\n');
console.log('Total log entries:', lines.length, '\n');

Object.entries(users).forEach(([uid, s]) => {
  const name = names[uid] || uid;
  console.log(name);
  console.log('  Messages sent:', s.msgs);
  console.log('  Responses:', s.responses);
  console.log('  Tool calls:', s.tools);
  console.log('  Cost: £' + s.cost.toFixed(4));
  console.log('  First seen:', s.firstSeen);
  console.log('  Last seen:', s.lastSeen);
  console.log('');
});
