const SERVER_IP = "";
const $ = (id) => document.getElementById(id);
const ipElement = $("server-ip");
const playerCount = $("player-count");
const glow = document.querySelector(".cursor-glow");
const background = document.querySelector(".background");
const grid = document.querySelector(".interactive-grid");
const orbOne = document.querySelector(".orb-one");
const orbTwo = document.querySelector(".orb-two");
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

if (ipElement) ipElement.textContent = SERVER_IP || "IP буде додано";
if (playerCount) playerCount.textContent = SERVER_IP ? "— / 100" : "— / 100";

function copyIP() {
    if (!SERVER_IP) { showToast("IP сервера", "IP буде додано після запуску сервера.", "success"); return; }
    if (!navigator.clipboard) { if (ipElement) ipElement.textContent = "IP: " + SERVER_IP; return; }
    navigator.clipboard.writeText(SERVER_IP).then(() => {
        if (!ipElement) return;
        const oldText = ipElement.textContent;
        ipElement.textContent = "IP скопійовано!";
        setTimeout(() => { if (ipElement) ipElement.textContent = oldText; }, 1800);
    }).catch(() => { if (ipElement) ipElement.textContent = "IP: " + SERVER_IP; });
}

// Mobile navigation
const mobileMenu = $("mobile-menu");
const mainNav = $("main-nav");
mobileMenu?.addEventListener("click", () => {
    const open = mainNav?.classList.toggle("open") ?? false;
    mobileMenu.setAttribute("aria-expanded", String(open));
});
mainNav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    mainNav.classList.remove("open"); mobileMenu?.setAttribute("aria-expanded", "false");
}));

// Cursor + parallax
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let targetX = mouseX, targetY = mouseY;
document.addEventListener("mousemove", e => { targetX = e.clientX; targetY = e.clientY; }, {passive:true});
function cursorAnimation() {
    mouseX += (targetX - mouseX) * 0.16; mouseY += (targetY - mouseY) * 0.16;
    if (glow) { glow.style.left = mouseX + "px"; glow.style.top = mouseY + "px"; }
    if (!reducedMotion) {
        const nx = mouseX / Math.max(window.innerWidth,1) - 0.5;
        const ny = mouseY / Math.max(window.innerHeight,1) - 0.5;
        if (background) background.style.transform = `scale(1.06) translate(${nx * -18}px, ${ny * -12}px)`;
        if (grid) grid.style.transform = `perspective(700px) rotateX(58deg) translate(${nx * -22}px, ${18 + ny * -10}%) scale(1.35)`;
        if (orbOne) orbOne.style.transform = `translate(${nx * 80}px, ${ny * 60}px)`;
        if (orbTwo) orbTwo.style.transform = `translate(${nx * -55}px, ${ny * -45}px)`;
    }
    requestAnimationFrame(cursorAnimation);
}
if (!reducedMotion) cursorAnimation();

