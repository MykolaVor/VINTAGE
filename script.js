const SUPABASE_URL = "https://mqavqelpvjfreagcxemp.supabase.co";
const SUPABASE_KEY = "sb_publishable_eXRi9dicKYjn3EpVJmgwNw_yo38UK-0";
const SERVER_IP = "134.255.209.65:10030";
const SERVER_STATUS_API = `https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_IP)}`;
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;

const $ = id => document.getElementById(id);
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];
const escapeHTML = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const fmtDate = v => v ? new Date(v).toLocaleString("uk-UA", {dateStyle:"medium", timeStyle:"short"}) : "—";
const fmtModeration = v => v ? fmtDate(v) : "назавжди";

let currentUser = null;
let currentProfile = null;
let chatChannel = null;
let adminWhitelistChannel = null;

function showToast(title, message, type="success") {
  const root = $("toast-container");
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : ""}`;
  el.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; setTimeout(() => el.remove(), 260); }, 4200);
}

// Visual layer
const glow = qs(".cursor-glow");
let mouseX = innerWidth / 2, mouseY = innerHeight / 2, targetX = mouseX, targetY = mouseY;
document.addEventListener("mousemove", e => { targetX=e.clientX; targetY=e.clientY; });
(function animateGlow(){
  mouseX += (targetX-mouseX)*0.14; mouseY += (targetY-mouseY)*0.14;
  if (glow) { glow.style.left=`${mouseX}px`; glow.style.top=`${mouseY}px`; }
  requestAnimationFrame(animateGlow);
})();

const canvas = $("particles"), ctx = canvas?.getContext("2d");
let particles = [];
function resizeCanvas(){
  if(!canvas||!ctx)return;
  const d=devicePixelRatio||1;
  canvas.width=innerWidth*d; canvas.height=innerHeight*d; canvas.style.width=innerWidth+"px"; canvas.style.height=innerHeight+"px";
  ctx.setTransform(d,0,0,d,0,0);
  particles=Array.from({length:Math.min(80,Math.floor(innerWidth/17))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,size:Math.random()*2.2+.5,speed:Math.random()*.32+.07,drift:(Math.random()-.5)*.22,alpha:Math.random()*.38+.10}));
}
function animateParticles(){
  if(!canvas||!ctx)return;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(const p of particles){ p.y-=p.speed; p.x+=p.drift; if(p.y<-8){p.y=innerHeight+8;p.x=Math.random()*innerWidth} if(p.x<-8)p.x=innerWidth+8;if(p.x>innerWidth+8)p.x=-8; ctx.globalAlpha=p.alpha;ctx.fillStyle="#ffd269";ctx.fillRect(p.x,p.y,p.size,p.size); }
  requestAnimationFrame(animateParticles);
}
resizeCanvas(); animateParticles(); addEventListener("resize",resizeCanvas);
qsa("a,button,input,textarea,select").forEach(el=>{el.addEventListener("mouseenter",()=>glow&&(glow.style.width="185px",glow.style.height="185px"));el.addEventListener("mouseleave",()=>glow&&(glow.style.width="130px",glow.style.height="130px"));});

function setNavLoggedIn(profile){
  const auth=$("nav-auth"), adminNav=$("admin-nav");
  if(adminNav) adminNav.classList.toggle("hidden", profile?.role!=="admin");
  if($("profile-admin-link")) $("profile-admin-link").classList.toggle("hidden", profile?.role!=="admin");
  if(!auth)return;
  if(currentUser){
    const label=profile?.username || currentUser.email?.split("@")[0] || "Профіль";
    auth.innerHTML=`<a class="nav-user" href="profile.html">◉ ${escapeHTML(label)}</a><button id="nav-logout" class="nav-login nav-logout" type="button">ВИЙТИ</button>`;
    $("nav-logout")?.addEventListener("click",async()=>{await supabaseClient?.auth.signOut();location.href="account.html";});
  }else auth.innerHTML=`<a class="nav-login" href="account.html">УВІЙТИ</a>`;
}

async function refreshAuth(){
  if(!supabaseClient){currentUser=null;currentProfile=null;setNavLoggedIn(null);return null;}
  const {data:{session}}=await supabaseClient.auth.getSession();
  currentUser=session?.user||null; currentProfile=null;
  if(currentUser){
    const {data}=await supabaseClient.from("profiles").select("id,username,minecraft_nickname,role,created_at,discord_username,bio").eq("id",currentUser.id).maybeSingle();
    currentProfile=data||null;
  }
  setNavLoggedIn(currentProfile); return currentUser;
}
supabaseClient?.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(!currentUser){currentProfile=null;setNavLoggedIn(null)}else setTimeout(refreshAuth,0)});

const mobileMenu=$("mobile-menu");
mobileMenu?.addEventListener("click",()=>$("site-nav")?.classList.toggle("open"));
qsa("#site-nav a").forEach(a=>a.addEventListener("click",()=>$("site-nav")?.classList.remove("open")));

function copyIP(){
  const done=()=>showToast("IP скопійовано",SERVER_IP);
  if(navigator.clipboard?.writeText) navigator.clipboard.writeText(SERVER_IP).then(done).catch(()=>fallbackCopyIP(done)); else fallbackCopyIP(done);
}
function fallbackCopyIP(done){const ta=document.createElement("textarea");ta.value=SERVER_IP;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch{showToast("IP сервера",SERVER_IP)}ta.remove()}
window.copyIP=copyIP;

async function loadServerStatus(){
  const ip=$("server-ip"),count=$("player-count"),status=$("server-status-text"),dot=qs(".live-state .status-dot"),badge=$("server-status-badge");
  if(ip)ip.textContent=SERVER_IP;
  const setState=(online,players=0,max=20)=>{if(status)status.textContent=online?"Сервер онлайн":"Сервер офлайн";if(count)count.textContent=online?`${players}/${max||20}`:"—";if(dot){dot.classList.toggle("status-dot-online",online);dot.classList.toggle("status-dot-muted",!online)}if(badge){badge.textContent=online?"ONLINE":"OFFLINE";badge.classList.toggle("online",online)}};
  try{const r=await fetch(SERVER_STATUS_API,{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();setState(Boolean(d.online),Number(d.players?.online||0),Number(d.players?.max||20));}catch{setState(false)}
}

async function loadPublicStats(){
  const ids=["stat-registered","stat-approved","stat-messages","stat-applications"];
  if(!ids.some(id=>$(id))) return;
  try{
    const {data,error}=await supabaseClient.from("profiles").select("id",{count:"exact",head:true});
    if(error) throw error;
    const {data:stats,error:rpcError}=await supabaseClient.rpc("get_public_server_stats");
    if(rpcError) throw rpcError;
    const row=stats?.[0]||stats;
    $("stat-registered").textContent=Number(row?.registered_players??data?.length??0).toLocaleString("uk-UA");
    $("stat-approved").textContent=Number(row?.approved_players??0).toLocaleString("uk-UA");
    $("stat-messages").textContent=Number(row?.chat_messages??0).toLocaleString("uk-UA");
    $("stat-applications").textContent=Number(row?.whitelist_applications??0).toLocaleString("uk-UA");
  }catch(e){ ids.forEach(id=>{if($(id))$(id).textContent="—"}); }
}

function skinUrl(nickname){return nickname?`https://mc-heads.net/avatar/${encodeURIComponent(nickname)}/128.png?v=${Date.now()}`:null;}
async function getPublicPlayerProfile(userId){
  if(!supabaseClient||!userId)return null;
  const {data,error}=await supabaseClient.rpc("get_public_player_profiles");
  if(error) return null;
  return (data||[]).find(x=>x.id===userId)||null;
}

