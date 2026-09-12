const SERVER_IP = "";

const ipElement = document.getElementById("server-ip");
const playerCount = document.getElementById("player-count");
const glow = document.querySelector(".cursor-glow");
const background = document.querySelector(".background");
const grid = document.querySelector(".interactive-grid");
const orbOne = document.querySelector(".orb-one");
const orbTwo = document.querySelector(".orb-two");

if (ipElement) ipElement.textContent = SERVER_IP || "IP буде додано";

// Копіювання IP
function copyIP() {
    if (!SERVER_IP) {
        if (typeof showToast === "function") {
            showToast("IP сервера", "IP буде додано після запуску сервера.", "success");
        }
        return;
    }

    navigator.clipboard.writeText(SERVER_IP)
        .then(() => {
            if (!ipElement) return;
            const oldText = ipElement.textContent;
            ipElement.textContent = "IP скопійовано!";
            setTimeout(() => {
                ipElement.textContent = oldText;
            }, 1800);
        })
        .catch(() => {
            if (ipElement) ipElement.textContent = "IP: " + SERVER_IP;
        });
}

// ===============================
// Інтерактивний курсор + паралакс
// ===============================
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let targetX = mouseX;
let targetY = mouseY;

document.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
});

function cursorAnimation() {
    mouseX += (targetX - mouseX) * 0.16;
    mouseY += (targetY - mouseY) * 0.16;

    if (glow) {
        glow.style.left = mouseX + "px";
        glow.style.top = mouseY + "px";
    }

    const nx = mouseX / window.innerWidth - 0.5;
    const ny = mouseY / window.innerHeight - 0.5;
    const px = nx * -18;
    const py = ny * -12;

    if (background) background.style.transform = `scale(1.06) translate(${px}px, ${py}px)`;
    if (grid) grid.style.transform = `perspective(700px) rotateX(58deg) translate(${nx * -22}px, ${18 + ny * -10}%) scale(1.35)`;
    if (orbOne) orbOne.style.transform = `translate(${nx * 80}px, ${ny * 60}px)`;
    if (orbTwo) orbTwo.style.transform = `translate(${nx * -55}px, ${ny * -45}px)`;

    requestAnimationFrame(cursorAnimation);
}

cursorAnimation();

// ===============================
// Інтерактивний фон: частинки
// ===============================
const canvas = document.getElementById("particles");
const ctx = canvas ? canvas.getContext("2d") : null;

let particles = [];
let width = 0;
let height = 0;

function resizeCanvas() {
    if (!canvas || !ctx) return;
    width = canvas.width = window.innerWidth * devicePixelRatio;
    height = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    createParticles();
}

