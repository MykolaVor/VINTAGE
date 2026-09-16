const SUPABASE_URL = "https://mqavqelpvjfreagcxemp.supabase.co";
const SUPABASE_KEY = "sb_publishable_eXRi9dicKYjn3EpVJmgwNw_yo38UK-0";
const SERVER_IP = "134.255.209.65:10030";
const SERVER_STATUS_API = `https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_IP)}`;
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;

const $ = (id) => document.getElementById(id);
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];
const escapeHTML = (v) => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const fmtDate = (v) => v ? new Date(v).toLocaleString("uk-UA") : "—";

let currentUser = null;
let currentProfile = null;
let chatChannel = null;

function showToast(title, message, type="success") {
  const box = $("toast-container");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : ""}`;
  el.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity="0"; el.style.transform="translateY(8px)"; setTimeout(()=>el.remove(),250); }, 3600);
}

// ---------- Global visual effects ----------
const glow = qs(".cursor-glow"), background = qs(".background"), grid = qs(".interactive-grid"), orbOne = qs(".orb-one"), orbTwo = qs(".orb-two");
let mouseX=innerWidth/2, mouseY=innerHeight/2, targetX=mouseX, targetY=mouseY;
document.addEventListener("mousemove", e=>{targetX=e.clientX; targetY=e.clientY;});
(function cursorAnimation(){
  mouseX += (targetX-mouseX)*.16; mouseY += (targetY-mouseY)*.16;
  if(glow){glow.style.left=mouseX+"px"; glow.style.top=mouseY+"px";}
  const nx=mouseX/innerWidth-.5, ny=mouseY/innerHeight-.5;
  if(background) background.style.transform=`scale(1.06) translate(${nx*-18}px,${ny*-12}px)`;
  if(grid) grid.style.transform=`perspective(700px) rotateX(58deg) translate(${nx*-22}px,${18+ny*-10}%) scale(1.35)`;
  if(orbOne) orbOne.style.transform=`translate(${nx*80}px,${ny*60}px)`;
  if(orbTwo) orbTwo.style.transform=`translate(${nx*-55}px,${ny*-45}px)`;
  requestAnimationFrame(cursorAnimation);
})();
const canvas=$("particles"), ctx=canvas?.getContext("2d"); let particles=[];
function resizeCanvas(){ if(!canvas||!ctx)return; const d=devicePixelRatio||1; canvas.width=innerWidth*d; canvas.height=innerHeight*d; canvas.style.width=innerWidth+"px"; canvas.style.height=innerHeight+"px"; ctx.setTransform(d,0,0,d,0,0); particles=Array.from({length:Math.min(85,Math.floor(innerWidth/16))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,size:Math.random()*2.5+.6,speed:Math.random()*.35+.08,drift:(Math.random()-.5)*.25,alpha:Math.random()*.45+.15})); }
function animateParticles(){ if(!canvas||!ctx)return; ctx.clearRect(0,0,innerWidth,innerHeight); for(const p of particles){p.y-=p.speed;p.x+=p.drift;if(p.y<-10){p.y=innerHeight+10;p.x=Math.random()*innerWidth} if(p.x<-10)p.x=innerWidth+10;if(p.x>innerWidth+10)p.x=-10;ctx.globalAlpha=p.alpha;ctx.fillStyle="#ffd269";ctx.fillRect(p.x,p.y,p.size,p.size);} requestAnimationFrame(animateParticles); }
resizeCanvas(); animateParticles(); addEventListener("resize",resizeCanvas);
qsa("a,button,input,textarea,select").forEach(el=>{el.addEventListener("mouseenter",()=>{if(glow){glow.style.width="190px";glow.style.height="190px"}});el.addEventListener("mouseleave",()=>{if(glow){glow.style.width="140px";glow.style.height="140px"}})});

// ---------- Navigation/auth state ----------
function setNavLoggedIn(profile){
  const auth = $("nav-auth"); if(!auth) return;
  const adminNav=$("admin-nav"); if(adminNav) adminNav.classList.toggle("hidden", currentProfile?.role!=="admin");
  const adminLink=$("profile-admin-link"); if(adminLink) adminLink.classList.toggle("hidden", currentProfile?.role!=="admin");
  if(currentUser){
    auth.innerHTML = `<a class="nav-user" href="profile.html">◉ ${escapeHTML(profile?.username || currentUser.email || "Профіль")}</a><button id="nav-logout" class="nav-login" type="button">ВИЙТИ</button>`;
    $("nav-logout")?.addEventListener("click", async()=>{await supabaseClient?.auth.signOut(); location.href="account.html";});
  } else {
    auth.innerHTML = `<a class="nav-login" href="account.html">♟ УВІЙТИ</a>`;
  }
}
async function refreshAuth(){
  if(!supabaseClient){setNavLoggedIn(null);return null;}
  const {data:{session}}=await supabaseClient.auth.getSession();
  currentUser=session?.user||null;
  if(currentUser){
    const {data}=await supabaseClient.from("profiles").select("id,username,minecraft_nickname,role").eq("id",currentUser.id).single();
    currentProfile=data||null;
  } else currentProfile=null;
  setNavLoggedIn(currentProfile);
  return currentUser;
}
supabaseClient?.auth.onAuthStateChange((_e,session)=>{currentUser=session?.user||null; if(!currentUser){currentProfile=null;setNavLoggedIn(null);} else setTimeout(refreshAuth,0);});

const mobileMenu=$("mobile-menu");
mobileMenu?.addEventListener("click",()=>$("site-nav")?.classList.toggle("open"));
qsa("#site-nav a").forEach(a=>a.addEventListener("click",()=>$("site-nav")?.classList.remove("open")));

// ---------- Home ----------
function copyIP(){
  if(!SERVER_IP){showToast("IP сервера","IP буде додано після запуску сервера.");return;}
  const done=()=>showToast("Скопійовано",`${SERVER_IP} скопійовано.`);
  if(navigator.clipboard?.writeText) navigator.clipboard.writeText(SERVER_IP).then(done).catch(()=>fallbackCopyIP(done));
  else fallbackCopyIP(done);
}
function fallbackCopyIP(done){
  const ta=document.createElement("textarea");ta.value=SERVER_IP;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done();}catch{}ta.remove();
}
window.copyIP=copyIP;

// ---------- Minecraft server status ----------
async function loadServerStatus(){
  const ip=$(`server-ip`), count=$(`player-count`), status=$(`server-status-text`), dot=qs(`.server-status .status-dot`);
  if(ip) ip.textContent=SERVER_IP;
  const setState=(online,players=0,max=20)=>{
    if(status) status.textContent=online?"Сервер онлайн":"Сервер офлайн";
    if(count) count.textContent=online?`${players}/${max||20}`:"—";
    if(dot){dot.classList.toggle("status-dot-muted",!online);dot.classList.toggle("status-dot-online",online);}
  };
  try{
    const res=await fetch(SERVER_STATUS_API,{cache:"no-store"});
    if(!res.ok) throw new Error("status request failed");
    const data=await res.json();
    setState(Boolean(data.online),Number(data.players?.online||0),Number(data.players?.max||20));
  }catch(e){
    setState(false);
  }
}
window.loadServerStatus=loadServerStatus;


// ---------- Auth page ----------
let authMode="login";
function setupAuthPage(){
  const form=$("auth-form"); if(!form)return;
  if(currentUser){ location.replace("profile.html"); return; }
  const loginTab=$("login-tab"), signupTab=$("signup-tab"), username=$("username"), email=$("email"), password=$("password"), submit=$("auth-submit"), msg=$("auth-message");
  const setMode=(m)=>{authMode=m;const s=m==="signup";loginTab?.classList.toggle("active",!s);signupTab?.classList.toggle("active",s);if(username){username.classList.toggle("hidden",!s);username.required=s;}if(password)password.autocomplete=s?"new-password":"current-password";if(submit)submit.textContent=s?"СТВОРИТИ АКАУНТ":"УВІЙТИ";if(msg)msg.textContent="";};
  loginTab?.addEventListener("click",()=>setMode("login")); signupTab?.addEventListener("click",()=>setMode("signup")); setMode("login");
  $("forgot-password")?.addEventListener("click",async()=>{
    const mail=email?.value.trim();
    if(!mail){msg.textContent="Спочатку введи email, для якого потрібно відновити пароль.";email?.focus();return;}
    if(!supabaseClient)return;
    msg.textContent="Надсилаємо лист для відновлення...";
    try{
      const redirectTo=`${location.origin}/update-password.html`;
      const {error}=await supabaseClient.auth.resetPasswordForEmail(mail,{redirectTo});
      if(error)throw error;
      msg.textContent="Лист для відновлення пароля надіслано. Перевір пошту.";
      showToast("Перевір пошту","Посилання для відновлення пароля надіслано.");
    }catch(err){msg.textContent=err.message||"Не вдалося надіслати лист.";showToast("Помилка",err.message||"Не вдалося надіслати лист.","error");}
  });
  form.addEventListener("submit",async e=>{e.preventDefault();if(!supabaseClient)return;msg.textContent="Обробка...";try{
    if(authMode==="signup"){
      const {data,error}=await supabaseClient.auth.signUp({email:email.value.trim(),password:password.value,options:{data:{username:username.value.trim()}}});if(error)throw error;
      msg.textContent=data.session?"Акаунт створено.":"Акаунт створено. Перевір email, якщо потрібне підтвердження."; if(data.session)location.href="profile.html";
    }else{const {error}=await supabaseClient.auth.signInWithPassword({email:email.value.trim(),password:password.value});if(error)throw error;location.href="profile.html";}
  }catch(err){msg.textContent=err.message||"Сталася помилка.";showToast("Помилка",err.message||"Сталася помилка.","error");}});
}

// ---------- Password recovery ----------
function setupPasswordUpdatePage(){
  const form=$("password-update-form"); if(!form)return;
  const password=$("new-password"), confirm=$("confirm-password"), msg=$("password-update-message");
  supabaseClient?.auth.onAuthStateChange((event)=>{
    if(event==="PASSWORD_RECOVERY") msg.textContent="Введи новий пароль.";
  });
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!supabaseClient)return;
    if(password.value.length<6){msg.textContent="Пароль має містити щонайменше 6 символів.";return;}
    if(password.value!==confirm.value){msg.textContent="Паролі не збігаються.";return;}
    msg.textContent="Зберігаємо новий пароль...";
    const {error}=await supabaseClient.auth.updateUser({password:password.value});
    if(error){msg.textContent=error.message||"Не вдалося змінити пароль.";showToast("Помилка",error.message||"Не вдалося змінити пароль.","error");return;}
    msg.textContent="Пароль успішно змінено. Перенаправляємо до профілю...";
    showToast("Готово","Пароль змінено.");
    setTimeout(()=>location.href="profile.html",900);
  });
}

// ---------- Profile page ----------
async function setupProfilePage(){
  const page=$("profile-page");if(!page)return;
  const user=await refreshAuth();
  const guest=$("profile-guest"), content=$("profile-content");
  if(!user){guest?.classList.remove("hidden");content?.classList.add("hidden");return;}
  guest?.classList.add("hidden");content?.classList.remove("hidden");
  $("profile-username").textContent=currentProfile?.username||"—"; $("profile-email").textContent=user.email||"—"; $("profile-minecraft").textContent=currentProfile?.minecraft_nickname||"Не вказано"; $("profile-minecraft-input").value=currentProfile?.minecraft_nickname||""; $("profile-role").textContent=currentProfile?.role==="admin"?"ADMIN":"USER";
  $("profile-minecraft-form")?.addEventListener("submit",async e=>{e.preventDefault();const v=$("profile-minecraft-input").value.trim();const {error}=await supabaseClient.from("profiles").update({minecraft_nickname:v||null}).eq("id",user.id);if(error)showToast("Профіль",error.message,"error");else{currentProfile.minecraft_nickname=v;$("profile-minecraft").textContent=v||"Не вказано";showToast("Профіль","Minecraft-нік збережено.");}});
  $("logout-btn")?.addEventListener("click",async()=>{await supabaseClient.auth.signOut();location.href="account.html";});
}

// ---------- Whitelist page ----------
async function setupWhitelistPage(){
  const page=$("whitelist-page");if(!page)return;const user=await refreshAuth();if(!user){$("whitelist-guest")?.classList.remove("hidden");return;} $("whitelist-content")?.classList.remove("hidden");
  const form=$("whitelist-form"), msg=$("whitelist-message"), list=$("my-applications");
  async function load(){const {data,error}=await supabaseClient.from("whitelist_applications").select("id,minecraft_nickname,reason,status,created_at,reviewed_at").eq("user_id",user.id).order("created_at",{ascending:false});if(error){list.innerHTML=`<div class="empty-state">${escapeHTML(error.message)}</div>`;return;}list.innerHTML=data?.length?data.map(a=>`<article class="application"><div class="application-head"><strong>${escapeHTML(a.minecraft_nickname)}</strong><span class="status-pill ${escapeHTML(a.status)}">${escapeHTML(a.status)}</span></div><p>${escapeHTML(a.reason)}</p><small>${fmtDate(a.created_at)}</small></article>`).join(""):`<div class="empty-state">Заявок ще немає.</div>`;}
  form?.addEventListener("submit",async e=>{e.preventDefault();const nickname=$("minecraft-nickname").value.trim(),reason=$("whitelist-reason").value.trim();msg.textContent="Надсилання...";const {error}=await supabaseClient.from("whitelist_applications").insert({user_id:user.id,minecraft_nickname:nickname,reason});if(error){msg.textContent=error.message;showToast("Whitelist",error.message,"error")}else{msg.textContent="Заявку надіслано.";form.reset();await load();showToast("Готово","Заявку передано адміністратору.")}});await load();
}

// ---------- Chat page ----------
const emojiList=["😀","😎","😂","😍","🤔","😅","🔥","❤️","👍","👎","🎉","⛏️","⚙️","🏭","🌲","💎","☕","👀"];
function emojiPicker(){const box=$("emoji-picker");if(!box)return;box.innerHTML=emojiList.map(e=>`<button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>`).join("");box.classList.toggle("hidden");}
async function chatModerationState(userId){
  const {data,error}=await supabaseClient.from("user_moderation").select("type,expires_at,reason,active").eq("user_id",userId).eq("active",true);if(error)return {mute:null,ban:null};
  const now=Date.now();const active=(data||[]).filter(x=>!x.expires_at||new Date(x.expires_at).getTime()>now);return {mute:active.find(x=>x.type==="mute")||null,ban:active.find(x=>x.type==="ban")||null};
}
async function setupChatPage(){
  const page=$("chat-page");if(!page)return;const user=await refreshAuth();if(!user){$("chat-guest")?.classList.remove("hidden");return;} $("chat-content")?.classList.remove("hidden");
  const box=$("chat-box"),form=$("chat-form"),input=$("chat-input"),msg=$("chat-message");
  async function load(){const {data,error}=await supabaseClient.from("chat_messages").select("id,user_id,message,created_at,highlighted,profiles!chat_messages_user_id_fkey(username,role)").order("created_at",{ascending:true}).limit(150);if(error){box.innerHTML=`<div class="empty-state">${escapeHTML(error.message)}</div>`;return;}box.innerHTML=(data||[]).map(m=>`<article class="chat-message ${m.user_id===user.id?"mine":""} ${m.highlighted?"highlighted":""}" data-id="${m.id}"><div class="chat-head"><span class="name">${escapeHTML(m.profiles?.username||"гравець")}</span>${m.profiles?.role==="admin"?'<span class="role-label">ADMIN</span>':''}<time>${fmtDate(m.created_at)}</time></div><div class="text">${escapeHTML(m.message).replace(/\n/g,"<br>")}</div><div class="chat-actions">${m.user_id===user.id?`<button class="chat-edit" type="button">✎ Редагувати</button><button class="chat-delete danger-button" type="button">✕ Видалити</button><button class="highlight-toggle" type="button" data-highlight="${m.highlighted}">${m.highlighted?"★ Прибрати виділення":"☆ Виділити"}</button>`:currentProfile?.role==="admin"?`<button class="chat-delete danger-button" type="button">✕ Видалити</button>`:""}</div></article>`).join("");box.scrollTop=box.scrollHeight;}
  $("emoji-toggle")?.addEventListener("click",emojiPicker);$("emoji-picker")?.addEventListener("click",e=>{const b=e.target.closest("[data-emoji]");if(b){input.value+=b.dataset.emoji;input.focus();$("emoji-picker").classList.add("hidden")}});
  box.addEventListener("click",async e=>{
    const article=e.target.closest(".chat-message"); if(!article)return;
    const id=article.dataset.id;
    const highlight=e.target.closest(".highlight-toggle");
    if(highlight){const next=highlight.dataset.highlight!=="true";const {error}=await supabaseClient.from("chat_messages").update({highlighted:next}).eq("id",id).eq("user_id",user.id);if(error)showToast("Чат",error.message,"error");else load();return;}
    const edit=e.target.closest(".chat-edit");
    if(edit){const current=article.querySelector(".text")?.innerText||"";const next=prompt("Редагувати повідомлення:",current);if(next===null)return;const text=next.trim();if(!text||text.length>1000){showToast("Чат","Повідомлення має містити від 1 до 1000 символів.","error");return;}const {error}=await supabaseClient.from("chat_messages").update({message:text}).eq("id",id).eq("user_id",user.id);if(error)showToast("Чат",error.message,"error");else{showToast("Чат","Повідомлення відредаговано.");load();}return;}
    const del=e.target.closest(".chat-delete");
    if(del){const mine=article.classList.contains("mine");const admin=currentProfile?.role==="admin";if(!mine&&!admin)return;if(!confirm("Видалити це повідомлення?"))return;let q=supabaseClient.from("chat_messages").delete().eq("id",id);if(!admin)q=q.eq("user_id",user.id);const {error}=await q;if(error)showToast("Чат",error.message,"error");else{showToast("Чат","Повідомлення видалено.");load();}}
  });
  form.addEventListener("submit",async e=>{e.preventDefault();const text=input.value.trim();if(!text)return;const mod=await chatModerationState(user.id);if(mod.ban){msg.textContent=`У тебе бан до ${fmtDate(mod.ban.expires_at)}${mod.ban.reason?` — ${mod.ban.reason}`:""}.`;return;}if(mod.mute){msg.textContent=`Ти зам'ючений до ${fmtDate(mod.mute.expires_at)}${mod.mute.reason?` — ${mod.mute.reason}`:""}.`;return;}msg.textContent="";const {error}=await supabaseClient.from("chat_messages").insert({user_id:user.id,message:text});if(error){msg.textContent=error.message;showToast("Чат",error.message,"error")}else{input.value="";await load();}});
  await load();chatChannel=supabaseClient.channel("vintage-chat-page").on("postgres_changes",{event:"*",schema:"public",table:"chat_messages"},load).subscribe();
}

