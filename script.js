// SCRIPTORIUM — APPROVAL QUEUE & SLIDING SIDEBAR CONTROLLER (Pure Vanilla JS)
// Target: Approval/index.html | Approval/style.css
//Sliding left drawer triggered when cursor moves to the left
//Zero hardcoded dummy data in HTML
//Dynamic data population via window.importApprovalData()
 

(function () {
  'use strict';

  //1.LEFT SIDEBAR CURSOR-DRIVEN SLIDE-IN / SLIDE-LEFT CONTROLLER 
  const sidebar = document.getElementById('left-sidebar');
  const edgeTrigger = document.getElementById('sidebar-edge-trigger');

  const EDGE_ACTIVATE_PX = 24;  // Cursor X position (px from left) to trigger slide-in
  const CLOSE_BUFFER_PX = 20;   // Margin past sidebar edge before scheduling close
  const CLOSE_DELAY_MS = 180;   // Delay in ms before sliding back left

  let closeTimer = null;

  function openSidebar() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    document.body.classList.add('sidebar-open');
  }

  function scheduleCloseSidebar() {
    if (closeTimer) return;
    closeTimer = setTimeout(function () {
      document.body.classList.remove('sidebar-open');
      closeTimer = null;
    }, CLOSE_DELAY_MS);
  }

  function toggleSidebar() {
    if (document.body.classList.contains('sidebar-open')) {
      document.body.classList.remove('sidebar-open');
    } else {
      openSidebar();
    }
  }

  if (sidebar && edgeTrigger) {
    // Hovering the edge sensor triggers slide
    edgeTrigger.addEventListener('mouseenter', openSidebar);
    edgeTrigger.addEventListener('click', openSidebar);

    // Global cursor movement tracking
    document.addEventListener('mousemove', function (e) {
      const isOpen = document.body.classList.contains('sidebar-open');
      if (!isOpen) {
        // When cursor moves close to the far left viewport edge, slide sidebar open
        if (e.clientX <= EDGE_ACTIVATE_PX) {
          openSidebar();
        }
      } else {
        // When open, keep open while cursor is within sidebar + buffer zone
        const sidebarWidth = sidebar.offsetWidth || 254;
        if (e.clientX <= sidebarWidth + CLOSE_BUFFER_PX) {
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
          }
        } else {
          scheduleCloseSidebar();
        }
      }
    });

    // Keyboard accessibility: Escape closes sidebar
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
      }
    });

    sidebar.addEventListener('focusin', openSidebar);
  }

  //2. COLLAPSIBLE SUBMENUS (Approval Queue, Categories)
  function setupCollapsible(btnId, submenuId) {
    const btn = document.getElementById(btnId);
    const submenu = document.getElementById(submenuId);
    if (!btn || !submenu) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const parentGroup = btn.closest('.nav-group');
      const isHidden = submenu.hasAttribute('hidden');

      if (isHidden) {
        submenu.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        if (parentGroup) parentGroup.classList.add('is-expanded');
      } else {
        submenu.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        if (parentGroup) parentGroup.classList.remove('is-expanded');
      }
    });
  }

  setupCollapsible('nav-approval-queue-btn', 'nav-approval-submenu');
  setupCollapsible('nav-categories-btn', 'nav-categories-list');

  //3. MONTH DROPDOWN FILTER
  const monthBtn = document.getElementById('month-dropdown-btn');
  const monthMenu = document.getElementById('month-dropdown-menu');
  const monthLabel = document.getElementById('month-dropdown-label');

  if (monthBtn && monthMenu) {
    monthBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isExpanded = monthBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        monthMenu.setAttribute('hidden', '');
        monthBtn.setAttribute('aria-expanded', 'false');
      } else {
        monthMenu.removeAttribute('hidden');
        monthBtn.setAttribute('aria-expanded', 'true');
      }
    });

    monthMenu.querySelectorAll('li').forEach(function (option) {
      option.addEventListener('click', function () {
        monthMenu.querySelectorAll('li').forEach(function (li) { li.classList.remove('selected'); });
        option.classList.add('selected');
        if (monthLabel) monthLabel.textContent = option.textContent.trim();
        monthMenu.setAttribute('hidden', '');
        monthBtn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      if (!monthMenu.hasAttribute('hidden') && !monthBtn.contains(e.target)) {
        monthMenu.setAttribute('hidden', '');
        monthBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  //4. DYNAMIC QUEUE TABLE RENDERING (Zero hardcoded data left in HTML)
  const tableBody = document.getElementById('approval-queue-table-body');
  const emptyState = document.getElementById('queue-empty-state');

  //Generates safe SVG avatar fallback or image element
  function createAvatarNode(avatarUrl, name) {
    if (avatarUrl) {
      const img = document.createElement('img');
      img.className = 'creator-avatar';
      img.src = avatarUrl;
      img.alt = name || 'Creator Avatar';
      img.loading = 'lazy';
      img.onerror = function () {
        // Fallback to silhouette if image fails
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Ccircle cx='12' cy='8.5' r='4'/%3E%3Cpath d='M4.5 20c0-3.8 3.3-6.5 7.5-6.5s7.5 2.7 7.5 6.5'/%3E%3C/svg%3E";
      };
      return img;
    }
    const fallback = document.createElement('div');
    fallback.className = 'creator-avatar-fallback';
    return fallback;
  }

  //Renders array of items into the Approval Queue table
  function loadApprovalQueue(items) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      if (emptyState) emptyState.removeAttribute('hidden');
      return;
    }

    if (emptyState) emptyState.setAttribute('hidden', '');

    items.forEach(function (item, index) {
      const tr = document.createElement('tr');
      tr.className = 'queue-row';
      if (index === 0) tr.classList.add('row-highlight');
      if (item.id) tr.dataset.id = item.id;

      // 1. Creator Column
      const tdCreator = document.createElement('td');
      tdCreator.className = 'col-creator';

      const cellWrap = document.createElement('div');
      cellWrap.className = 'creator-cell';

      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'creator-avatar-wrap';
      avatarWrap.appendChild(createAvatarNode(item.creatorAvatar, item.creatorName));

      const infoWrap = document.createElement('div');
      infoWrap.className = 'creator-info';

      const nameEl = document.createElement('span');
      nameEl.className = 'creator-name';
      nameEl.textContent = item.creatorName || '—';

      const roleEl = document.createElement('span');
      roleEl.className = 'creator-role';
      roleEl.textContent = item.creatorRole || '';

      infoWrap.appendChild(nameEl);
      infoWrap.appendChild(roleEl);
      cellWrap.appendChild(avatarWrap);
      cellWrap.appendChild(infoWrap);
      tdCreator.appendChild(cellWrap);

      // 2. Content Type Column
      const tdType = document.createElement('td');
      tdType.className = 'col-type';
      const typeSpan = document.createElement('span');
      typeSpan.className = 'content-type-label';
      typeSpan.textContent = item.contentType || '—';
      tdType.appendChild(typeSpan);

      // 3. Title Column
      const tdTitle = document.createElement('td');
      tdTitle.className = 'col-title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'content-title';
      titleSpan.textContent = item.title || '—';
      tdTitle.appendChild(titleSpan);

      // 4. Status Column (Approve / Disapprove action buttons)
      const tdStatus = document.createElement('td');
      tdStatus.className = 'col-status';

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'action-buttons-wrap';

      // Approve Button (Green Check)
      const btnApprove = document.createElement('button');
      btnApprove.type = 'button';
      btnApprove.className = 'btn-action btn-approve';
      btnApprove.title = 'Approve';
      btnApprove.setAttribute('aria-label', 'Approve item ' + (item.title || ''));
      btnApprove.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

      btnApprove.addEventListener('click', function () {
        handleAction(tr, item, 'approved');
      });

      // Disapprove Button (Red Cross)
      const btnDisapprove = document.createElement('button');
      btnDisapprove.type = 'button';
      btnDisapprove.className = 'btn-action btn-disapprove';
      btnDisapprove.title = 'Disapprove';
      btnDisapprove.setAttribute('aria-label', 'Disapprove item ' + (item.title || ''));
      btnDisapprove.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

      btnDisapprove.addEventListener('click', function () {
        handleAction(tr, item, 'disapproved');
      });

      actionsWrap.appendChild(btnApprove);
      actionsWrap.appendChild(btnDisapprove);
      tdStatus.appendChild(actionsWrap);

      // Append all columns to row
      tr.appendChild(tdCreator);
      tr.appendChild(tdType);
      tr.appendChild(tdTitle);
      tr.appendChild(tdStatus);

      tableBody.appendChild(tr);
    });
  }

  function handleAction(rowElement, itemData, action) {
    rowElement.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    rowElement.style.opacity = '0.3';
    rowElement.style.transform = 'translateX(8px)';

    // Custom event dispatch for external listener
    const event = new CustomEvent('queueAction', {
      detail: { item: itemData, action: action }
    });
    document.dispatchEvent(event);

    setTimeout(function () {
      rowElement.remove();
      if (tableBody.children.length === 0 && emptyState) {
        emptyState.removeAttribute('hidden');
      }
    }, 320);
  }

  function clearApprovalQueue() {
    if (tableBody) tableBody.innerHTML = '';
    if (emptyState) emptyState.removeAttribute('hidden');
  }

  //5. UNIFIED DATA IMPORTER (window.importApproval)
  function importApprovalData(data) {
    if (!data) return;

    // 1. Admin Profile Details
    if (data.admin) {
      const nameEl = document.getElementById('sidebar-admin-name');
      const emailEl = document.getElementById('sidebar-admin-email');
      const avatarSidebar = document.getElementById('sidebar-admin-avatar');
      const avatarHeader = document.getElementById('header-admin-avatar');

      if (nameEl && data.admin.name) nameEl.textContent = data.admin.name;
      if (emailEl && data.admin.email) emailEl.textContent = data.admin.email;
      if (avatarSidebar && data.admin.avatarUrl) avatarSidebar.src = data.admin.avatarUrl;
      if (avatarHeader && data.admin.avatarUrl) avatarHeader.src = data.admin.avatarUrl;
    }

    // 2. Notification Indicator
    if (data.notifications && typeof data.notifications.hasUnread === 'boolean') {
      const badge = document.getElementById('notification-badge');
      if (badge) badge.dataset.unread = data.notifications.hasUnread ? 'true' : 'false';
    }

    // 3. Queue Badges & Navigation counts
    if (data.counts) {
      if (data.counts.approved !== undefined) {
        const el = document.getElementById('count-approved');
        if (el) el.textContent = data.counts.approved || '';
      }
      if (data.counts.disapproved !== undefined) {
        const el = document.getElementById('count-disapproved');
        if (el) el.textContent = data.counts.disapproved || '';
      }
      if (data.counts.pending !== undefined) {
        const el = document.getElementById('count-pending');
        if (el) el.textContent = data.counts.pending || '';
      }
    }

    // 4. Month Label
    if (data.month && monthLabel) {
      monthLabel.textContent = data.month;
    }

    // 5. Queue Items Array
    if (Array.isArray(data.queueItems)) {
      loadApprovalQueue(data.queueItems);
    }
  }

  //6. DEMO DATA SET (EXACT MATCH FOR THE SCREENSHOT)
  function loadDemoData() {
    importApprovalData({
      admin: {
        name: 'Anita Cruz',
        email: 'anita@commerce.com',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      notifications: {
        hasUnread: true
      },
      counts: {
        approved: '',
        disapproved: '',
        pending: ''
      },
      month: 'March 2026',
      queueItems: [
        {
          id: 'q1',
          creatorName: 'Savidu Herath',
          creatorRole: 'Writer',
          creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          contentType: 'Short Story',
          title: 'How I met her'
        },
        {
          id: 'q2',
          creatorName: 'John Doe',
          creatorRole: 'Poet',
          creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
          contentType: 'Poem',
          title: 'Elf'
        },
        {
          id: 'q3',
          creatorName: 'Tharaka Herath',
          creatorRole: 'Artist',
          creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          contentType: 'Artwork',
          title: 'Winter'
        },
        {
          id: 'q4',
          creatorName: 'Jane Doe',
          creatorRole: 'Artist',
          creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          contentType: 'Artwork',
          title: 'Art of Us'
        },
        {
          id: 'q5',
          creatorName: 'Lucidious',
          creatorRole: 'Writer',
          creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
          contentType: 'Short Story',
          title: 'Princess of Noon'
        },
        {
          id: 'q6',
          creatorName: 'Vihan De Silva',
          creatorRole: 'Writer',
          creatorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
          contentType: 'Short Story',
          title: 'Cigarette after Sex'
        },
        {
          id: 'q7',
          creatorName: 'Tharushi Herath',
          creatorRole: 'Poet',
          creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
          contentType: 'Poem',
          title: 'Morning Star'
        },
        {
          id: 'q8',
          creatorName: 'Amra Shrudin',
          creatorRole: 'Artist',
          creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
          contentType: 'Artwork',
          title: 'The Skies of Ramadan'
        }
      ]
    });
  }

  // Hook up Demo Bar buttons
  const btnLoad = document.getElementById('btn-load-demo');
  const btnClear = document.getElementById('btn-clear-demo');
  const btnToggle = document.getElementById('btn-toggle-sidebar');

  if (btnLoad) btnLoad.addEventListener('click', loadDemoData);
  if (btnClear) btnClear.addEventListener('click', clearApprovalQueue);
  if (btnToggle) btnToggle.addEventListener('click', toggleSidebar);

  // Expose Global API
  window.importApprovalData = importApprovalData;
  window.loadApprovalQueue = loadApprovalQueue;
  window.clearApprovalQueue = clearApprovalQueue;
  window.loadDemoData = loadDemoData;
  window.toggleSidebar = toggleSidebar;

})();