function createParticles() {
    particles = [];
    const amount = Math.min(85, Math.floor(window.innerWidth / 16));

    for (let i = 0; i < amount; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2.5 + 0.6,
            speed: Math.random() * 0.35 + 0.08,
            drift: (Math.random() - 0.5) * 0.25,
            alpha: Math.random() * 0.45 + 0.15,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function animateParticles(time) {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;

        if (p.y < -10) {
            p.y = window.innerHeight + 10;
            p.x = Math.random() * window.innerWidth;
        }

        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;

        const pulse = (Math.sin(time * 0.0015 + p.phase) + 1) / 2;
        const alpha = p.alpha * (0.55 + pulse * 0.65);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 210, 105, ${alpha})`;
        ctx.fill();
    }

    requestAnimationFrame(animateParticles);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
if (canvas && ctx) requestAnimationFrame(animateParticles);

// Плавний active-стан меню
const navLinks = document.querySelectorAll("nav a");

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navLinks.forEach(item => item.classList.remove("active"));
        link.classList.add("active");
    });
});



// ===============================
// Living world: floating dust / spores
// ===============================
const ambientDust = document.createElement('div');
ambientDust.id = 'ambient-dust';
document.body.appendChild(ambientDust);
const moteCount = Math.min(26, Math.max(10, Math.floor(window.innerWidth / 70)));
for (let i = 0; i < moteCount; i++) {
    const mote = document.createElement('span');
    mote.className = 'ambient-mote';
    mote.style.left = (Math.random() * 100) + '%';
    mote.style.top = (35 + Math.random() * 65) + '%';
    mote.style.animationDuration = (10 + Math.random() * 13) + 's';
    mote.style.animationDelay = (-Math.random() * 18) + 's';
    mote.style.transform = `scale(${0.5 + Math.random() * 1.5})`;
    ambientDust.appendChild(mote);
}

// Gentle depth response from scroll: the world feels layered rather than static.
let scrollYTarget = window.scrollY;
window.addEventListener('scroll', () => { scrollYTarget = window.scrollY; }, {passive:true});
let scrollSmooth = 0;
function worldDepth() {
    scrollSmooth += (scrollYTarget - scrollSmooth) * 0.06;
    if (background) background.style.backgroundPosition = `calc(50% + ${mouseX / window.innerWidth * 1.2 - .6}%) calc(50% + ${scrollSmooth * .018}px)`;
    requestAnimationFrame(worldDepth);
}
worldDepth();

// ===============================
// Supabase: Auth / Whitelist / Chat
// ===============================
const SUPABASE_URL = "https://mqavqelpvjfreagcxemp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eXRi9dicKYjn3EpVJmgwNw_yo38UK-0";
if (!window.supabase) {
    console.error("Supabase JS library не завантажилась.");
}
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const authPanel = document.getElementById("auth-panel");
const userPanel = document.getElementById("user-panel");
const adminPanel = document.getElementById("admin-panel");
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authSubmit = document.getElementById("auth-submit");
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const currentUsername = document.getElementById("current-username");
const currentEmail = document.getElementById("current-email");
const currentMinecraft = document.getElementById("current-minecraft");
const currentRole = document.getElementById("current-role");
const toastContainer = document.getElementById("toast-container");
const whitelistForm = document.getElementById("whitelist-form");
const whitelistMessage = document.getElementById("whitelist-message");
const myApplications = document.getElementById("my-applications");
const adminApplications = document.getElementById("admin-applications");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessage = document.getElementById("chat-message");
const pendingCount = document.getElementById("pending-count");
const approvedCount = document.getElementById("approved-count");
const rejectedCount = document.getElementById("rejected-count");

let authMode = "login";
let currentUser = null;
let adminFilter = "all";


function showToast(title, message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(8px)"; setTimeout(() => toast.remove(), 220); }, 3600);
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";
    loginTab.classList.toggle("active", !signup);
    signupTab.classList.toggle("active", signup);
    usernameInput.classList.toggle("hidden", !signup);
    usernameInput.required = signup;
    authSubmit.textContent = signup ? "СТВОРИТИ АКАУНТ" : "УВІЙТИ";
    authMessage.textContent = "";
}
loginTab?.addEventListener("click", () => setAuthMode("login"));
signupTab?.addEventListener("click", () => setAuthMode("signup"));

function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
}

async function handleAuth(event) {
    event.preventDefault();
    if (!supabaseClient) {
        authMessage.textContent = "Не вдалося підключити систему авторизації. Перевір підключення до інтернету.";
        return;
    }
    authMessage.textContent = "Обробка...";
    try {
        if (authMode === "signup") {
            const { data, error } = await supabaseClient.auth.signUp({
                email: emailInput.value.trim(),
                password: passwordInput.value,
                options: { data: { username: usernameInput.value.trim() } }
            });
            if (error) throw error;
            authMessage.textContent = data.session ? "Акаунт створено." : "Акаунт створено. Якщо підтвердження email увімкнено — перевір пошту.";
            showToast("Готово", data.session ? "Акаунт успішно створено." : "Перевір email для підтвердження.");
        } else {
            const { error } = await supabaseClient.auth.signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value });
            if (error) throw error;
            authMessage.textContent = "Вхід виконано.";
            showToast("Вітаємо", "Ти успішно увійшов у кабінет.");
        }
    } catch (error) {
        authMessage.textContent = error.message || "Сталася помилка.";
        showToast("Помилка", error.message || "Сталася помилка.", "error");
    }
}
authForm?.addEventListener("submit", handleAuth);

document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    showToast("Вихід", "Ти вийшов з акаунта.");
});

async function loadProfile(user) {
    const { data, error } = await supabaseClient.from("profiles").select("id, username, minecraft_nickname, role").eq("id", user.id).single();
    if (error) {
        console.error(error);
        return null;
    }
    currentUsername.textContent = data.username;
    currentEmail.textContent = user.email || "—";
    currentMinecraft.textContent = data.minecraft_nickname || "Не вказано";
    currentRole.textContent = data.role === "admin" ? "ADMIN" : "USER";
    adminPanel.classList.toggle("hidden", data.role !== "admin");
    return data;
}

async function loadMyApplications() {
    const { data, error } = await supabaseClient.from("whitelist_applications").select("id, minecraft_nickname, reason, status, created_at, reviewed_at").order("created_at", { ascending: false });
    if (error) { myApplications.innerHTML = `<div class="empty-state">Не вдалося завантажити заявки.</div>`; return; }
    if (!data.length) { myApplications.innerHTML = `<div class="empty-state">Заявок ще немає.</div>`; return; }
    myApplications.innerHTML = data.map(app => `
        <div class="application">
            <strong>${escapeHTML(app.minecraft_nickname)}</strong>
            <span class="status-pill ${app.status}">${escapeHTML(app.status)}</span>
            <p>${escapeHTML(app.reason)}</p>
        </div>`).join("");
}

whitelistForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser) return;
    whitelistMessage.textContent = "Надсилання...";
    const nickname = document.getElementById("minecraft-nickname").value.trim();
    const reason = document.getElementById("whitelist-reason").value.trim();
    const { error } = await supabaseClient.from("whitelist_applications").insert({ user_id: currentUser.id, minecraft_nickname: nickname, reason });
    if (error) {
        whitelistMessage.textContent = error.message;
        showToast("Не вдалося надіслати", error.message, "error");
    } else {
        whitelistMessage.textContent = "Заявку надіслано адміністратору.";
        showToast("Заявку надіслано", "Адміністратор перегляне її та змінить статус.");
        whitelistForm.reset();
        await loadMyApplications();
    }
});

async function loadAdminApplications() {
    const { data, error } = await supabaseClient
        .from("whitelist_applications")
        .select("id, user_id, minecraft_nickname, reason, status, created_at, profiles!whitelist_applications_user_id_fkey(username)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Admin applications:", error);
        adminApplications.innerHTML = `<div class="empty-state">Не вдалося завантажити заявки.</div>`;
        return;
    }

    const counts = (data || []).reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, { pending: 0, approved: 0, rejected: 0 });
    pendingCount.textContent = counts.pending;
    approvedCount.textContent = counts.approved;
    rejectedCount.textContent = counts.rejected;

    if (!data?.length) {
        adminApplications.innerHTML = `<div class="empty-state">Заявок ще немає.</div>`;
        return;
    }

    adminApplications.innerHTML = data.map(app => {
        const pending = app.status === "pending";
        const hidden = adminFilter !== "all" && adminFilter !== app.status;
        return `
        <div class="application" data-status="${app.status}" data-status-hidden="${hidden}">
            <div class="application-head">
                <div><strong>${escapeHTML(app.minecraft_nickname)}</strong> — ${escapeHTML(app.profiles?.username || "гравець")}</div>
                <span class="application-date">${new Date(app.created_at).toLocaleString("uk-UA")}</span>
            </div>
            <div style="margin-top:8px"><span class="status-pill ${app.status}">${escapeHTML(app.status)}</span></div>
            <p>${escapeHTML(app.reason)}</p>
            <div class="application-actions">
                <button class="success-button" data-review="approved" data-id="${app.id}" ${pending ? "" : "disabled"}>ПРИЙНЯТИ</button>
                <button class="danger-button" data-review="rejected" data-id="${app.id}" ${pending ? "" : "disabled"}>ВІДХИЛИТИ</button>
            </div>
        </div>`;
    }).join("");
}

document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        adminFilter = button.dataset.filter;
        document.querySelectorAll(".filter-button").forEach(b => b.classList.toggle("active", b === button));
        adminApplications?.querySelectorAll(".application[data-status]").forEach(card => {
            card.dataset.statusHidden = adminFilter !== "all" && adminFilter !== card.dataset.status ? "true" : "false";
        });
    });
});

adminApplications?.addEventListener("click", async event => {
    const button = event.target.closest("button[data-review]");
    if (!button || button.disabled || !currentUser) return;

    const status = button.dataset.review;
    button.disabled = true;
    button.textContent = status === "approved" ? "ПРИЙНЯТТЯ..." : "ВІДХИЛЕННЯ...";

    const { error } = await supabaseClient
        .from("whitelist_applications")
        .update({ status, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() })
        .eq("id", button.dataset.id)
        .eq("status", "pending");

    if (error) {
        alert(error.message);
        await loadAdminApplications();
        return;
    }

    showToast(status === "approved" ? "Заявку прийнято" : "Заявку відхилено", "Статус заявки оновлено.");
    await loadAdminApplications();
    await loadMyApplications();
});

function renderChat(messages) {
    chatBox.innerHTML = messages.map(m => `
        <div class="chat-message">
            <div class="meta"><span class="name">${escapeHTML(m.profiles?.username || "гравець")}</span> · ${new Date(m.created_at).toLocaleString("uk-UA")}</div>
            <div class="text">${escapeHTML(m.message)}</div>
        </div>`).join("");
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadChat() {
    const { data, error } = await supabaseClient.from("chat_messages").select("id, user_id, message, created_at, profiles(username)").order("created_at", { ascending: true }).limit(100);
    if (!error) renderChat(data || []);
}

chatForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!currentUser || !message) return;
    chatMessage.textContent = "";
    const { error } = await supabaseClient.from("chat_messages").insert({ user_id: currentUser.id, message });
    if (error) {
        chatMessage.textContent = error.message;
        showToast("Чат", error.message, "error");
    } else chatInput.value = "";
});

function subscribeToChat() {
    supabaseClient.channel("vintage-chat")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async () => {
            await loadChat();
        })
        .subscribe();
}

async function updateAuthUI(session) {
    currentUser = session?.user || null;
    authPanel.classList.toggle("hidden", !!currentUser);
    userPanel.classList.toggle("hidden", !currentUser);
    if (!currentUser) return;
    const profile = await loadProfile(currentUser);
    await loadMyApplications();
    await loadChat();
    if (profile?.role === "admin") await loadAdminApplications();
}

supabaseClient?.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
(async () => {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    await updateAuthUI(session);
    subscribeToChat();
})();


document.querySelectorAll("a, button, input, textarea").forEach((el) => {
    el.addEventListener("mouseenter", () => {
        if (glow) { glow.style.width = "190px"; glow.style.height = "190px"; }
    });
    el.addEventListener("mouseleave", () => {
        if (glow) { glow.style.width = "140px"; glow.style.height = "140px"; }
    });
});