let authMode="login";
function setupAuthPage(){
  const form=$("auth-form");if(!form)return;
  if(currentUser){location.replace("profile.html");return;}
  const loginTab=$("login-tab"),signupTab=$("signup-tab"),username=$("username"),email=$("email"),password=$("password"),submit=$("auth-submit"),msg=$("auth-message");
  const setMode=m=>{authMode=m;const s=m==="signup";loginTab?.classList.toggle("active",!s);signupTab?.classList.toggle("active",s);username?.classList.toggle("hidden",!s);if(username)username.required=s;if(password)password.autocomplete=s?"new-password":"current-password";if(submit)submit.textContent=s?"СТВОРИТИ АКАУНТ":"УВІЙТИ";if(msg)msg.textContent=""};
  loginTab?.addEventListener("click",()=>setMode("login"));signupTab?.addEventListener("click",()=>setMode("signup"));setMode("login");
  $("forgot-password")?.addEventListener("click",async()=>{
    const mail=email?.value.trim();if(!mail){msg.textContent="Введи email для відновлення пароля.";email?.focus();return}if(!supabaseClient)return;
    msg.textContent="Надсилаємо лист…";
    try{const {error}=await supabaseClient.auth.resetPasswordForEmail(mail,{redirectTo:`${location.origin}/update-password.html`});if(error)throw error;msg.textContent="Лист надіслано. Перевір пошту та Спам.";showToast("Перевір пошту","Посилання для відновлення надіслано.")}catch(e){msg.textContent=e.message||"Не вдалося надіслати лист.";showToast("Помилка",e.message||"Не вдалося надіслати лист.","error")}
  });
  form.addEventListener("submit",async e=>{e.preventDefault();if(!supabaseClient)return;msg.textContent="Обробка…";try{
    if(authMode==="signup"){
      const name=username.value.trim();if(name.length<2)throw Error("Ім’я користувача має містити щонайменше 2 символи.");
      const {data,error}=await supabaseClient.auth.signUp({email:email.value.trim(),password:password.value,options:{data:{username:name}}});if(error)throw error;
      if(data.session){location.href="profile.html"}else msg.textContent="Акаунт створено. Перевір email, якщо потрібне підтвердження.";
    }else{const {error}=await supabaseClient.auth.signInWithPassword({email:email.value.trim(),password:password.value});if(error)throw error;location.href="profile.html"}
  }catch(e){msg.textContent=e.message||"Сталася помилка.";showToast("Помилка",e.message||"Сталася помилка.","error")}});
}

