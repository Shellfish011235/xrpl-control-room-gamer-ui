import assert from 'node:assert/strict';
import {
  sanitizeDiscordActivityItems,
  sanitizeBountyItems,
  sanitizePostBountyResponse,
} from '../src/services/discordBridgeService';

const now = Date.now();
const validActivity = { id:'a1', type:'system', content:'ok', timestamp:now };
const activity = sanitizeDiscordActivityItems([
  validActivity,
  { id:'bad-type', type:'evil', content:'x', timestamp:now },
  { id:'bad-time', type:'system', content:'x', timestamp:'now' },
  null,
]);
assert.deepEqual(activity, [validActivity]);

const many = Array.from({length:250}, (_,i) => ({ id:`a${i}`, type:'system', content:'ok', timestamp:now }));
assert.equal(sanitizeDiscordActivityItems(many).length, 200);

const validBounty = {
  id:'b1', title:'t', description:'d', rewardXRP:1, status:'open', createdAt:now, updatedAt:now,
};
const bounties = sanitizeBountyItems([
  validBounty,
  { ...validBounty, id:'b2', rewardXRP:-1 },
  { ...validBounty, id:'b3', status:'unknown' },
]);
assert.deepEqual(bounties, [validBounty]);

assert.deepEqual(
  sanitizePostBountyResponse({ bountyId:'b1', discordMessageId:'m1' }),
  { bountyId:'b1', discordMessageId:'m1' },
);
assert.deepEqual(
  sanitizePostBountyResponse({ bountyId:{bad:true}, discordMessageId:42 }),
  {},
);
console.log('discord bridge validation regressions: PASS');
