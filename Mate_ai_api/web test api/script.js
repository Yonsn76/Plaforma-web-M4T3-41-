// SPA-like behavior + theming + typing and auth slider
console.log("M4T3 41 site loaded");

// Debug: verificar que los elementos existan
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  console.log('Login form:', loginForm);
  console.log('Register form:', registerForm);
});

// Nav (sections)
const navLinks = [...document.querySelectorAll('.nav-pill[data-section]')];

// Typing area
const elKicker = document.getElementById('type-kicker');
const elTitle = document.getElementById('type-title');
const elText = document.getElementById('type-text');

const order = ['Inicio', 'services', 'about', 'contact'];
const copy = {
  Inicio: {
    kicker: 'GLASSMORPHISM',
    lines: [
      'Login Page',
      'M4T3 41 es una plataforma educativa para practicar y crear ejercicios con IA.',
      '• Ejercicios dinámicos y pistas adaptativas.',
      '• Seguimiento en tiempo real para docentes.',
      '• Basado en IA generativa y análisis del progreso.'
    ]
  },
  services: {
    kicker: 'SERVICES',
    lines: [
      'Qué ofrecemos',
      'Práctica personalizada impulsada por IA.',
      '• Generación automática de ejercicios.',
      '• Control de progreso y dashboards en tiempo real.',
      '• Soporte multiplataforma.'
    ]
  },
  about: {
    kicker: 'ABOUT',
    lines: [
      'Quiénes somos',
      'Hacemos del aprendizaje matemático una experiencia interactiva e inclusiva.',
      '• Pistas adaptativas y retroalimentación inteligente.',
      '• Pensado para estudiantes y docentes.'
    ]
  },
  contact: {
    kicker: 'CONTACT',
    lines: [
      'Contáctanos',
      '¿Tienes preguntas o quieres unirte?',
      '• Email: contacto@mateai.com',
      '• WhatsApp: +51 987 654 321',
      '• Huánuco, Perú'
    ]
  }
};

// Typing engine
let typingIdx = 0;
let charIdx = 0;
let current = 'Inicio';
let typingTimer = null;
let autoCycleTimer = null;

function clearTyping() {
  elTitle.textContent = '';
  elText.innerHTML = '';
}

function typeStep() {
  const lines = copy[current].lines;
  if (typingIdx >= lines.length) {
    // Finished all lines for this section -> schedule next section
    scheduleNextSection();
    return;
  }

  const targetEl = typingIdx === 0 ? elTitle : appendOrGetLine(typingIdx);
  const line = lines[typingIdx];

  targetEl.textContent = line.slice(0, charIdx + 1);
  charIdx++;

  const baseDelay = 28; // speed
  const pauseOnLineEnd = 800;

  if (charIdx < line.length) {
    typingTimer = setTimeout(typeStep, baseDelay);
  } else {
    // line done
    typingIdx++;
    charIdx = 0;
    typingTimer = setTimeout(typeStep, pauseOnLineEnd);
  }
}

function appendOrGetLine(idx) {
  // idx >= 1 goes into elText either as bullet or normal paragraph
  const existing = elText.querySelector(`[data-line="${idx}"]`);
  if (existing) return existing;
  const isBullet = copy[current].lines[idx].trim().startsWith('•');
  const p = document.createElement('p');
  p.dataset.line = String(idx);
  p.className = isBullet ? 'pl-5 before:content-[\\"•\\"] before:mr-2 before:opacity-80' : '';
  elText.appendChild(p);
  return p;
}

function setSection(section) {
  // cancel timers
  clearTimeout(typingTimer);
  clearTimeout(autoCycleTimer);

  current = section;
  elKicker.textContent = copy[current].kicker;
  clearTyping();

  // active nav
  navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === section));

  // start typing anew
  typingIdx = 0;
  charIdx = 0;
  typeStep();
}

function scheduleNextSection() {
  const i = order.indexOf(current);
  const next = order[(i + 1) % order.length];
  autoCycleTimer = setTimeout(() => setSection(next), 1200);
}