function setupPasswordUpdatePage(){
  const form=$("password-update-form");if(!form)return;const password=$("new-password"),confirm=$("confirm-password"),msg=$("password-update-message");
  supabaseClient?.auth.onAuthStateChange(event=>{if(event==="PASSWORD_RECOVERY"){msg.textContent="Введи новий пароль."}});
  form.addEventListener("submit",async e=>{e.preventDefault();if(!supabaseClient)return;if(password.value.length<6){msg.textContent="Пароль має містити щонайменше 6 символів.";return}if(password.value!==confirm.value){msg.textContent="Паролі не збігаються.";return}msg.textContent="Зберігаємо…";const {error}=await supabaseClient.auth.updateUser({password:password.value});if(error){msg.textContent=error.message;showToast("Помилка",error.message,"error");return}msg.textContent="Пароль змінено.";showToast("Готово","Пароль успішно змінено.");setTimeout(()=>location.href="profile.html",800)});
}

async function setupProfilePage(){
  const page=$("profile-page");if(!page)return;
  const user=await refreshAuth(),guest=$("profile-guest"),content=$("profile-content");
  if(!user){guest?.classList.remove("hidden");content?.classList.add("hidden");return}
  guest?.classList.add("hidden");content?.classList.remove("hidden");
  const username=currentProfile?.username||user.email?.split("@")[0]||"Гравець";
  const publicProfile=await getPublicPlayerProfile(user.id);
  const {data:profileStats}=await supabaseClient.rpc("get_public_player_stats",{p_user_id:user.id});
  const ps=profileStats?.[0]||null;
  const formatPlay=t=>{const sec=Math.floor(Number(t||0)/20),d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),m=Math.floor((sec%3600)/60);return d?`${d} дн ${h} год`:h?`${h} год ${m} хв`:`${m} хв`};
  if($("profile-playtime")) $("profile-playtime").textContent=formatPlay(ps?.play_time_ticks);
  if($("profile-kills")) $("profile-kills").textContent=Number(ps?.player_kills||0).toLocaleString("uk-UA");
  if($("profile-mob-kills")) $("profile-mob-kills").textContent=Number(ps?.mob_kills||0).toLocaleString("uk-UA");
  if($("profile-deaths")) $("profile-deaths").textContent=Number(ps?.deaths||0).toLocaleString("uk-UA");
  if($("profile-last-seen")) $("profile-last-seen").textContent=ps?.is_online?"Онлайн":ps?.last_seen_at?fmtDate(ps.last_seen_at):"Ще не заходив";
  $("profile-username").textContent=username;
  $("profile-username-input").value=username;
  $("profile-minecraft").textContent=currentProfile?.minecraft_nickname||"Не вказано";
  $("profile-discord").textContent=currentProfile?.discord_username||"Не вказано";
  $("profile-bio").textContent=currentProfile?.bio||"Гравець ще нічого не розповів про себе.";
  $("profile-minecraft-input").value=currentProfile?.minecraft_nickname||"";
  $("profile-discord-input").value=currentProfile?.discord_username||"";
  $("profile-bio-input").value=currentProfile?.bio||"";
  $("profile-role").textContent=currentProfile?.role==="admin"?"ADMIN":currentProfile?.role==="streamer"?"STREAMER":"PLAYER";
  $("profile-created").textContent=currentProfile?.created_at?fmtDate(currentProfile.created_at):"—";
  const approved=Boolean(publicProfile?.whitelist_approved);
  $("profile-whitelist-state").textContent=approved?"✓ Whitelist підтверджено":"○ Whitelist ще не підтверджено";
  const skin=$("profile-skin");
  if(approved&&publicProfile?.minecraft_nickname){skin.src=skinUrl(publicProfile.minecraft_nickname);skin.classList.remove("fallback-skin");skin.alt=`Minecraft-голова ${publicProfile.minecraft_nickname}`;skin.onerror=()=>{skin.src="assets/logo.png";skin.classList.add("fallback-skin")};}
  $("profile-settings-form")?.addEventListener("submit",async e=>{
    e.preventDefault();const msg=$("profile-settings-message");msg.textContent="Зберігаємо…";
    const minecraft=$("profile-minecraft-input").value.trim();
    if(minecraft && !/^[A-Za-z0-9_]{3,16}$/.test(minecraft)){msg.textContent="Minecraft-нік має містити 3–16 символів: латинські літери, цифри або _ .";return}
    const discord=$("profile-discord-input").value.trim();const bio=$("profile-bio-input").value.trim();
    const {error}=await supabaseClient.from("profiles").update({minecraft_nickname:minecraft||null,discord_username:discord||null,bio:bio||null}).eq("id",user.id);
    if(error){msg.textContent=error.message;showToast("Профіль",error.message,"error");return}
    currentProfile={...(currentProfile||{}),minecraft_nickname:minecraft,discord_username:discord,bio};
    $("profile-minecraft").textContent=minecraft||"Не вказано";
    $("profile-discord").textContent=discord||"Не вказано";
    $("profile-bio").textContent=bio||"Гравець ще нічого не розповів про себе.";msg.textContent="Зміни збережено.";showToast("Профіль","Налаштування успішно збережено.");
    const fresh=await getPublicPlayerProfile(user.id);if(fresh?.whitelist_approved&&fresh.minecraft_nickname){skin.src=skinUrl(fresh.minecraft_nickname);skin.classList.remove("fallback-skin");}
  });
  $("logout-btn")?.addEventListener("click",async()=>{await supabaseClient.auth.signOut();location.href="account.html"});
}