// Ambient particles
const canvas = $("particles");
const ctx = canvas?.getContext("2d");
let particles = [], width = 0, height = 0;
function createParticles() {
    particles = [];
    const amount = Math.min(70, Math.max(12, Math.floor(window.innerWidth / 20)));
    for (let i=0;i<amount;i++) particles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,size:Math.random()*2.2+.5,speed:Math.random()*.3+.06,drift:(Math.random()-.5)*.22,alpha:Math.random()*.38+.12,phase:Math.random()*Math.PI*2});
}
function resizeCanvas(){ if(!canvas||!ctx)return; const dpr=Math.min(window.devicePixelRatio||1,2); width=window.innerWidth; height=window.innerHeight; canvas.width=width*dpr; canvas.height=height*dpr; canvas.style.width=width+"px"; canvas.style.height=height+"px"; ctx.setTransform(dpr,0,0,dpr,0,0); createParticles(); }
function animateParticles(time){ if(!canvas||!ctx)return; ctx.clearRect(0,0,width,height); for(const p of particles){p.y-=p.speed;p.x+=p.drift;if(p.y<-10){p.y=height+10;p.x=Math.random()*width}if(p.x<-10)p.x=width+10;if(p.x>width+10)p.x=-10;const pulse=(Math.sin(time*.0015+p.phase)+1)/2;ctx.globalAlpha=p.alpha*(.55+pulse*.65);ctx.fillStyle="rgb(255 210 105)";ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;requestAnimationFrame(animateParticles)}
window.addEventListener("resize",resizeCanvas,{passive:true}); resizeCanvas(); if(canvas&&ctx&&!reducedMotion) requestAnimationFrame(animateParticles);

// Living-world dust, without duplicate IDs
let ambientDust = $("ambient-dust");
if (!ambientDust) { ambientDust=document.createElement("div"); ambientDust.id="ambient-dust"; document.body.appendChild(ambientDust); }
if (!reducedMotion && !ambientDust.childElementCount) { const count=Math.min(24,Math.max(10,Math.floor(window.innerWidth/75))); for(let i=0;i<count;i++){const mote=document.createElement("span");mote.className="ambient-mote";mote.style.left=Math.random()*100+"%";mote.style.top=35+Math.random()*65+"%";mote.style.animationDuration=10+Math.random()*13+"s";mote.style.animationDelay=-Math.random()*18+"s";mote.style.transform=`scale(${.5+Math.random()*1.5})`;ambientDust.appendChild(mote)}}

// Smooth world depth
if (!reducedMotion && background) { let scrollYTarget=window.scrollY, scrollSmooth=scrollYTarget; window.addEventListener("scroll",()=>{scrollYTarget=window.scrollY},{passive:true}); function worldDepth(){scrollSmooth+=(scrollYTarget-scrollSmooth)*.06;background.style.backgroundPosition=`calc(50% + ${mouseX/Math.max(window.innerWidth,1)*1.2-.6}%) calc(50% + ${scrollSmooth*.018}px)`;requestAnimationFrame(worldDepth)} worldDepth(); }

// Supabase
const SUPABASE_URL="https://mqavqelpvjfreagcxemp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_eXRi9dicKYjn3EpVJmgwNw_yo38UK-0";
const supabaseClient=window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
if(!supabaseClient) console.error("Supabase JS library не завантажилась.");

const authPanel=$("auth-panel"), userPanel=$("user-panel"), adminPanel=$("admin-panel"), authForm=$("auth-form"), authMessage=$("auth-message"), usernameInput=$("username"), emailInput=$("email"), passwordInput=$("password"), authSubmit=$("auth-submit"), loginTab=$("login-tab"), signupTab=$("signup-tab"), currentUsername=$("current-username"), currentEmail=$("current-email"), currentMinecraft=$("current-minecraft"), currentRole=$("current-role"), toastContainer=document.querySelector(".toast-container"), whitelistForm=$("whitelist-form"), whitelistMessage=$("whitelist-message"), myApplications=$("my-applications"), adminApplications=$("admin-applications"), chatBox=$("chat-box"), chatForm=$("chat-form"), chatInput=$("chat-input"), chatMessage=$("chat-message"), pendingCount=$("pending-count"), approvedCount=$("approved-count"), rejectedCount=$("rejected-count");
let authMode="login", currentUser=null, adminFilter="all", chatChannel=null;
function escapeHTML(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]))}
function safeStatus(status){return ["pending","approved","rejected"].includes(status)?status:"pending"}
function showToast(title,message,type="success"){if(!toastContainer)return;const toast=document.createElement("div");toast.className=`toast ${type==="error"?"error":""}`;toast.innerHTML=`<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;toastContainer.appendChild(toast);setTimeout(()=>{toast.style.opacity="0";toast.style.transform="translateY(8px)";setTimeout(()=>toast.remove(),220)},3600)}
function setAuthMode(mode){authMode=mode;const signup=mode==="signup";loginTab?.classList.toggle("active",!signup);signupTab?.classList.toggle("active",signup);usernameInput?.classList.toggle("hidden",!signup);if(usernameInput)usernameInput.required=signup;if(authSubmit)authSubmit.textContent=signup?"СТВОРИТИ АКАУНТ":"УВІЙТИ";if(authMessage)authMessage.textContent=""}
loginTab?.addEventListener("click",()=>setAuthMode("login")); signupTab?.addEventListener("click",()=>setAuthMode("signup"));
async function handleAuth(event){event.preventDefault();if(!supabaseClient){if(authMessage)authMessage.textContent="Не вдалося підключити систему авторизації.";return}if(authMessage)authMessage.textContent="Обробка...";try{if(authMode==="signup"){const{data,error}=await supabaseClient.auth.signUp({email:emailInput.value.trim(),password:passwordInput.value,options:{data:{username:usernameInput.value.trim()}}});if(error)throw error;if(authMessage)authMessage.textContent=data.session?"Акаунт створено.":"Акаунт створено. Перевір пошту для підтвердження.";showToast("Готово",data.session?"Акаунт успішно створено.":"Перевір email для підтвердження.")}else{const{error}=await supabaseClient.auth.signInWithPassword({email:emailInput.value.trim(),password:passwordInput.value});if(error)throw error;if(authMessage)authMessage.textContent="Вхід виконано.";showToast("Вітаємо","Ти успішно увійшов у кабінет.")}}catch(error){if(authMessage)authMessage.textContent=error?.message||"Сталася помилка.";showToast("Помилка",error?.message||"Сталася помилка.","error")}}
authForm?.addEventListener("submit",handleAuth);
$("logout-btn")?.addEventListener("click",async()=>{if(!supabaseClient)return;const{error}=await supabaseClient.auth.signOut();if(error)showToast("Помилка",error.message,"error");else showToast("Вихід","Ти вийшов з акаунта.")});
async function loadProfile(user){if(!supabaseClient)return null;const{data,error}=await supabaseClient.from("profiles").select("id, username, minecraft_nickname, role").eq("id",user.id).single();if(error||!data){console.error(error);return null}if(currentUsername)currentUsername.textContent=data.username||"—";if(currentEmail)currentEmail.textContent=user.email||"—";if(currentMinecraft)currentMinecraft.textContent=data.minecraft_nickname||"Не вказано";if(currentRole)currentRole.textContent=data.role==="admin"?"ADMIN":"USER";if(adminPanel)adminPanel.classList.toggle("hidden",data.role!=="admin");return data}
async function loadMyApplications(){if(!supabaseClient||!myApplications)return;const{data,error}=await supabaseClient.from("whitelist_applications").select("id, minecraft_nickname, reason, status, created_at, reviewed_at").order("created_at",{ascending:false});if(error){myApplications.innerHTML='<div class="empty-state">Не вдалося завантажити заявки.</div>';return}if(!data?.length){myApplications.innerHTML='<div class="empty-state">Заявок ще немає.</div>';return}myApplications.innerHTML=data.map(app=>`<div class="application"><strong>${escapeHTML(app.minecraft_nickname)}</strong><span class="status-pill ${safeStatus(app.status)}">${escapeHTML(app.status)}</span><p>${escapeHTML(app.reason)}</p></div>`).join("")}
whitelistForm?.addEventListener("submit",async event=>{event.preventDefault();if(!currentUser||!supabaseClient)return;if(whitelistMessage)whitelistMessage.textContent="Надсилання...";const nickname=$("minecraft-nickname")?.value.trim()||"",reason=$("whitelist-reason")?.value.trim()||"";const{error}=await supabaseClient.from("whitelist_applications").insert({user_id:currentUser.id,minecraft_nickname:nickname,reason});if(error){if(whitelistMessage)whitelistMessage.textContent=error.message;showToast("Не вдалося надіслати",error.message,"error")}else{if(whitelistMessage)whitelistMessage.textContent="Заявку надіслано адміністратору.";showToast("Заявку надіслано","Адміністратор перегляне її та змінить статус.");whitelistForm.reset();await loadMyApplications()}});
async function loadAdminApplications(){if(!supabaseClient||!adminApplications)return;const{data,error}=await supabaseClient.from("whitelist_applications").select("id, user_id, minecraft_nickname, reason, status, created_at, profiles!whitelist_applications_user_id_fkey(username)").order("created_at",{ascending:false});if(error){console.error("Admin applications:",error);adminApplications.innerHTML='<div class="empty-state">Не вдалося завантажити заявки.</div>';return}const counts=(data||[]).reduce((acc,app)=>{const s=safeStatus(app.status);acc[s]=(acc[s]||0)+1;return acc},{pending:0,approved:0,rejected:0});if(pendingCount)pendingCount.textContent=counts.pending;if(approvedCount)approvedCount.textContent=counts.approved;if(rejectedCount)rejectedCount.textContent=counts.rejected;if(!data?.length){adminApplications.innerHTML='<div class="empty-state">Заявок ще немає.</div>';return}adminApplications.innerHTML=data.map(app=>{const status=safeStatus(app.status),pending=status==="pending";const hidden=adminFilter!=="all"&&adminFilter!==status;return `<div class="application" data-status="${status}" data-status-hidden="${hidden}"><div class="application-head"><div><strong>${escapeHTML(app.minecraft_nickname)}</strong> — ${escapeHTML(app.profiles?.username||"гравець")}</div><span class="application-date">${escapeHTML(new Date(app.created_at).toLocaleString("uk-UA"))}</span></div><div style="margin-top:8px"><span class="status-pill ${status}">${escapeHTML(status)}</span></div><p>${escapeHTML(app.reason)}</p><div class="application-actions"><button class="success-button" data-review="approved" data-id="${escapeHTML(app.id)}" ${pending?"":"disabled"}>ПРИЙНЯТИ</button><button class="danger-button" data-review="rejected" data-id="${escapeHTML(app.id)}" ${pending?"":"disabled"}>ВІДХИЛИТИ</button></div></div>`}).join("")}
document.querySelectorAll(".filter-button").forEach(button=>button.addEventListener("click",()=>{adminFilter=button.dataset.filter||"all";document.querySelectorAll(".filter-button").forEach(b=>b.classList.toggle("active",b===button));adminApplications?.querySelectorAll(".application[data-status]").forEach(card=>{card.dataset.statusHidden=adminFilter!=="all"&&adminFilter!==card.dataset.status?"true":"false"})}));
adminApplications?.addEventListener("click",async event=>{const button=event.target.closest("button[data-review]");if(!button||button.disabled||!currentUser||!supabaseClient)return;const status=button.dataset.review;if(!["approved","rejected"].includes(status))return;button.disabled=true;button.textContent=status==="approved"?"ПРИЙНЯТТЯ...":"ВІДХИЛЕННЯ...";const{error}=await supabaseClient.from("whitelist_applications").update({status,reviewed_by:currentUser.id,reviewed_at:new Date().toISOString()}).eq("id",button.dataset.id).eq("status","pending");if(error){showToast("Помилка",error.message,"error");await loadAdminApplications();return}showToast(status==="approved"?"Заявку прийнято":"Заявку відхилено","Статус заявки оновлено.");await loadAdminApplications();await loadMyApplications()});
function renderChat(messages){if(!chatBox)return;chatBox.innerHTML=messages.map(m=>`<div class="chat-message"><div class="meta"><span class="name">${escapeHTML(m.profiles?.username||"гравець")}</span> · ${escapeHTML(new Date(m.created_at).toLocaleString("uk-UA"))}</div><div class="text">${escapeHTML(m.message)}</div></div>`).join("");chatBox.scrollTop=chatBox.scrollHeight}
async function loadChat(){if(!supabaseClient||!chatBox)return;const{data,error}=await supabaseClient.from("chat_messages").select("id, user_id, message, created_at, profiles(username)").order("created_at",{ascending:true}).limit(100);if(!error)renderChat(data||[]);else console.error("Chat:",error)}
chatForm?.addEventListener("submit",async event=>{event.preventDefault();if(!currentUser||!supabaseClient||!chatInput)return;const message=chatInput.value.trim();if(!message)return;if(chatMessage)chatMessage.textContent="";const{error}=await supabaseClient.from("chat_messages").insert({user_id:currentUser.id,message});if(error){if(chatMessage)chatMessage.textContent=error.message;showToast("Чат",error.message,"error")}else chatInput.value=""});
function subscribeToChat(){if(!supabaseClient||!chatBox||chatChannel)return;chatChannel=supabaseClient.channel("vintage-chat").on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages"},loadChat).subscribe()}
async function updateAuthUI(session){currentUser=session?.user||null;if(authPanel)authPanel.classList.toggle("hidden",!!currentUser);if(userPanel)userPanel.classList.toggle("hidden",!currentUser);if(!currentUser){if(adminPanel)adminPanel.classList.add("hidden");return}const profile=await loadProfile(currentUser);await loadMyApplications();await loadChat();if(profile?.role==="admin")await loadAdminApplications()}
if(supabaseClient){supabaseClient.auth.onAuthStateChange((_event,session)=>{void updateAuthUI(session)});(async()=>{const{data:{session}}=await supabaseClient.auth.getSession();await updateAuthUI(session);if(session&&chatBox)subscribeToChat()})()}

document.querySelectorAll("a,button,input,textarea").forEach(el=>{el.addEventListener("mouseenter",()=>{if(glow){glow.style.width="180px";glow.style.height="180px"}});el.addEventListener("mouseleave",()=>{if(glow){glow.style.width="120px";glow.style.height="120px"}})});