// THEME switcher
const themeButtons = document.querySelectorAll('.theme-dot');
function setTheme(theme) {
  const body = document.body;
  body.className = body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ')
    .trim();
  body.classList.add(`theme-${theme}`);
  localStorage.setItem('theme', theme);
}
function initTheme() {
  setTheme(localStorage.getItem('theme') || 'dark');
}

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
}

// Attach nav handlers
navLinks.forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    setSection(a.dataset.section || 'Inicio');
    if (mobileNav && !mobileNav.classList.contains('hidden')) mobileNav.classList.add('hidden');
  });
});

// AUTH slider with adaptive height
const authSlider = document.getElementById('authSlider');
const authTrack = document.getElementById('authTrack');
const authTabs = document.querySelectorAll('.auth-tab, .auth-link');
let currentAuth = 'login';

function measurePane(mode) {
  return mode === 'register'
    ? document.getElementById('registerForm')
    : document.getElementById('loginForm');
}

function sizeAuth(mode) {
  if (!authSlider) return;
  const pane = measurePane(mode || currentAuth);
  if (!pane) return;
  // set explicit height to allow smooth transition
  authSlider.style.height = pane.offsetHeight + 'px';
}

function setAuth(mode) {
  if (!authTrack) return;
  currentAuth = mode;
  authTrack.style.transform = mode === 'register' ? 'translateX(-50%)' : 'translateX(0%)';
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.auth === mode);
  });
  // Wait for transform to affect layout and then size container
  requestAnimationFrame(() => requestAnimationFrame(() => sizeAuth(mode)));
}

authTabs.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    setAuth(btn.dataset.auth);
  });
});

// Helpers: inline validation
function ensureErrorElement(input) {
  let holder = input.parentElement.querySelector('.field-error');
  if (!holder) {
    holder = document.createElement('p');
    holder.className = 'field-error text-xs text-red-400 mt-1';
    input.parentElement.appendChild(holder);
  }
  return holder;
}
function showError(input, message) {
  const el = ensureErrorElement(input);
  el.textContent = message;
  el.classList.remove('hidden');
  sizeAuth();
}
function clearError(input) {
  const el = input.parentElement.querySelector('.field-error');
  if (el) el.classList.add('hidden');
  sizeAuth();
}

// Password show/hide
document.querySelectorAll('.pw-toggle').forEach(btn => {
  const target = document.getElementById(btn.dataset.target);
  btn.addEventListener('click', () => {
    if (!target) return;
    const isPw = target.type === 'password';
    target.type = isPw ? 'text' : 'password';
    btn.textContent = isPw ? 'Ocultar' : 'Mostrar';
  });
});

