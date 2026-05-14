/* ============================================
   ClienteAPP — Autenticación y Sesiones
   ============================================ */

const SESSION_KEY = 'clienteapp_session';
// Intentos fallidos para bloqueo temporal
let _loginAttempts = 0;
let _lockUntil = 0;

window.Auth = {

  // ── Login ────────────────────────────────────────────────────────────────
  async login(loginInput, password) {
    // Verificar bloqueo temporal
    if (Date.now() < _lockUntil) {
      const segs = Math.ceil((_lockUntil - Date.now()) / 1000);
      throw new Error(`Demasiados intentos. Espera ${segs} segundos.`);
    }

    const usuarios = await DB.getAll(DB.STORES.usuarios);
    const user = usuarios.find(u =>
      u.login === loginInput.trim() &&
      u.password === btoa(password) &&
      u.activo !== false
    );

    if (!user) {
      _loginAttempts++;
      if (_loginAttempts >= 5) {
        _lockUntil = Date.now() + 30000; // 30 segundos de bloqueo
        _loginAttempts = 0;
        throw new Error('Demasiados intentos fallidos. Bloqueado 30 segundos.');
      }
      const restantes = 5 - _loginAttempts;
      throw new Error(`Usuario o contraseña incorrectos. ${restantes} intento${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''}.`);
    }

    // Login exitoso — resetear intentos
    _loginAttempts = 0;
    _lockUntil = 0;

    const session = {
      id:        user.id,
      nombre:    user.nombre,
      login:     user.login,
      rol:       user.rol,
      loginTime: new Date().toISOString()
    };

    // Guardar en sessionStorage (se borra al cerrar pestaña/navegador)
    // Esto garantiza que siempre pida login al abrir la app de nuevo
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  // ── Logout ───────────────────────────────────────────────────────────────
  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  },

  // ── Obtener sesión actual ─────────────────────────────────────────────────
  getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // ── Verificar si está autenticado ─────────────────────────────────────────
  isAuthenticated() {
    return !!this.getSession();
  },

  // ── Verificar rol ─────────────────────────────────────────────────────────
  hasRole(...roles) {
    const session = this.getSession();
    return session && roles.includes(session.rol);
  },

  // ── Es admin ──────────────────────────────────────────────────────────────
  isAdmin() {
    return this.hasRole('admin');
  },

  // ── Nombre del rol ────────────────────────────────────────────────────────
  getRoleName(rol) {
    const names = {
      admin:   'Administrador',
      asesor:  'Asesor de Ventas',
      tecnico: 'Técnico de Obra'
    };
    return names[rol] || rol;
  }
};
