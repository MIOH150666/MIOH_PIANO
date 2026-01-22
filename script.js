/* =========================
   CONFIGURACIÓN DE FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyDzOeVbDXSZ241Gxhg8bKe1mYG8tNbkizc",
  authDomain: "mioh-piano.firebaseapp.com",
  projectId: "mioh-piano",
  storageBucket: "mioh-piano.firebasestorage.app",
  messagingSenderId: "403499857318",
  appId: "1:403499857318:web:747574433b4f6e40dd4b67",
  measurementId: "G-48RFCZWC0H"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/* =========================
   ELEMENTOS DE LA INTERFAZ DE AUTENTICACIÓN
========================= */
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('confirmPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const authLoading = document.getElementById('authLoading');

// Elementos del usuario
const userBar = document.getElementById('userBar');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const synthContainer = document.getElementById('synthContainer');

/* =========================
   FUNCIONES DE AUTENTICACIÓN
========================= */
function showLoading() {
    authLoading.style.display = 'block';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
}

function hideLoading() {
    authLoading.style.display = 'none';
}

function showAuthForm(form) {
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    
    if (form === 'login') {
        loginForm.style.display = 'block';
        loginForm.classList.add('active');
        registerForm.style.display = 'none';
    } else {
        registerForm.style.display = 'block';
        registerForm.classList.add('active');
        loginForm.style.display = 'none';
    }
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('active');
    setTimeout(() => {
        element.classList.remove('active');
    }, 5000);
}

function clearErrors() {
    loginError.classList.remove('active');
    registerError.classList.remove('active');
    loginError.textContent = '';
    registerError.textContent = '';
}

function showSynth(user) {
    // Ocultar modal de autenticación
    authModal.style.display = 'none';
    
    // Mostrar barra de usuario
    userBar.style.display = 'block';
    userEmail.textContent = user.email;
    
    // Mostrar sintetizador
    synthContainer.style.display = 'flex';
    
    // Inicializar sintetizador (si no está inicializado)
    if (!window.synthInitialized) {
        initializeSynth();
        window.synthInitialized = true;
    }
}

function hideSynth() {
    // Mostrar modal de autenticación
    authModal.style.display = 'flex';
    
    // Ocultar barra de usuario
    userBar.style.display = 'none';
    
    // Ocultar sintetizador
    synthContainer.style.display = 'none';
    
    // Limpiar formularios
    loginEmail.value = '';
    loginPassword.value = '';
    registerEmail.value = '';
    registerPassword.value = '';
    confirmPassword.value = '';
    clearErrors();
    
    // Mostrar formulario de login por defecto
    showAuthForm('login');
}

/* =========================
   EVENT LISTENERS PARA AUTENTICACIÓN
========================= */
// Cambiar entre formularios
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    clearErrors();
    showAuthForm('register');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    clearErrors();
    showAuthForm('login');
});

// Iniciar sesión - CON VERIFICACIÓN DE EMAIL
loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    if (!email || !password) {
        showError(loginError, 'Por favor, completa todos los campos');
        return;
    }
    
    try {
        showLoading();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // VERIFICAR SI EL EMAIL ESTÁ CONFIRMADO
        if (!userCredential.user.emailVerified) {
            await auth.signOut(); // Cerrar sesión automáticamente
            hideLoading();
            showAuthForm('login');
            
            // Opción 1: Mostrar error
            showError(loginError, 'Por favor, verifica tu email primero. Revisa tu bandeja de entrada.');
            
            // Opción 2: Preguntar si quiere reenviar el email de verificación
            const resend = confirm('Tu email no ha sido verificado. ¿Quieres que reenviemos el email de verificación?');
            if (resend) {
                try {
                    await userCredential.user.sendEmailVerification();
                    showError(loginError, 'Email de verificación reenviado. Revisa tu bandeja de entrada.');
                } catch (verificationError) {
                    showError(loginError, 'Error al reenviar email de verificación. Contacta al administrador.');
                }
            }
            return;
        }
        
        showSynth(userCredential.user);
    } catch (error) {
        hideLoading();
        showAuthForm('login');
        
        let errorMessage = 'Error al iniciar sesión';
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Usuario deshabilitado';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Verifica tu internet';
                break;
        }
        showError(loginError, errorMessage);
    }
});