// Forms (fake handlers + validation)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const loginUser = document.getElementById('login_user');
  const loginPass = document.getElementById('login_password');
  loginUser.addEventListener('blur', () => {
    if (!loginUser.value.trim()) showError(loginUser, 'Ingresa tu email');
    else clearError(loginUser);
  });
  loginPass.addEventListener('blur', () => {
    if (!loginPass.value.trim()) showError(loginPass, 'Ingresa tu contraseña');
    else clearError(loginPass);
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulario de login enviado');
    let ok = true;
    if (!loginUser.value.trim()) { showError(loginUser, 'Ingresa tu email'); ok = false; }
    if (!loginPass.value.trim()) { showError(loginPass, 'Ingresa tu contraseña'); ok = false; }
    if (!ok) {
      console.log('Validación falló');
      return;
    }
    console.log('Enviando datos al servidor...');
    
    const data = Object.fromEntries(new FormData(loginForm).entries());
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.usuario));
        alert(`Bienvenido, ${result.data.usuario.nombre}!`);
        // Redirigir a dashboard o página principal
      } else {
        alert(result.message || 'Error en el login');
      }
    } catch (error) {
      alert('Error de conexión. Verifica que la API esté ejecutándose.');
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const first = document.getElementById('reg_first');
  const last = document.getElementById('reg_last');
  const email = document.getElementById('reg_email');
  const rol = document.getElementById('reg_rol');
  const especialidad = document.getElementById('reg_especialidad');
  const grado = document.getElementById('reg_grado');
  const pw1 = document.getElementById('reg_password');
  const pw2 = document.getElementById('reg_password2');

  const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Mostrar/ocultar campos según el rol
  function toggleRoleFields() {
    const especialidadField = document.getElementById('especialidad-field');
    const gradoField = document.getElementById('grado-field');
    
    if (rol.value === 'docente') {
      especialidadField.style.display = 'block';
      gradoField.style.display = 'none';
      grado.value = ''; // Limpiar grado si se cambia a docente
    } else if (rol.value === 'alumno') {
      especialidadField.style.display = 'none';
      gradoField.style.display = 'block';
      especialidad.value = ''; // Limpiar especialidad si se cambia a alumno
    } else {
      especialidadField.style.display = 'none';
      gradoField.style.display = 'none';
    }
    sizeAuth(); // Reajustar altura del contenedor
  }

  rol.addEventListener('change', toggleRoleFields);

  function validateField(field) {
    if (field === first) {
      if (!first.value.trim()) return showError(first, 'Ingresa tu nombre');
      return clearError(first);
    }
    if (field === last) {
      if (!last.value.trim()) return showError(last, 'Ingresa tu apellido');
      return clearError(last);
    }
    if (field === email) {
      if (!email.value.trim()) return showError(email, 'Ingresa tu email');
      if (!emailRE.test(email.value)) return showError(email, 'Email no válido');
      return clearError(email);
    }
    if (field === rol) {
      if (!rol.value) return showError(rol, 'Selecciona tu tipo de usuario');
      return clearError(rol);
    }
    if (field === especialidad && rol.value === 'docente') {
      if (!especialidad.value.trim()) return showError(especialidad, 'Ingresa tu especialidad');
      return clearError(especialidad);
    }
    if (field === grado && rol.value === 'alumno') {
      if (!grado.value) return showError(grado, 'Selecciona tu grado');
      return clearError(grado);
    }
    if (field === pw1) {
      if (!pw1.value) return showError(pw1, 'Ingresa una contraseña');
      if (pw1.value.length < 6) return showError(pw1, 'Mínimo 6 caracteres');
      return clearError(pw1);
    }
    if (field === pw2) {
      if (!pw2.value) return showError(pw2, 'Confirma tu contraseña');
      if (pw1.value !== pw2.value) return showError(pw2, 'Las contraseñas no coinciden');
      return clearError(pw2);
    }
  }

  [first, last, email, rol, especialidad, grado, pw1, pw2].forEach(el => {
    if (el) {
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => validateField(el));
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulario de registro enviado');
    let ok = true;
    
    // Validar todos los campos
    [first, last, email, rol, pw1, pw2].forEach(el => {
      if (el) validateField(el);
    });
    
    // Validar campos específicos según el rol
    if (rol.value === 'docente' && especialidad) validateField(especialidad);
    if (rol.value === 'alumno' && grado) validateField(grado);
    
    // Verificar si hay errores
    const errorElements = registerForm.querySelectorAll('.field-error');
    errorElements.forEach(err => {
      if (!err.classList.contains('hidden')) ok = false;
    });
    
    if (!ok) return;

    const data = Object.fromEntries(new FormData(registerForm).entries());
    
    // Combinar nombre y apellido
    data.nombre = `${data.nombre} ${data.apellido}`.trim();
    delete data.apellido;
    delete data.contrasena2; // No enviar confirmación de contraseña
    
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.usuario));
        alert(`¡Cuenta creada exitosamente! Bienvenido, ${result.data.usuario.nombre}!`);
        setAuth('login');
      } else {
        alert(result.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      alert('Error de conexión. Verifica que la API esté ejecutándose.');
    }
  });
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setSection('Inicio');
  // set initial size for auth container
  sizeAuth('login');
});

// Resize handler to keep height adaptive
window.addEventListener('resize', () => sizeAuth());

// Theme buttons
themeButtons.forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));