async function setupWhitelistPage(){
  const page=$("whitelist-page");if(!page)return;const user=await refreshAuth();if(!user){$("whitelist-guest")?.classList.remove("hidden");return}$("whitelist-content")?.classList.remove("hidden");
  const form=$("whitelist-form"),msg=$("whitelist-message"),list=$("my-applications"),submit=form?.querySelector("button[type=submit]");
  async function load(){const {data,error}=await supabaseClient.from("whitelist_applications").select("id,minecraft_nickname,reason,status,created_at,reviewed_at").eq("user_id",user.id).order("created_at",{ascending:false});if(error){list.innerHTML=`<div class="empty-state">${escapeHTML(error.message)}</div>`;return}const apps=data||[];const pending=apps.some(a=>a.status==="pending");if(submit)submit.disabled=pending;const notice=$("whitelist-pending-notice");if(notice)notice.classList.toggle("hidden",!pending);list.innerHTML=apps.length?apps.map(a=>`<article class="application"><div class="application-head"><div><strong>${escapeHTML(a.minecraft_nickname)}</strong><small>${fmtDate(a.created_at)}</small></div><span class="status-pill ${escapeHTML(a.status)}">${escapeHTML(a.status)}</span></div><p>${escapeHTML(a.reason)}</p>${a.reviewed_at?`<small>Переглянуто: ${fmtDate(a.reviewed_at)}</small>`:""}</article>`).join(""):`<div class="empty-state">Заявок ще немає.</div>`}
  form?.addEventListener("submit",async e=>{e.preventDefault();const nickname=$("minecraft-nickname").value.trim(),reason=$("whitelist-reason").value.trim();if(nickname.length<3||reason.length<10)return;submit.disabled=true;msg.textContent="Надсилання…";const {error}=await supabaseClient.from("whitelist_applications").insert({user_id:user.id,minecraft_nickname:nickname,reason});if(error){msg.textContent=error.message;submit.disabled=false;showToast("Whitelist",error.message,"error")}else{msg.textContent="Заявку надіслано.";form.reset();await load();showToast("Готово","Заявку передано адміністратору.")}});await load();
  supabaseClient.channel(`vintage-whitelist-user-${user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"whitelist_applications",filter:`user_id=eq.${user.id}`},load).subscribe();
}

const emojiList=["😀","😎","😂","😍","🤔","😅","🔥","❤️","👍","👎","🎉","⛏️","⚙️","🏭","🌲","💎","☕","👀","✨","💪","😈","🥳","🚀","🧱"];
function buildEmojiPicker(){const box=$("emoji-picker");if(!box)return;box.innerHTML=emojiList.map(e=>`<button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>`).join("")}
async function chatModerationState(userId){
  const {data,error}=await supabaseClient.from("user_moderation").select("type,expires_at,reason,active").eq("user_id",userId).eq("active",true);if(error)return {mute:null,ban:null};
  const now=Date.now(),active=(data||[]).filter(x=>!x.expires_at||new Date(x.expires_at).getTime()>now);return {mute:active.find(x=>x.type==="mute")||null,ban:active.find(x=>x.type==="ban")||null};
}
async function getPublicPlayerProfileList(){if(!supabaseClient)return [];const {data}=await supabaseClient.rpc("get_public_player_profiles");return data||[];}
async function setupChatPage(){
  const page=$("chat-page");if(!page)return;const user=await refreshAuth();if(!user){$("chat-guest")?.classList.remove("hidden");return}$("chat-content")?.classList.remove("hidden");
  const box=$("chat-box"),form=$("chat-form"),input=$("chat-input"),msg=$("chat-message"),emojiBox=$("emoji-picker");let firstLoad=true;let publicPlayers=[];
  function scrollBottom(force=false){if(!box)return;const near=box.scrollHeight-box.scrollTop-box.clientHeight<100;if(force||near)box.scrollTop=box.scrollHeight}
  async function load(){const wasNear=!box||box.scrollHeight-box.scrollTop-box.clientHeight<100;const players=await getPublicPlayerProfileList();publicPlayers=players;const {data,error}=await supabaseClient.from("chat_messages").select("id,user_id,message,created_at,highlighted,profiles!chat_messages_user_id_fkey(username,role,minecraft_nickname)").order("created_at",{ascending:true}).limit(150);if(error){box.innerHTML=`<div class="empty-state">${escapeHTML(error.message)}</div>`;return}box.innerHTML=(data||[]).map(m=>{const mine=m.user_id===user.id,admin=currentProfile?.role==="admin";const pub=publicPlayers.find(x=>x.id===m.user_id);const player=pub?.minecraft_nickname?pub:null;const avatar=player?.whitelist_approved&&player.minecraft_nickname?`<img class="chat-avatar skin-chat" src="${skinUrl(player.minecraft_nickname)}" alt="Minecraft-голова" loading="lazy" onerror="this.src='assets/logo.png';this.classList.add('fallback-skin')">`:`<div class="chat-avatar">${escapeHTML((m.profiles?.username||"Г").trim().charAt(0).toUpperCase())}</div>`;return `<article class="chat-message ${mine?"mine":""} ${m.highlighted?"highlighted":""}" data-id="${escapeHTML(m.id)}"><div class="chat-head">${avatar}<div class="chat-author"><span class="name">${escapeHTML(m.profiles?.username||"гравець")}</span>${m.profiles?.role==="admin"?'<span class="role-label">ADMIN</span>':''}<time>${fmtDate(m.created_at)}</time></div></div><div class="text">${escapeHTML(m.message).replace(/\n/g,"<br>")}</div>${mine||admin?`<div class="chat-actions">${mine?`<button class="chat-edit" type="button">✎ Редагувати</button><button class="highlight-toggle" type="button" data-highlight="${m.highlighted}">${m.highlighted?"★ Прибрати":"☆ Виділити"}</button>`:""}<button class="chat-delete danger-button" type="button">✕ Видалити</button></div>`:""}</article>`}).join("")||`<div class="empty-state">Поки що повідомлень немає. Будь першим!</div>`;if(firstLoad||wasNear)scrollBottom(true);firstLoad=false}
  buildEmojiPicker();$("emoji-toggle")?.addEventListener("click",()=>emojiBox?.classList.toggle("hidden"));emojiBox?.addEventListener("click",e=>{const b=e.target.closest("[data-emoji]");if(b){input.value+=b.dataset.emoji;input.focus();emojiBox.classList.add("hidden")}});document.addEventListener("click",e=>{if(!e.target.closest(".chat-compose"))emojiBox?.classList.add("hidden")});
  box.addEventListener("click",async e=>{const article=e.target.closest(".chat-message");if(!article)return;const id=article.dataset.id;
    const highlight=e.target.closest(".highlight-toggle");if(highlight){const next=highlight.dataset.highlight!=="true";const {error}=await supabaseClient.from("chat_messages").update({highlighted:next}).eq("id",id).eq("user_id",user.id);if(error)showToast("Чат",error.message,"error");else await load();return}
    const edit=e.target.closest(".chat-edit");if(edit){const current=article.querySelector(".text")?.innerText||"";const next=prompt("Редагувати повідомлення:",current);if(next===null)return;const text=next.trim();if(!text||text.length>1000){showToast("Чат","Від 1 до 1000 символів.","error");return}const {error}=await supabaseClient.from("chat_messages").update({message:text}).eq("id",id).eq("user_id",user.id);if(error)showToast("Чат",error.message,"error");else{showToast("Чат","Повідомлення відредаговано.");await load()}return}
    const del=e.target.closest(".chat-delete");if(del){const mine=article.classList.contains("mine"),admin=currentProfile?.role==="admin";if(!mine&&!admin)return;if(!confirm("Видалити це повідомлення?"))return;let q=supabaseClient.from("chat_messages").delete().eq("id",id);if(!admin)q=q.eq("user_id",user.id);const {error}=await q;if(error)showToast("Чат",error.message,"error");else{showToast("Чат","Повідомлення видалено.");await load()}}
  });
  form.addEventListener("submit",async e=>{e.preventDefault();const text=input.value.trim();if(!text)return;const mod=await chatModerationState(user.id);if(mod.ban){msg.textContent=`У тебе бан до ${fmtModeration(mod.ban.expires_at)}${mod.ban.reason?` — ${mod.ban.reason}`:""}.`;return}if(mod.mute){msg.textContent=`Ти не можеш писати до ${fmtModeration(mod.mute.expires_at)}${mod.mute.reason?` — ${mod.mute.reason}`:""}.`;return}msg.textContent="";const {error}=await supabaseClient.from("chat_messages").insert({user_id:user.id,message:text});if(error){msg.textContent=error.message;showToast("Чат",error.message,"error")}else{input.value="";await load()}});
  await load();chatChannel=supabaseClient.channel("vintage-chat-page").on("postgres_changes",{event:"*",schema:"public",table:"chat_messages"},load).subscribe();
}

async function setupAdminPage(){
  const page=$("admin-page");if(!page)return;const user=await refreshAuth();if(!user||currentProfile?.role!=="admin"){$("admin-denied")?.classList.remove("hidden");return}$("admin-content")?.classList.remove("hidden");
  let users=[],applications=[];
  const loadUsers=async()=>{const {data,error}=await supabaseClient.rpc("admin_list_users");if(error){$("admin-users").innerHTML=`<div class="empty-state">${escapeHTML(error.message)}<br><small>Перевір, що SQL-міграції v17/v18 виконані.</small></div>`;return}users=data||[];renderUsers()};
  const loadApps=async(notify=false)=>{const oldPending=new Set(applications.filter(a=>a.status==="pending").map(a=>a.id));const {data,error}=await supabaseClient.from("whitelist_applications").select("id,user_id,minecraft_nickname,reason,status,created_at,reviewed_at,profiles!whitelist_applications_user_id_fkey(username)").order("created_at",{ascending:false});if(error){$("admin-applications").innerHTML=`<div class="empty-state">${escapeHTML(error.message)}</div>`;return}applications=data||[];renderApps();setPendingBadge(applications.filter(a=>a.status==="pending").length);renderUsers();if(notify){const n=applications.filter(a=>a.status==="pending"&&!oldPending.has(a.id));if(n.length)showToast("Нова заявка Whitelist",n.length===1?"Надійшла нова заявка.":`Надійшло нових заявок: ${n.length}.`)}};
  function setPendingBadge(n){const tab=$("admin-apps-tab");if(!tab)return;let b=tab.querySelector(".pending-badge");if(n){if(!b){b=document.createElement("span");b.className="pending-badge";tab.appendChild(b)}b.textContent=n}else b?.remove()}
  const activeModeration=(u,type)=>{const key=type==="mute"?"mute_until":"ban_until";return u?.[key]&&new Date(u[key])>new Date()};
  const latestWhitelist=id=>applications.filter(a=>a.user_id===id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]||null;
  const avatarLetter=name=>escapeHTML((name||"Г" ).trim().charAt(0).toUpperCase());
  function renderUsers(){const q=($("user-search")?.value||"").toLowerCase().trim();const arr=users.filter(u=>[u.username,u.discord_username,u.minecraft_nickname].some(x=>String(x||"").toLowerCase().includes(q)));$("admin-user-count-tab").textContent=users.length;$("admin-user-count-inline").textContent=arr.length;$("admin-users").innerHTML=arr.map(u=>{const muted=activeModeration(u,"mute"),banned=activeModeration(u,"ban"),app=latestWhitelist(u.id);return `<article class="admin-user" data-player-id="${escapeHTML(u.id)}"><div class="player-avatar">${avatarLetter(u.username)}</div><div class="player-main"><button class="player-open" data-player="${escapeHTML(u.id)}" type="button"><strong>${escapeHTML(u.username||"Без ніку")}</strong><span class="player-mc">${escapeHTML(u.minecraft_nickname||"Minecraft-нік не вказано")}</span></button></div><div class="player-status">${muted?`<span class="status-pill warning">MUTE · ${fmtModeration(u.mute_until)}</span>`:""}${banned?`<span class="status-pill rejected">BAN · ${fmtModeration(u.ban_until)}</span>`:""}${app?`<span class="status-pill ${escapeHTML(app.status)}">WHITELIST · ${escapeHTML(app.status)}</span>`:""}${!muted&&!banned&&!app?'<span class="muted-line">Активний гравець</span>':''}</div><div class="admin-actions"><button class="small-button" data-player="${escapeHTML(u.id)}">ПРОФІЛЬ</button>${muted?`<button class="small-button" data-clear="mute" data-id="${escapeHTML(u.id)}">ЗНЯТИ МУТ</button>`:`<button class="small-button" data-mod="mute" data-id="${escapeHTML(u.id)}">МУТ</button>`}${banned?`<button class="small-button danger-button" data-clear="ban" data-id="${escapeHTML(u.id)}">ЗНЯТИ БАН</button>`:`<button class="small-button danger-button" data-mod="ban" data-id="${escapeHTML(u.id)}">БАН</button>`}</div></article>`}).join("")||'<div class="empty-state">Гравців за цим запитом не знайдено.</div>'}
  function renderApps(){const f=$("app-filter")?.value||"all";const arr=applications.filter(a=>f==="all"||a.status===f);$("admin-applications").innerHTML=arr.map(a=>`<article class="application"><div class="application-head"><div><strong>${escapeHTML(a.minecraft_nickname)}</strong><small>${escapeHTML(a.profiles?.username||"гравець")} · ${fmtDate(a.created_at)}</small></div><span class="status-pill ${escapeHTML(a.status)}">${escapeHTML(a.status)}</span></div><p>${escapeHTML(a.reason)}</p>${a.status==="pending"?`<div class="application-actions"><button class="success-button" data-review="approved" data-id="${escapeHTML(a.id)}">ПРИЙНЯТИ</button><button class="danger-button" data-review="rejected" data-id="${escapeHTML(a.id)}">ВІДХИЛИТИ</button></div>`:`<div class="application-reviewed">${a.status==="approved"?"✓ Заявку вже прийнято":"✕ Заявку вже відхилено"}${a.reviewed_at?` · ${fmtDate(a.reviewed_at)}`:""}</div>`}</article>`).join("")||'<div class="empty-state">Немає заявок у цьому фільтрі.</div>'}
  async function openPlayer(id){const u=users.find(x=>x.id===id);if(!u)return;const {data:statRows}=await supabaseClient.rpc("get_public_player_stats",{p_user_id:id});const ps=statRows?.[0]||null;const play=t=>{const sec=Math.floor(Number(t||0)/20),d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),m=Math.floor((sec%3600)/60);return d?`${d} дн ${h} год`:h?`${h} год ${m} хв`:`${m} хв`};const app=latestWhitelist(id),muted=activeModeration(u,"mute"),banned=activeModeration(u,"ban");const body=$("player-profile-body");body.innerHTML=`<div class="player-modal-head"><div class="player-avatar large ${app?.status==="approved"&&app.minecraft_nickname?"skin-modal-avatar":""}">${app?.status==="approved"&&app.minecraft_nickname?`<img class="modal-skin" src="${skinUrl(app.minecraft_nickname)}" alt="Minecraft-голова" loading="lazy" onerror="this.parentElement.innerHTML=avatarLetter(escapeHTML(u.username||"Г"))">`:avatarLetter(u.username)}</div><div><div class="section-tag">PLAYER PROFILE</div><h2>${escapeHTML(u.username||"Без ніку")}</h2><span class="role-label">${u.role==="admin"?"ADMIN":u.role==="streamer"?"STREAMER":"PLAYER"}</span></div></div><div class="player-profile-grid"><div class="player-stat"><span>Minecraft</span><strong>${escapeHTML(u.minecraft_nickname||"Не вказано")}</strong></div><div class="player-stat"><span>Discord</span><strong>${escapeHTML(u.discord_username||"Не вказано")}</strong></div><div class="player-stat"><span>Реєстрація</span><strong>${fmtDate(u.created_at)}</strong></div><div class="player-stat"><span>Час на сервері</span><strong>${play(ps?.play_time_ticks)}</strong></div><div class="player-stat"><span>Вбивства / смерті</span><strong>${Number(ps?.player_kills||0)} / ${Number(ps?.deaths||0)}</strong></div><div class="player-stat"><span>Вбивства мобів</span><strong>${Number(ps?.mob_kills||0)}</strong></div><div class="player-stat"><span>Останній вхід</span><strong>${ps?.is_online?"Онлайн":ps?.last_seen_at?fmtDate(ps.last_seen_at):"Ще не заходив"}</strong></div><div class="player-stat"><span>Модерація</span><strong>${banned?`BAN до ${fmtModeration(u.ban_until)}`:muted?`MUTE до ${fmtModeration(u.mute_until)}`:"Без обмежень"}</strong></div></div><div class="profile-bio admin-profile-bio"><span>ПРО СЕБЕ</span><p>${escapeHTML(u.bio||"Гравець ще нічого не розповів про себе.")}</p></div><div class="profile-whitelist"><strong>Остання Whitelist-заявка</strong><p>${app?`${escapeHTML(app.minecraft_nickname)} · ${escapeHTML(app.status.toUpperCase())} · ${fmtDate(app.created_at)}`:"Заявок ще немає."}</p></div><div class="player-profile-actions"><select class="role-select" id="admin-role-select" data-role-id="${escapeHTML(id)}"><option value="user" ${u.role==="user"?"selected":""}>Гравець</option><option value="streamer" ${u.role==="streamer"?"selected":""}>Стрімер</option><option value="admin" ${u.role==="admin"?"selected":""}>Адміністратор</option></select><button class="small-button" data-role-save="1" data-id="${escapeHTML(id)}">ЗБЕРЕГТИ РОЛЬ</button><button class="small-button" data-mod="mute" data-id="${escapeHTML(id)}">${muted?"ЗМІНИТИ МУТ":"ВИДАТИ МУТ"}</button><button class="small-button danger-button" data-mod="ban" data-id="${escapeHTML(id)}">${banned?"ЗМІНИТИ БАН":"ЗАБАНИТИ"}</button>${muted?`<button class="small-button" data-clear="mute" data-id="${escapeHTML(id)}">ЗНЯТИ МУТ</button>`:""}${banned?`<button class="small-button danger-button" data-clear="ban" data-id="${escapeHTML(id)}">ЗНЯТИ БАН</button>`:""}</div>`;$("player-profile-modal")?.classList.remove("hidden")}
  const moderationModal=$("moderation-modal"),moderationType=$("moderation-type"),moderationUser=$("moderation-user"),moderationDuration=$("moderation-duration"),moderationReason=$("moderation-reason");
  const closeModeration=()=>moderationModal?.classList.add("hidden");
  const openModeration=(id,type)=>{if(!moderationModal)return;moderationUser.value=id;moderationType.value=type;moderationReason.value="";moderationDuration.value="60";$("moderation-title").textContent=type==="mute"?"Видати / змінити мут":"Видати / змінити бан";moderationModal.classList.remove("hidden");setTimeout(()=>moderationDuration?.focus(),50)};
  $("moderation-cancel")?.addEventListener("click",closeModeration);moderationModal?.addEventListener("click",e=>{if(e.target===moderationModal)closeModeration()});
  $("moderation-confirm")?.addEventListener("click",async()=>{const id=moderationUser.value,type=moderationType.value,minutes=Number(moderationDuration.value||0),reason=moderationReason.value.trim()||null;if(!id)return;const {error}=await supabaseClient.rpc("admin_set_moderation",{target_user:id,moderation_type:type,duration_minutes:minutes,moderation_reason:reason});if(error)showToast("Модерація",error.message,"error");else{showToast(type==="mute"?"Мут застосовано":"Бан застосовано",minutes===0?"Назавжди":"Обмеження встановлено.");closeModeration();await loadUsers();openPlayer(id)}});
  $("user-search")?.addEventListener("input",renderUsers);$("app-filter")?.addEventListener("change",renderApps);$("player-profile-close")?.addEventListener("click",()=>$("player-profile-modal")?.classList.add("hidden"));$("player-profile-modal")?.addEventListener("click",e=>{if(e.target===$("player-profile-modal"))$("player-profile-modal")?.classList.add("hidden")});
  $("admin-users")?.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;const id=b.dataset.id||b.dataset.player;if(b.dataset.clear){const {error}=await supabaseClient.rpc("admin_clear_moderation",{target_user:id,moderation_type:b.dataset.clear});if(error)showToast("Модерація",error.message,"error");else{showToast("Готово","Обмеження знято.");await loadUsers();openPlayer(id)}return}if(b.dataset.mod){openModeration(id,b.dataset.mod);return}if(b.dataset.player){openPlayer(id)}});
  $("player-profile-body")?.addEventListener("change",e=>{});
  $("player-profile-body")?.addEventListener("click",async e=>{const rb=e.target.closest("[data-role-save]");if(rb){const sel=$("admin-role-select");const {error}=await supabaseClient.rpc("admin_set_role",{target_user:rb.dataset.id,new_role:sel?.value||"user"});if(error)showToast("Роль",error.message,"error");else{showToast("Роль","Роль гравця оновлено.");await loadUsers();openPlayer(rb.dataset.id)}return}const b=e.target.closest("button");if(!b)return;const id=b.dataset.id;if(b.dataset.clear){const {error}=await supabaseClient.rpc("admin_clear_moderation",{target_user:id,moderation_type:b.dataset.clear});if(error)showToast("Модерація",error.message,"error");else{showToast("Готово","Обмеження знято.");await loadUsers();openPlayer(id)}return}if(b.dataset.mod)openModeration(id,b.dataset.mod)});
  $("admin-applications")?.addEventListener("click",async e=>{const b=e.target.closest("button[data-review]");if(!b||b.disabled)return;b.disabled=true;const {error}=await supabaseClient.from("whitelist_applications").update({status:b.dataset.review,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",b.dataset.id).eq("status","pending");if(error){b.disabled=false;showToast("Заявки",error.message,"error")}else{showToast("Заявку оновлено","Статус змінено.");await loadApps()}});
  qsa(".admin-tab").forEach(tab=>tab.addEventListener("click",()=>{qsa(".admin-tab").forEach(x=>x.classList.remove("active"));qsa(".admin-section").forEach(x=>x.classList.remove("active"));tab.classList.add("active");$(tab.dataset.target)?.classList.add("active")}));
  await Promise.all([loadUsers(),loadApps(false)]);adminWhitelistChannel=supabaseClient.channel("vintage-whitelist-admin").on("postgres_changes",{event:"*",schema:"public",table:"whitelist_applications"},()=>loadApps(true)).subscribe();setInterval(()=>loadApps(true),20000);
}

function setupGuide(){qsa(".era").forEach(b=>b.addEventListener("click",()=>{qsa(".era,.guide-section").forEach(x=>x.classList.remove("active"));b.classList.add("active");qs(`[data-panel="${b.dataset.era}"]`)?.classList.add("active")}))}

(async()=>{await refreshAuth();loadServerStatus();loadPublicStats();setupAuthPage();setupPasswordUpdatePage();await setupProfilePage();await setupWhitelistPage();await setupChatPage();await setupAdminPage();setupGuide()})();
