import { allUsers, effectiveStatus } from '../core/auth.js';
import { allPosts } from '../core/posts.js';
import { allRegistrations } from '../core/events.js';
import { activityByDay, dayKey } from '../core/activity.js';
import { allLikes, allComments, allFollows } from '../core/social.js';

const DAY = 864e5;
const keysFor = (n, offset = 0) => Array.from(
    { length: n },
    (_, i) => dayKey(Date.now() - (n - 1 - i + offset) * DAY)
);
const countByDay = (items, keys) => keys.map(
    k => items.filter(
        t => dayKey(t) === k
    ).length
);

export const sum = a => a.reduce((x,y) => x + y, 0);
