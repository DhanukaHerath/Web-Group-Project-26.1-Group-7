/* reports.js – builds the website-status report and per-event registration report. */

import { allUsers, effectiveStatus } from '../core/auth.js';
import { allPosts, getCategories } from '../core/posts.js';
import { allEvents, registrationsFor } from '../core/events.js';
import { series, sum, overview } from './stats.js';
import { openReport } from '../components/report.js';
import { fmtDate, timeAgo } from '../core/dom.js';

export function openSiteReport(days) {
    const n = days || 30, s = series(n), o = overview();
    const label = days ? `Last ${days} days` : 'Last 30 days (all recorded history)';
    const from = Date.now() - n * 864e5;
    const posts = allPosts();

    openReport({
        title: 'Scriptorium - Website Status Report',
        subtitle: label,
        filename: `scriptorium-site-report-${n}d`,
        sections: [
            { heading: 'Overview (now)',
                kv: [
                    ['Registered users', o.users],
                    ['Members', o.members],
                    ['Admins', o.admins],
                    ['Active in the last 24 hours', o.active24h],
                    ['Active in the last 7 days', o.active7d],
                    ['Suspended / banned', `${o.suspended} / ${o.banned}`],
                    ['Posts (all time)', o.posts],
                    ['Approved / Pending / Disapproved', `${o.approved} / ${o.pending} / ${o.disapproved}`],
                    ['Featured in homepage gallery', o.featured],
                    ['Event registrations (all time)', o.registrations]
                ]
            },
            { heading: `Activity in period (${label})`,
                kv: [
                    ['Page views', sum(s.views)],
                    ['Logins', sum(s.logins)],
                    ['New sign-ups', sum(s.signups)],
                    ['Posts submitted', sum(s.posts)],
                    ['Likes', sum(s.likes)],
                    ['Comments', sum(s.comments)],
                    ['New follows', sum(s.follows)],
                    ['Event registrations', sum(s.regs)],
                    ['Total interactions', sum(s.interactions)]
                ]
            },
            { heading: 'Content by category',
                columns: ['Category', 'Type', 'Approved', 'Pending', 'Disapproved', 'Total'],
                rows: getCategories().map(
                    c => {
                        const p = posts.filter(
                            x => x.category === c.id
                        );
                        const f = st => p.filter(
                            x => x.status === st
                        ).length;
                        return [
                            c.label,
                            c.type === 'text' ? 'Text' : 'Image',
                            f('approved'),
                            f('pending'),
                            f('disapproved'),
                            p.length
                        ];
                    }
                )
            },
            { heading: 'Daily activity',
                columns: ['Date', 'Page views', 'Logins', 'Sign-ups', 'Posts', 'Registrations', 'Likes', 'Comments', 'Follows'],
                rows: s.keys.map(
                    (k, i) => [
                        k,
                        s.views[i],
                        s.logins[i],
                        s.signups[i],
                        s.posts[i],
                        s.regs[i],
                        s.likes[i],
                        s.comments[i],
                        s.follows[i]
                    ]
                )
            },
            { heading: 'New members in period',
                columns: ['Name', 'Username', 'Faculty', 'Batch', 'Joined', 'Status'],
                rows: allUsers().filter(
                    u => u.createdAt >= from
                ).map(
                    u => [
                        u.fullName || '',
                        '@' + u.username,
                        u.faculty || '', 
                        u.batch || '',
                        fmtDate(u.createdAt),
                        effectiveStatus(u)]
                )
            },
            { heading: 'Events',
                columns: ['Event', 'Type', 'Date', 'Registrations'],
                rows: allEvents().map(
                    e => [
                        e.title,
                        e.kind,
                        fmtDate(e.date),
                        e.kind === 'Notice' ? '-' : registrationsFor(e.id).length
                    ]
                )
            },
        ],
    });
}

export function openEventReport() {
    const regs = registrationsFor(ev.id);
    openReport(
        { title: `Registrations - ${ev.title}`,
            subtitle: `${ev.kind} · ${fmtDate(ev.date)} · ${ev.venue}`,
            filename: `registrations-${ev.id}`,
            sections: [
                { heading: 'Summary',
                    kv: [
                        ['Total registrations', regs.length],
                        ['Registration closes', ev.registerBy ? fmtDate(ev.registerBy) : '–']
                    ]
                },
                { heading: 'Registered attendees',
                    columns: ['#', 'Full name', 'Username', 'Email', 'Faculty', 'Batch', 'Phone', 'Registered', 'Note'],
                    rows: regs.map((r, i) => [
                        i + 1,
                        r.fullName,
                        r.user ? '@' + r.user.username : '',
                        r.email,
                        r.faculty,
                        r.batch,
                        r.phone || '',
                        timeAgo(r.createdAt),
                        r.note || ''
                    ])
                },
            ],
        }
    );
}