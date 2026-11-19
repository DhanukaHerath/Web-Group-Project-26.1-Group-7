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
export const sum = a => a.reduce((x, y) => x + y, 0);

export function series(n, offset = 0) {
    const keys = keysFor(n, offset), act = activityByDay(), g = (k, t) => act[k]?.[t] || 0;
    const posts = countByDay(
        allPosts().map(
            p => p.createdAt
        ), keys
    );
    const regs = countByDay(
        allRegistrations().map(
            r => r.createdAt
        ), keys
    );
    const signups = countByDay(
        allUsers().map(
            u => u.createdAt
        ), keys
    );

    const likes = countByDay(
        allLikes().map(
            l => l.createdAt
        ), keys
    ), comments = countByDay(
        allComments().map(
            c => c.createdAt
        ), keys
    ), follows = countByDay(
        allFollows().map(
            f => f.createdAt
        ), keys
    );

    const views = keys.map(
        k => g(k, 'view')
    ), logins = keys.map(
        k => g(k, 'login')
    );

    return {
        keys,
        labels: keys.map(
            k => k.slice(5).replace('-', '/')
        ),
        views,
        logins,
        posts,
        regs,
        signups,
        likes,
        comments,
        follows,
        interactions: keys.map(
            (k, i) => logins[i] + posts[i] + regs[i] + signups[i] + likes[i] + comments[i] + follows[i]
        )
    };
}

export const delta = (now, before) => (
    before ? Math.round(
        ((now - before) / before) * 100
    ) : null
);

export function overview() {
    const users = allUsers(), posts = allPosts(), regs = allRegistrations(), now = Date.now();
    const members = users.filter(
        u => u.role !== 'admin'
    );
    const active = ms => members.filter(
        u => u.lastActiveAt && now - u.lastActiveAt < ms
    );
    const registeredUsers = new Set(
        regs.map(
            r => r.userId
        )
    );
    return {
        users: users.length,
        members: members.length,
        admins: users.length - members.length,
        active15m: active(15 * 60e3).length,
        active24h: active(DAY).length,
        active7d: active(7 * DAY).length,
        suspended: users.filter(
            u => effectiveStatus(u) === 'suspended'
        ).length,
        banned: users.filter(
            u => effectiveStatus(u) === 'banned'
        ).length,
        posts: posts.length,
        approved: posts.filter(
            p => p.status === 'approved'
        ).length,
        pending: posts.filter(
            p => p.status === 'pending'
        ).length,
        disapproved: posts.filter(
            p => p.status === 'disapproved'
        ).length,
        featured: posts.filter(
            p => p.featured && p.status === 'approved'
        ).length,
        registrations: regs.length,
        registeredMembers: members.filter(
            u => registeredUsers.has(u.id)
        ).length,
    };
}