// ---------- Admin ----------
async function setupAdminPage(){
  const page=$("admin-page");if(!page)return;const user=await refreshAuth();if(!user||currentProfile?.role!=="admin"){$("admin-denied")?.classList.remove("hidden");return;}$("admin-content")?.classList.remove("hidden");
  let applications=[]; let users=[];
  const loadUsers=async()=>{const {data,error}=await supabaseClient.rpc("admin_list_users");if(error){$("admin-users").innerHTML=`<div class="empty-state">${escapeHTML(error.message)}<br>Потрібна SQL-міграція v17.</div>`;return;}users=data||[];renderUsers();};
  const loadApps=async(notify=false)=>{const previousPending=applications.filter(a=>a.status==="pending").map(a=>a.id);const {data,error}=await supabaseClient.from("whitelist_applications").select("id,user_id,minecraft_nickname,reason,status,created_at,profiles!whitelist_applications_user_id_fkey(username)").order("created_at",{ascending:false});if(error){$("admin-applications").innerHTML=`<div class="empty-state">${escapeHTML(error.message)}</div>`;return;}applications=data||[];renderApps();const newPending=applications.filter(a=>a.status==="pending"&&!previousPending.includes(a.id));if(notify&&newPending.length){showToast("Нова заявка Whitelist",`${newPending.length===1?"Надійшла нова заявка":"Надійшли нові заявки"}.`);}setPendingBadge(applications.filter(a=>a.status==="pending").length);};
  function setPendingBadge(count){const tab=$("admin-apps-tab");if(!tab)return;let badge=tab.querySelector(".pending-badge");if(count>0){if(!badge){badge=document.createElement("span");badge.className="pending-badge";tab.appendChild(badge);}badge.textContent=count;}else badge?.remove();}
  function renderUsers(){const q=($("user-search")?.value||"").toLowerCase();const arr=users.filter(u=>[u.username,u.email,u.minecraft_nickname].some(x=>String(x||"").toLowerCase().includes(q)));$("admin-user-count").textContent=users.length;$("admin-users").innerHTML=arr.map(u=>{const muted=u.mute_until&&new Date(u.mute_until)>new Date(),banned=u.ban_until&&new Date(u.ban_until)>new Date();return `<article class="admin-user"><div><strong>${escapeHTML(u.username||"Без ніку")}</strong><span class="muted-line">${escapeHTML(u.email||"")} · MC: ${escapeHTML(u.minecraft_nickname||"—")}</span><span class="muted-line">Реєстрація: ${fmtDate(u.created_at)}</span></div><div class="moderation-badges">${muted?`<span class="status-pill warning">MUTE до ${fmtDate(u.mute_until)}</span>`:""}${banned?`<span class="status-pill rejected">BAN до ${fmtDate(u.ban_until)}</span>`:""}</div><div class="admin-actions"><button class="small-button" data-mod="mute" data-id="${u.id}">МУТ</button><button class="small-button danger-button" data-mod="ban" data-id="${u.id}">БАН</button>${muted?`<button class="small-button" data-clear="mute" data-id="${u.id}">ЗНЯТИ МУТ</button>`:""}${banned?`<button class="small-button" data-clear="ban" data-id="${u.id}">ЗНЯТИ БАН</button>`:""}</div></article>`}).join("")||`<div class="empty-state">Користувачів не знайдено.</div>`;}
  function renderApps(){const f=$("app-filter")?.value||"all";const arr=applications.filter(a=>f==="all"||a.status===f);$("admin-applications").innerHTML=arr.map(a=>`<article class="application"><div class="application-head"><div><strong>${escapeHTML(a.minecraft_nickname)}</strong> — ${escapeHTML(a.profiles?.username||"гравець")}</div><span class="status-pill ${a.status}">${escapeHTML(a.status)}</span></div><small>${fmtDate(a.created_at)}</small><p>${escapeHTML(a.reason)}</p><div class="application-actions"><button class="success-button" data-review="approved" data-id="${a.id}" ${a.status!=="pending"?"disabled":""}>ПРИЙНЯТИ</button><button class="danger-button" data-review="rejected" data-id="${a.id}" ${a.status!=="pending"?"disabled":""}>ВІДХИЛИТИ</button></div></article>`).join("")||`<div class="empty-state">Немає заявок.</div>`;}
  $("user-search")?.addEventListener("input",renderUsers);$("app-filter")?.addEventListener("change",renderApps);
  const moderationModal=$("moderation-modal"); const moderationType=$("moderation-type"); const moderationUser=$("moderation-user"); const moderationDuration=$("moderation-duration"); const moderationReason=$("moderation-reason");
  const closeModeration=()=>moderationModal?.classList.add("hidden"); $("moderation-cancel")?.addEventListener("click",closeModeration); moderationModal?.addEventListener("click",e=>{if(e.target===moderationModal)closeModeration();});
  $("moderation-confirm")?.addEventListener("click",async()=>{const id=moderationUser?.value,type=moderationType?.value,minutes=Number(moderationDuration?.value||0),reason=moderationReason?.value.trim()||null;if(!id)return;const {error}=await supabaseClient.rpc("admin_set_moderation",{target_user:id,moderation_type:type,duration_minutes:minutes,moderation_reason:reason});if(error)showToast("Модерація",error.message,"error");else{showToast(type==="mute"?"Мут видано":"Бан видано",minutes===0?"Назавжди":"Обмеження застосовано.");closeModeration();loadUsers();}});
  $("admin-users")?.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;const id=b.dataset.id;if(b.dataset.clear){const {error}=await supabaseClient.rpc("admin_clear_moderation",{target_user:id,moderation_type:b.dataset.clear});if(error)showToast("Модерація",error.message,"error");else{showToast("Готово","Обмеження знято.");loadUsers();}return;}if(b.dataset.mod){if(moderationModal){moderationUser.value=id;moderationType.value=b.dataset.mod;moderationReason.value="";moderationDuration.value="60";$("moderation-title").textContent=b.dataset.mod==="mute"?"Видати мут":"Забанити користувача";moderationModal.classList.remove("hidden");}}});
  $("admin-applications")?.addEventListener("click",async e=>{const b=e.target.closest("button[data-review]");if(!b||b.disabled)return;const {error}=await supabaseClient.from("whitelist_applications").update({status:b.dataset.review,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",b.dataset.id).eq("status","pending");if(error)showToast("Заявки",error.message,"error");else{showToast("Заявку оновлено","Статус змінено.");loadApps();}});
  qsa(".admin-tab").forEach(tab=>tab.addEventListener("click",()=>{qsa(".admin-tab").forEach(x=>x.classList.remove("active"));qsa(".admin-section").forEach(x=>x.classList.remove("active"));tab.classList.add("active");$(tab.dataset.target)?.classList.add("active");}));
  await Promise.all([loadUsers(),loadApps(false)]);
  supabaseClient.channel("vintage-whitelist-admin").on("postgres_changes",{event:"*",schema:"public",table:"whitelist_applications"},()=>loadApps(true)).subscribe();
  setInterval(()=>loadApps(true),15000);
}

// ---------- Guide ----------
function setupGuide(){qsa(".era").forEach(b=>b.addEventListener("click",()=>{qsa(".era,.guide-section").forEach(x=>x.classList.remove("active"));b.classList.add("active");qs(`[data-panel="${b.dataset.era}"]`)?.classList.add("active");}));}

(async()=>{await refreshAuth();loadServerStatus();setupAuthPage();setupPasswordUpdatePage();await setupProfilePage();await setupWhitelistPage();await setupChatPage();await setupAdminPage();setupGuide();})();
