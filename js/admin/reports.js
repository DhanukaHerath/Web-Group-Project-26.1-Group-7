import { allUsers, effectiveStatus } from '../core/auth.js';
import { allPosts, getCategories } from '../core/posts.js';
import { allEvents, registrationsFor } from '../core/events.js';
import { series, sum, overview } from './stats.js';
import { openReport } from '../components/report.js';
import { fmtDate, timeAgo } from '../core/dom.js';

export function openSiteReport() {}

export function openEventReport() {}