// Registrar usuario - CON ENVÍO DE VERIFICACIÓN
registerBtn.addEventListener('click', async () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirm = confirmPassword.value.trim();
    
    if (!email || !password || !confirm) {
        showError(registerError, 'Por favor, completa todos los campos');
        return;
    }
    
    if (password !== confirm) {
        showError(registerError, 'Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showError(registerError, 'La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(registerError, 'Por favor, ingresa un email válido');
        return;
    }
    
    try {
        showLoading();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // ENVIAR EMAIL DE VERIFICACIÓN
        await userCredential.user.sendEmailVerification();
        
        // Cerrar sesión inmediatamente (requiere verificación primero)
        await auth.signOut();
        
        hideLoading();
        showAuthForm('login');
        
        // Mostrar mensaje informativo
        showError(loginError, '¡Registro exitoso! Se ha enviado un email de verificación a ' + email + '. Por favor, verifica tu email antes de iniciar sesión.');
        
    } catch (error) {
        hideLoading();
        showAuthForm('register');
        
        let errorMessage = 'Error al registrar usuario';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este email ya está registrado';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operación no permitida';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es demasiado débil';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Verifica tu internet';
                break;
        }
        showError(registerError, errorMessage);
    }
});

// Cerrar sesión
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        hideSynth();
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
});

// Permitir iniciar sesión con Enter
loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

confirmPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        registerBtn.click();
    }
});

/* =========================
   FUNCIÓN PARA REENVIAR EMAIL DE VERIFICACIÓN
========================= */
function resendVerificationEmail() {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
        user.sendEmailVerification()
            .then(() => {
                showError(loginError, 'Email de verificación reenviado. Revisa tu bandeja de entrada.');
            })
            .catch((error) => {
                showError(loginError, 'Error al reenviar email: ' + error.message);
            });
    }
}

/* =========================
   ESTADO DE AUTENTICACIÓN
========================= */
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuario autenticado - VERIFICAR EMAIL
        if (user.emailVerified) {
            showSynth(user);
        } else {
            // Usuario no ha verificado email - mostrar advertencia
            authModal.style.display = 'flex';
            userBar.style.display = 'none';
            synthContainer.style.display = 'none';
            showAuthForm('login');
            
            // Mostrar mensaje específico
            loginError.textContent = 'Tu email no ha sido verificado. Por favor, verifica tu email antes de acceder.';
            loginError.classList.add('active');
            
            // Limpiar campos
            loginEmail.value = user.email;
            loginPassword.value = '';
        }
    } else {
        // Usuario no autenticado
        hideSynth();
    }
});

/* =========================
   INICIALIZACIÓN DEL SINTETIZADOR
========================= */
let audioCtx, masterGain, filter, lfoOscillator, lfoGain;
let lfoEnabled = false;
let currentLFOMode = "tremolo";
let phaserNode = null;
let activeNotes = {};
let analyser, bufferLength, dataArray, waveformData;
let waveformCanvas, spectrumCanvas, waveformCtx, spectrumCtx;

const oscConfig = {
    1: { 
        wave: "sine",     
        level: 0.7, 
        octave: 1,
        harmonics: {
            h1: 1.0,
            h3: 0.0,
            h5: 0.0,
            h7: 0.0
        }
    },
    2: { 
        wave: "triangle", 
        level: 0.7, 
        octave: 1,
        harmonics: {
            h1: 1.0,
            h3: 0.0,
            h5: 0.0,
            h7: 0.0
        }
    }
};

const keyMap = {
    a:0,  w:1,  s:2,  e:3,  d:4,
    f:5,  t:6,  g:7,  y:8,  h:9,
    u:10, j:11, k:12,
    o:13, l:14,
    p:15, "ñ":16
};

const C1 = 32.7;

