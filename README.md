# Scriptorium — Single Unified Port Architecture (`v2`)

## 1. Architecture Overview (Unified Origin / Monolithic Web Server)
In this architecture, both the **Frontend Web Pages** and the **PHP / MySQL API** are served from the **exact same host and port**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Single Unified Host (e.g., http://localhost:8000/)           │
│                                                                             │
│  Frontend Assets:                 API Endpoints:          Uploads Storage:  │
│  /index.html                      /api/auth.php           /uploads/*.webp   │
│  /gallery.html                    /api/posts.php                            │
│  /dashboard.html                  /api/events.php                           │
│  /admin.html                      /api/social.php                           │
│  /js/..., /css/...                /api/users.php                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
                              MySQL Database (3306)
                              `scriptorium`
```

### Key Advantages:
1. **Zero CORS Friction:** No cross-origin preflight requests (`OPTIONS`), no domain whitelist configuration.
2. **Simplified Cookie Sessions:** Standard `SameSite=Lax; HttpOnly` cookies work natively.
3. **Single Command Run:** One command starts both the frontend and backend simultaneously.
4. **XAMPP / Production Ready:** Can be copied directly into `C:\xampp\htdocs\scriptorium` and opened in Apache.

---

## 2. Quick Setup & Run Guide

### Option A: Using the PHP Built-in Server (Recommended & Instant)

#### Step 1: Start MySQL in XAMPP
Open **XAMPP Control Panel** and click **Start** next to **MySQL**.

#### Step 2: Initialize Database & Seed Data
Run the one-click migrator:
```powershell
& "C:\xampp\php\php.exe" api/setup.php
```

#### Step 3: Start the Unified Server (Single Port 8000)
```powershell
# From this directory:
& "C:\xampp\php\php.exe" -S localhost:8000 router.php
```
Open your browser to: **`http://localhost:8000/`**
- Web pages load at: `http://localhost:8000/index.html`
- API endpoints respond at: `http://localhost:8000/api/`
- Uploaded media loads at: `http://localhost:8000/uploads/`

---

### Option B: Deploying directly into XAMPP Apache
1. Copy this folder into `C:\xampp\htdocs\scriptorium\`.
2. Start both **Apache** and **MySQL** in XAMPP Control Panel.
3. Open `http://localhost/scriptorium/api/setup.php` to initialize the database.
4. Open `http://localhost/scriptorium/scriptorium/` in your browser.

---

## 3. Configuration
- **API Base URL:** Configured in `scriptorium/js/core/config.js`:
  ```javascript
  export const API_BASE = '/api'; // Relative same-origin path
  ```

---

## 4. Default Seed Credentials
- **Admin Email:** `admin@scriptorium.lk`
- **Admin Password:** `Admin@2026`
- **Demo Members:** `nethmi@example.com`, `kavindu@example.com`, `dilan@example.com` (password: `Admin@2026`)
