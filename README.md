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
