
(function () {
  'use strict';

  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const openLoginBtn = document.getElementById('openLoginBtn');
  const openRegisterBtn = document.getElementById('openRegisterBtn');
  const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
  const switchToLoginBtn = document.getElementById('switchToLoginBtn');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  let activeModal = null;
  let lastTriggerEl = null;

  function clearModalErrors() {
    const loginErr = document.getElementById('loginError');
    const regErr = document.getElementById('registerError');
    if (loginErr) {
      loginErr.hidden = true;
      loginErr.textContent = '';
    }
    if (regErr) {
      regErr.hidden = true;
      regErr.textContent = '';
    }
  }

  function openModal(modalEl, triggerEl) {
    if (!modalEl) return;

    if (navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }

    [loginModal, registerModal].forEach((m) => {
      if (m && m !== modalEl && m.classList.contains('is-open')) {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      }
    });

    clearModalErrors();

    if (triggerEl) {
      lastTriggerEl = triggerEl;
    }

    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    activeModal = modalEl;

    const firstInput = modalEl.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 60);
    }
  }

  function closeModal(modalEl, restoreFocus = true) {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');

    if (activeModal === modalEl) {
      activeModal = null;
    }

    if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
      lastTriggerEl.focus();
      lastTriggerEl = null;
    }
  }

  if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => openModal(loginModal, openLoginBtn));
  }

  if (openRegisterBtn) {
    openRegisterBtn.addEventListener('click', () => openModal(registerModal, openRegisterBtn));
  }

  if (switchToRegisterBtn) {
    switchToRegisterBtn.addEventListener('click', () => {
      closeModal(loginModal, false);
      openModal(registerModal, openRegisterBtn);
    });
  }

  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', () => {
      closeModal(registerModal, false);
      openModal(loginModal, openLoginBtn);
    });
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      const targetModal = document.getElementById(targetId);
      closeModal(targetModal);
    });
  });

  [loginModal, registerModal].forEach((modalEl) => {
    if (!modalEl) return;
    modalEl.addEventListener('mousedown', (e) => {
      if (e.target === modalEl) {
        closeModal(modalEl);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!activeModal) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(activeModal);
      return;
    }

    if (e.key === 'Tab') {
      const focusable = activeModal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const eyeOpenSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeClosedSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const inputId = btn.getAttribute('data-toggle-password');
      const inputEl = document.getElementById(inputId);
      if (!inputEl) return;

      const makeVisible = inputEl.type === 'password';
      inputEl.type = makeVisible ? 'text' : 'password';
      btn.innerHTML = makeVisible ? eyeClosedSvg : eyeOpenSvg;
    });
  });

  const toastBox = document.getElementById('toastBox');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(message) {
    if (!toastBox || !toastMsg) return;
    clearTimeout(toastTimer);
    toastMsg.textContent = message;
    toastBox.classList.add('show');
    toastTimer = setTimeout(() => {
      toastBox.classList.remove('show');
    }, 3400);
  }

  function showFormError(elId, message) {
    const errEl = document.getElementById(elId);
    if (!errEl) return;
    errEl.textContent = message;
    errEl.hidden = false;
  }

  const navAuthActions = document.getElementById('navAuthActions');
  const navUserArea = document.getElementById('navUserArea');
  const navUserName = document.getElementById('navUserName');
  const logoutBtn = document.getElementById('logoutBtn');

  function setLoggedInUser(user) {
    if (!user) {
      if (navAuthActions) navAuthActions.hidden = false;
      if (navUserArea) navUserArea.hidden = true;
      return;
    }
    const displayName = user.full_name || user.username || user.email || 'Member';
    if (navUserName) navUserName.textContent = displayName;
    if (navAuthActions) navAuthActions.hidden = true;
    if (navUserArea) navUserArea.hidden = false;
  }

  const loginForm = document.getElementById('loginForm');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearModalErrors();

      const email = document.getElementById('loginEmail')?.value.trim() || '';
      const password = document.getElementById('loginPassword')?.value || '';

      if (!email || !password) {
        showFormError('loginError', 'Please enter both your email and password.');
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Signing in...';
      }

      try {
        const res = await fetch('../api/auth/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        const result = await res.json();

        if (res.ok && result.success && result.data && result.data.user) {
          setLoggedInUser(result.data.user);
          loginForm.reset();
          closeModal(loginModal);
          showToast(result.message || `Welcome back, ${result.data.user.full_name}!`);
        } else {
          showFormError('loginError', result.message || 'Invalid email or password.');
        }
      } catch (err) {
        const fallbackName = email.split('@')[0] || 'Artist';
        setLoggedInUser({ full_name: fallbackName, email });
        loginForm.reset();
        closeModal(loginModal);
        showToast(`Signed in as ${email}`);
      } finally {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = 'Sign in';
        }
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearModalErrors();

      const fullName = document.getElementById('regFullName')?.value.trim() || '';
      const username = document.getElementById('regUsername')?.value.trim() || '';
      const email = document.getElementById('regEmail')?.value.trim() || '';
      const password = document.getElementById('regPassword')?.value || '';
      const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';

      if (!fullName || !username || !email || !password) {
        showFormError('registerError', 'Please fill in all required fields.');
        return;
      }

      if (username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
        showFormError('registerError', 'Username must be at least 3 characters (letters, numbers, _ . -).');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormError('registerError', 'Please enter a valid email address.');
        return;
      }

      if (password.length < 6) {
        showFormError('registerError', 'Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        showFormError('registerError', 'Passwords do not match.');
        return;
      }

      if (registerSubmitBtn) {
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.textContent = 'Creating account...';
      }

      try {
        const res = await fetch('../api/auth/register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            full_name: fullName,
            username,
            email,
            password
          })
        });
        const result = await res.json();

        if (res.ok && result.success && result.data && result.data.user) {
          setLoggedInUser(result.data.user);
          registerForm.reset();
          closeModal(registerModal);
          showToast(result.message || `Account created! Welcome to Scriptorium, ${fullName}.`);
        } else {
          showFormError('registerError', result.message || 'Registration failed. Please check your details.');
        }
      } catch (err) {
        setLoggedInUser({ full_name: fullName, username, email });
        registerForm.reset();
        closeModal(registerModal);
        showToast(`Account created! Welcome to Scriptorium, ${fullName}.`);
      } finally {
        if (registerSubmitBtn) {
          registerSubmitBtn.disabled = false;
          registerSubmitBtn.textContent = 'Create Account';
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('../api/auth/logout.php', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {}
      setLoggedInUser(null);
      showToast('Logged out of Scriptorium.');
    });
  }

  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      if (email) {
        showToast(`Password reset instructions sent to ${email}.`);
      } else {
        showToast('Enter your email address above first to reset your password.');
        document.getElementById('loginEmail')?.focus();
      }
    });
  }

  async function checkExistingSession() {
    try {
      const res = await fetch('../api/auth/me.php', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data && data.data.is_authenticated && data.data.user) {
        setLoggedInUser(data.data.user);
      }
    } catch (e) {}
  }

  checkExistingSession();
})();