function initializeSynth() {
    /* =========================
       AUDIO CONTEXT
    ========================= */
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    /* =========================
       VISUALIZACIÓN - ANALIZADOR DE AUDIO
    ========================= */
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    waveformData = new Uint8Array(bufferLength);

    /* =========================
       CANVAS PARA VISUALIZACIÓN
    ========================= */
    waveformCanvas = document.getElementById('waveformCanvas');
    spectrumCanvas = document.getElementById('spectrumCanvas');
    waveformCtx = waveformCanvas.getContext('2d');
    spectrumCtx = spectrumCanvas.getContext('2d');

    waveformCanvas.width = 400;
    waveformCanvas.height = 150;
    spectrumCanvas.width = 400;
    spectrumCanvas.height = 150;

    /* =========================
       MASTER + FILTER + ANALIZADOR
    ========================= */
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;

    filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 8000;
    filter.Q.value = 0.7;

    // Conexión inicial del audio chain
    masterGain.connect(filter);
    filter.connect(analyser);
    analyser.connect(audioCtx.destination);

    /* =========================
       LFO SYSTEM - TRES TIPOS
    ========================= */
    lfoOscillator = audioCtx.createOscillator();
    lfoGain = audioCtx.createGain();

    lfoOscillator.type = "sine";
    lfoOscillator.frequency.value = 5;
    lfoGain.gain.value = 0;

    lfoOscillator.connect(lfoGain);
    lfoOscillator.start();

    /* =========================
       ELEMENTOS UI DEL SINTETIZADOR
    ========================= */
    const pianoKeys = document.querySelectorAll(".key");
    const volumeSlider = document.getElementById("volumeSlider");
    const showKeys = document.getElementById("showKeys");
    
    // Controles de forma de onda
    const waveBtnsOsc1 = document.querySelectorAll(".wave-btn.osc1");
    const waveBtnsOsc2 = document.querySelectorAll(".wave-btn.osc2");
    
    // Controles de armónicos
    const harmonic1_1 = document.getElementById("harmonic1-1");
    const harmonic1_3 = document.getElementById("harmonic1-3");
    const harmonic1_5 = document.getElementById("harmonic1-5");
    const harmonic1_7 = document.getElementById("harmonic1-7");
    const harmonic2_1 = document.getElementById("harmonic2-1");
    const harmonic2_3 = document.getElementById("harmonic2-3");
    const harmonic2_5 = document.getElementById("harmonic2-5");
    const harmonic2_7 = document.getElementById("harmonic2-7");
    
    // Valores de armónicos
    const harmonic1_1_value = document.getElementById("harmonic1-1-value");
    const harmonic1_3_value = document.getElementById("harmonic1-3-value");
    const harmonic1_5_value = document.getElementById("harmonic1-5-value");
    const harmonic1_7_value = document.getElementById("harmonic1-7-value");
    const harmonic2_1_value = document.getElementById("harmonic2-1-value");
    const harmonic2_3_value = document.getElementById("harmonic2-3-value");
    const harmonic2_5_value = document.getElementById("harmonic2-5-value");
    const harmonic2_7_value = document.getElementById("harmonic2-7-value");
    
    const level1 = document.getElementById("level1");
    const level2 = document.getElementById("level2");
    const octave1 = document.getElementById("octave1");
    const octave2 = document.getElementById("octave2");
    const oct1Label = document.getElementById("oct1Label");
    const oct2Label = document.getElementById("oct2Label");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const cutoffSlider = document.getElementById("cutoffSlider");
    const resonanceSlider = document.getElementById("resonanceSlider");
    const cutoffValue = document.getElementById("cutoffValue");
    const resonanceValue = document.getElementById("resonanceValue");
    const lfoTypeBtns = document.querySelectorAll(".lfo-type-btn");
    const lfoToggle = document.getElementById("lfoToggle");
    const lfoRate = document.getElementById("lfoRate");
    const lfoDepth = document.getElementById("lfoDepth");
    const lfoRateValue = document.getElementById("lfoRateValue");
    const lfoDepthValue = document.getElementById("lfoDepthValue");

    /* =========================
       FUNCIONES DE VISUALIZACIÓN
    ========================= */
    function drawWaveform() {
        analyser.getByteTimeDomainData(waveformData);
        
        waveformCtx.fillStyle = '#001108';
        waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        
        waveformCtx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
        waveformCtx.lineWidth = 1;
        
        for(let i = 0; i <= 4; i++) {
            const y = i * (waveformCanvas.height / 4);
            waveformCtx.beginPath();
            waveformCtx.moveTo(0, y);
            waveformCtx.lineTo(waveformCanvas.width, y);
            waveformCtx.stroke();
        }
        
        waveformCtx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
        waveformCtx.beginPath();
        waveformCtx.moveTo(0, waveformCanvas.height / 2);
        waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
        waveformCtx.stroke();
        
        waveformCtx.strokeStyle = '#00ff66';
        waveformCtx.lineWidth = 2;
        waveformCtx.beginPath();
        
        const sliceWidth = waveformCanvas.width / bufferLength;
        let x = 0;
        
        for(let i = 0; i < bufferLength; i++) {
            const v = waveformData[i] / 128.0;
            const y = v * waveformCanvas.height / 2;
            
            if(i === 0) {
                waveformCtx.moveTo(x, y);
            } else {
                waveformCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
        waveformCtx.stroke();
        
        waveformCtx.shadowColor = '#00ff66';
        waveformCtx.shadowBlur = 10;
        waveformCtx.stroke();
        waveformCtx.shadowBlur = 0;
    }

    function drawSpectrum() {
        analyser.getByteFrequencyData(dataArray);
        
        spectrumCtx.fillStyle = '#001108';
        spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
        
        spectrumCtx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
        spectrumCtx.lineWidth = 1;
        
        for(let i = 0; i <= 8; i++) {
            const x = i * (spectrumCanvas.width / 8);
            spectrumCtx.beginPath();
            spectrumCtx.moveTo(x, 0);
            spectrumCtx.lineTo(x, spectrumCanvas.height);
            spectrumCtx.stroke();
        }
        
        const barWidth = (spectrumCanvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        const gradient = spectrumCtx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
        gradient.addColorStop(0, '#00ff66');
        gradient.addColorStop(0.5, '#00cc55');
        gradient.addColorStop(1, '#009944');
        
        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            spectrumCtx.fillStyle = gradient;
            spectrumCtx.fillRect(x, spectrumCanvas.height - barHeight, barWidth, barHeight);
            
            if(barHeight > 100) {
                spectrumCtx.shadowColor = '#00ff66';
                spectrumCtx.shadowBlur = 10;
                spectrumCtx.fillRect(x, spectrumCanvas.height - barHeight, barWidth, barHeight);
                spectrumCtx.shadowBlur = 0;
            }
            
            x += barWidth + 1;
        }
        
        // Mostrar línea del cutoff del filtro
        if (filter) {
            const cutoffRatio = filter.frequency.value / 12000;
            const cutoffX = cutoffRatio * spectrumCanvas.width;
            
            spectrumCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            spectrumCtx.lineWidth = 1;
            spectrumCtx.setLineDash([5, 3]);
            spectrumCtx.beginPath();
            spectrumCtx.moveTo(cutoffX, 0);
            spectrumCtx.lineTo(cutoffX, spectrumCanvas.height);
            spectrumCtx.stroke();
            spectrumCtx.setLineDash([]);
        }
    }

    function animateVisualizations() {
        drawWaveform();
        drawSpectrum();
        requestAnimationFrame(animateVisualizations);
    }

    animateVisualizations();

    /* =========================
       AUDIO UNLOCK
    ========================= */
    document.addEventListener("mousedown", () => {
        if (audioCtx.state === "suspended") audioCtx.resume();
    }, { once: true });

    /* =========================
       LFO HELPER FUNCTIONS
    ========================= */
    function setupLFOMode() {
        lfoGain.disconnect();
        lfoOscillator.connect(lfoGain);
        
        switch(currentLFOMode) {
            case "tremolo":
                lfoGain.gain.value = lfoEnabled ? parseFloat(lfoDepth.value) : 0;
                break;
                
            case "vibrato":
                lfoGain.gain.value = lfoEnabled ? parseFloat(lfoDepth.value) * 50 : 0;
                break;
                
            case "phaser":
                if (lfoEnabled) {
                    setupPhaser();
                } else {
                    disconnectPhaser();
                }
                break;
        }
    }

    function setupPhaser() {
        // Limpiar phaser anterior si existe
        disconnectPhaser();
        
        // Crear nodos del phaser
        phaserNode = {
            input: audioCtx.createGain(),
            output: audioCtx.createGain(),
            dry: audioCtx.createGain(),
            wet: audioCtx.createGain(),
            feedback: audioCtx.createGain(),
            filters: []
        };
        
        // Configurar ganancias
        phaserNode.dry.gain.value = 0.5;  // 50% señal seca
        phaserNode.wet.gain.value = 0.5;  // 50% señal procesada
        phaserNode.feedback.gain.value = 0.7;  // Cantidad de feedback
        
        // Crear 4 filtros allpass en serie (típico en phasers)
        const stages = 4;
        let lastFilter = phaserNode.input;
        
        for (let i = 0; i < stages; i++) {
            const filter = audioCtx.createBiquadFilter();
            filter.type = "allpass";
            filter.frequency.value = 350 + (i * 100);  // Frecuencias escalonadas
            filter.Q.value = 1.0;
            
            // Conectar el LFO a la frecuencia del filtro
            lfoGain.connect(filter.frequency);
            
            lastFilter.connect(filter);
            lastFilter = filter;
            phaserNode.filters.push(filter);
        }
        
        // Conectar la última etapa al output wet
        lastFilter.connect(phaserNode.wet);
        
        // Crear feedback loop
        lastFilter.connect(phaserNode.feedback);
        phaserNode.feedback.connect(phaserNode.input);
        
        // Crear dry path (bypass)
        phaserNode.input.connect(phaserNode.dry);
        
        // Mezclar dry y wet
        phaserNode.dry.connect(phaserNode.output);
        phaserNode.wet.connect(phaserNode.output);
        
        // CORRECCIÓN: Conectar el phaser EN SERIE con el filtro
        // 1. Desconectar masterGain del filtro
        masterGain.disconnect();
        
        // 2. Conectar masterGain al input del phaser
        masterGain.connect(phaserNode.input);
        
        // 3. Conectar la salida del phaser al filtro (el filtro sigue conectado al analyser)
        phaserNode.output.connect(filter);
        
        // Configurar el LFO para el phaser
        lfoOscillator.frequency.value = parseFloat(lfoRate.value);
        lfoGain.gain.value = parseFloat(lfoDepth.value) * 1000;  // Rango de modulación
        
        // Establecer rango de frecuencia base para los filtros
        const baseFreq = 800;
        phaserNode.filters.forEach((filter, index) => {
            filter.frequency.value = baseFreq + (index * 200);
        });
    }

    function disconnectPhaser() {
        if (phaserNode) {
            // Desconectar todos los nodos
            if (phaserNode.input) phaserNode.input.disconnect();
            if (phaserNode.output) phaserNode.output.disconnect();
            if (phaserNode.dry) phaserNode.dry.disconnect();
            if (phaserNode.wet) phaserNode.wet.disconnect();
            if (phaserNode.feedback) phaserNode.feedback.disconnect();
            
            // Desconectar filtros del phaser y desconectar LFO de ellos
            if (phaserNode.filters) {
                phaserNode.filters.forEach(filter => {
                    if (filter) {
                        // Desconectar el LFO de los filtros del phaser
                        lfoGain.disconnect(filter.frequency);
                        filter.disconnect();
                    }
                });
            }
            
            phaserNode = null;
        }
        
        // CORRECCIÓN: Reconectar audio chain normal manteniendo el filtro
        if (masterGain && filter && analyser) {
            // Desconectar masterGain de donde esté conectado
            masterGain.disconnect();
            
            // Reconectar masterGain directamente al filtro
            masterGain.connect(filter);
            
            // Asegurarse de que el filtro esté conectado al analyser
            // (esto ya debería estar así desde la inicialización)
            filter.connect(analyser);
        }
    }

    /* =========================
       NOTE FUNCTIONS
    ========================= */
    function calcFreq(key, oscIndex, harmonicMultiplier = 1) {
        return C1 *
            Math.pow(2, oscConfig[oscIndex].octave - 1) *
            Math.pow(2, keyMap[key] / 12) *
            harmonicMultiplier;
    }

    function playNote(key) {
        if (activeNotes[key]) return;
        if (keyMap[key] === undefined) return;

        const now = audioCtx.currentTime;
        const nodes = { oscillators: [], gains: [] };

        [1, 2].forEach(i => {
            const baseFreq = calcFreq(key, i);
            const oscLevel = oscConfig[i].level;
            const harmonics = oscConfig[i].harmonics;
            
            const mixer = audioCtx.createGain();
            mixer.gain.value = 1.0;
            
            const harmonicFrequencies = [
                { freq: baseFreq, gain: harmonics.h1 },
                { freq: baseFreq * 3, gain: harmonics.h3 },
                { freq: baseFreq * 5, gain: harmonics.h5 },
                { freq: baseFreq * 7, gain: harmonics.h7 }
            ];
            
            harmonicFrequencies.forEach((harmonic, index) => {
                if (harmonic.gain > 0) {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    
                    osc.type = oscConfig[i].wave;
                    osc.frequency.value = harmonic.freq;
                    
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(
                        oscLevel * harmonic.gain,
                        now + 0.01
                    );
                    
                    if (lfoEnabled) {
                        switch(currentLFOMode) {
                            case "tremolo":
                                lfoGain.connect(gain.gain);
                                break;
                                
                            case "vibrato":
                                lfoGain.connect(osc.frequency);
                                break;
                        }
                    }
                    
                    osc.connect(gain);
                    gain.connect(mixer);
                    
                    osc.start(now);
                    nodes.oscillators.push(osc);
                    nodes.gains.push(gain);
                }
            });
            
            if (nodes.oscillators.length === 0 && harmonics.h1 > 0) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = oscConfig[i].wave;
                osc.frequency.value = baseFreq;
                
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(
                    oscLevel * harmonics.h1,
                    now + 0.01
                );
                
                if (lfoEnabled) {
                    switch(currentLFOMode) {
                        case "tremolo":
                            lfoGain.connect(gain.gain);
                            break;
                            
                        case "vibrato":
                            lfoGain.connect(osc.frequency);
                            break;
                    }
                }
                
                osc.connect(gain);
                gain.connect(mixer);
                
                osc.start(now);
                nodes.oscillators.push(osc);
                nodes.gains.push(gain);
            }
            
            mixer.connect(masterGain);
            nodes.mixer = mixer;
        });

        activeNotes[key] = nodes;

        const keyEl = document.querySelector(`.key[data-key="${key}"]`);
        if (keyEl) keyEl.classList.add("active");
    }

    function stopNote(key) {
        const note = activeNotes[key];
        if (!note) return;

        const now = audioCtx.currentTime;

        if (note.oscillators && note.oscillators.length > 0) {
            note.oscillators.forEach((osc, index) => {
                if (note.gains[index]) {
                    note.gains[index].gain.cancelScheduledValues(now);
                    note.gains[index].gain.setValueAtTime(note.gains[index].gain.value, now);
                    note.gains[index].gain.linearRampToValueAtTime(0, now + 0.05);
                }
                
                try {
                    osc.stop(now + 0.06);
                } catch (e) {
                    console.log("Oscilador ya detenido");
                }
            });
        }
        
        if (note.mixer) {
            note.mixer.disconnect();
        }

        delete activeNotes[key];

        const keyEl = document.querySelector(`.key[data-key="${key}"]`);
        if (keyEl) keyEl.classList.remove("active");
    }

    /* =========================
       CLEANUP FUNCTION
    ========================= */
    function cleanupAllNotes() {
        const now = audioCtx.currentTime;
        
        for (const key in activeNotes) {
            const note = activeNotes[key];
            
            if (note.oscillators) {
                note.oscillators.forEach((osc, index) => {
                    if (note.gains[index]) {
                        note.gains[index].gain.cancelScheduledValues(now);
                        note.gains[index].gain.setValueAtTime(0, now);
                    }
                    try {
                        osc.stop(now);
                    } catch(e) {}
                });
            }
            
            if (note.mixer) {
                note.mixer.disconnect();
            }
            
            const keyEl = document.querySelector(`.key[data-key="${key}"]`);
            if (keyEl) keyEl.classList.remove("active");
        }
        
        for (const key in activeNotes) {
            delete activeNotes[key];
        }
    }

    /* =========================
       KEYBOARD EVENTS
    ========================= */
    document.addEventListener("keydown", e => {
        const key = e.key.toLowerCase();
        if (keyMap[key] !== undefined && !e.repeat) {
            playNote(key);
        }
    });

    document.addEventListener("keyup", e => {
        const key = e.key.toLowerCase();
        if (keyMap[key] !== undefined) {
            stopNote(key);
        }
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            cleanupAllNotes();
        }
    });

    /* =========================
       MOUSE EVENTS
    ========================= */
    pianoKeys.forEach(k => {
        const key = k.dataset.key;
        k.addEventListener("mousedown", () => playNote(key));
        k.addEventListener("mouseup", () => stopNote(key));
        k.addEventListener("mouseleave", () => stopNote(key));
    });

    /* =========================
       FUNCIONES DE ACTUALIZACIÓN DE VALORES
    ========================= */
    function updateCutoffValue() {
        const value = parseFloat(cutoffSlider.value);
        cutoffValue.textContent = value >= 1000 ? 
            `${(value/1000).toFixed(1)} kHz` : 
            `${Math.round(value)} Hz`;
    }

    function updateResonanceValue() {
        const value = parseFloat(resonanceSlider.value);
        resonanceValue.textContent = value.toFixed(1);
    }

    function updateLFORateValue() {
        const value = parseFloat(lfoRate.value);
        lfoRateValue.textContent = `${value.toFixed(1)} Hz`;
    }

    function updateLFODepthValue() {
        const value = parseFloat(lfoDepth.value);
        lfoDepthValue.textContent = value.toFixed(2);
    }

    /* =========================
       UI CONTROLS
    ========================= */
    // MASTER
    volumeSlider.oninput = () => masterGain.gain.value = volumeSlider.value;
    showKeys.onclick = () => {
        pianoKeys.forEach(k => {
            const span = k.querySelector("span");
            if (span) {
                span.style.display = span.style.display === "none" ? "block" : "none";
            }
        });
    };

    // CONTROLES DE FORMA DE ONDA
    waveBtnsOsc1.forEach(btn => {
        btn.onclick = () => {
            waveBtnsOsc1.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            oscConfig[1].wave = btn.dataset.wave;
        };
    });

    waveBtnsOsc2.forEach(btn => {
        btn.onclick = () => {
            waveBtnsOsc2.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            oscConfig[2].wave = btn.dataset.wave;
        };
    });

    // CONTROLES DE ARMÓNICOS
    function updateHarmonicsValues(osc) {
        if (osc === 1) {
            harmonic1_1_value.textContent = parseFloat(harmonic1_1.value).toFixed(2);
            harmonic1_3_value.textContent = parseFloat(harmonic1_3.value).toFixed(2);
            harmonic1_5_value.textContent = parseFloat(harmonic1_5.value).toFixed(2);
            harmonic1_7_value.textContent = parseFloat(harmonic1_7.value).toFixed(2);
        } else {
            harmonic2_1_value.textContent = parseFloat(harmonic2_1.value).toFixed(2);
            harmonic2_3_value.textContent = parseFloat(harmonic2_3.value).toFixed(2);
            harmonic2_5_value.textContent = parseFloat(harmonic2_5.value).toFixed(2);
            harmonic2_7_value.textContent = parseFloat(harmonic2_7.value).toFixed(2);
        }
    }

    // OSC1 Harmonics
    harmonic1_1.oninput = () => {
        oscConfig[1].harmonics.h1 = parseFloat(harmonic1_1.value);
        updateHarmonicsValues(1);
    };

    harmonic1_3.oninput = () => {
        oscConfig[1].harmonics.h3 = parseFloat(harmonic1_3.value);
        updateHarmonicsValues(1);
    };

    harmonic1_5.oninput = () => {
        oscConfig[1].harmonics.h5 = parseFloat(harmonic1_5.value);
        updateHarmonicsValues(1);
    };

    harmonic1_7.oninput = () => {
        oscConfig[1].harmonics.h7 = parseFloat(harmonic1_7.value);
        updateHarmonicsValues(1);
    };

    // OSC2 Harmonics
    harmonic2_1.oninput = () => {
        oscConfig[2].harmonics.h1 = parseFloat(harmonic2_1.value);
        updateHarmonicsValues(2);
    };

    harmonic2_3.oninput = () => {
        oscConfig[2].harmonics.h3 = parseFloat(harmonic2_3.value);
        updateHarmonicsValues(2);
    };

    harmonic2_5.oninput = () => {
        oscConfig[2].harmonics.h5 = parseFloat(harmonic2_5.value);
        updateHarmonicsValues(2);
    };

    harmonic2_7.oninput = () => {
        oscConfig[2].harmonics.h7 = parseFloat(harmonic2_7.value);
        updateHarmonicsValues(2);
    };

    // LEVELS
    level1.oninput = () => oscConfig[1].level = parseFloat(level1.value);
    level2.oninput = () => oscConfig[2].level = parseFloat(level2.value);

    // OCTAVES
    octave1.oninput = () => {
        oscConfig[1].octave = parseInt(octave1.value);
        oct1Label.textContent = `Octava OSC1 (Do${octave1.value})`;
    };
    octave2.oninput = () => {
        oscConfig[2].octave = parseInt(octave2.value);
        oct2Label.textContent = `Octava OSC2 (Do${octave2.value})`;
    };

    // FILTER CONTROLS - Ahora funcionan incluso con phaser activo
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filter.type = btn.dataset.type;
        };
    });

    cutoffSlider.oninput = () => {
        const baseValue = parseFloat(cutoffSlider.value);
        filter.frequency.value = baseValue;
        updateCutoffValue();
    };

    resonanceSlider.oninput = () => {
        const value = parseFloat(resonanceSlider.value);
        filter.Q.value = value;
        updateResonanceValue();
    };

    // LFO CONTROLS
    lfoTypeBtns.forEach(btn => {
        btn.onclick = () => {
            lfoTypeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLFOMode = btn.dataset.type;
            
            // Si estamos cambiando desde phaser a otro modo, desconectar phaser
            if (currentLFOMode !== "phaser" && lfoEnabled) {
                disconnectPhaser();
            }
            
            // Configurar el nuevo modo LFO
            setupLFOMode();
        };
    });

    lfoToggle.onclick = () => {
        lfoEnabled = !lfoEnabled;
        lfoToggle.textContent = lfoEnabled ? "LFO ON" : "LFO OFF";
        
        if (currentLFOMode === "phaser") {
            if (lfoEnabled) {
                setupPhaser();
            } else {
                disconnectPhaser();
            }
        } else {
            // Para tremolo y vibrato, asegurarse de desconectar el phaser si existe
            if (phaserNode) {
                disconnectPhaser();
            }
            setupLFOMode();
        }
    };

    lfoRate.oninput = () => {
        const value = parseFloat(lfoRate.value);
        lfoOscillator.frequency.value = value;
        updateLFORateValue();
        
        // Si está activo el phaser, actualizar frecuencia del LFO
        if (lfoEnabled && currentLFOMode === "phaser") {
            lfoOscillator.frequency.value = value;
        }
    };

    lfoDepth.oninput = () => {
        const value = parseFloat(lfoDepth.value);
        updateLFODepthValue();
        
        // Si está activo el phaser, actualizar profundidad
        if (lfoEnabled && currentLFOMode === "phaser") {
            lfoGain.gain.value = value * 1000;  // Escalar para rango útil
        } else {
            setupLFOMode();
        }
    };

    /* =========================
       INICIALIZACIÓN DE UI
    ========================= */
    // Inicializar controles
    level1.value = oscConfig[1].level;
    level2.value = oscConfig[2].level;
    octave1.value = oscConfig[1].octave;
    octave2.value = oscConfig[2].octave;
    cutoffSlider.value = filter.frequency.value;
    resonanceSlider.value = filter.Q.value;
    updateCutoffValue();
    updateResonanceValue();
    lfoRate.value = lfoOscillator.frequency.value;
    lfoDepth.value = 0.5;
    updateLFORateValue();
    updateLFODepthValue();
    
    // Inicializar armónicos
    harmonic1_1.value = oscConfig[1].harmonics.h1;
    harmonic1_3.value = oscConfig[1].harmonics.h3;
    harmonic1_5.value = oscConfig[1].harmonics.h5;
    harmonic1_7.value = oscConfig[1].harmonics.h7;
    harmonic2_1.value = oscConfig[2].harmonics.h1;
    harmonic2_3.value = oscConfig[2].harmonics.h3;
    harmonic2_5.value = oscConfig[2].harmonics.h5;
    harmonic2_7.value = oscConfig[2].harmonics.h7;
    
    updateHarmonicsValues(1);
    updateHarmonicsValues(2);
    
    // Activar botones iniciales de forma de onda
    document.querySelector('.wave-btn.osc1[data-wave="sine"]').classList.add('active');
    document.querySelector('.wave-btn.osc2[data-wave="triangle"]').classList.add('active');
}

// Marcar que el sintetizador no está inicializado todavía
window.synthInitialized = false;