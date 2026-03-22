import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = {
  auth: "https://functions.poehali.dev/80c8a01f-6b37-4959-81a3-5f64efa52c96",
  servers: "https://functions.poehali.dev/0255463e-3f83-4cb8-8525-ea681ace3083",
  channels: "https://functions.poehali.dev/4e8bfbb0-213c-419e-a835-197d62939f9e",
  messages: "https://functions.poehali.dev/02771259-ef74-4425-bb72-322f5b54e75d",
  social: "https://functions.poehali.dev/e1d21864-0683-40c3-a0e3-c24c6d54c7f8",
};

const AVATAR_COLORS = ["#5865f2","#3ba55c","#ed4245","#faa61a","#9b59b6","#1abc9c","#e67e22","#e91e8c","#00b0f4","#f47fff"];

function authHeaders(token: string) {
  return { "Content-Type": "application/json", "X-Session-Token": token };
}

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  bio?: string;
  status_text?: string;
}

interface Friend {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  friendship_id: number;
  friendship_status?: string;
}

interface DMMessage {
  id: number;
  content: string;
  time: string;
  sender_id: number;
  display_name: string;
  avatar_color: string;
  avatar: string;
  is_me: boolean;
}

interface DMPartner {
  id: number;
  display_name: string;
  username: string;
  avatar_color: string;
}

interface Server {
  id: number;
  name: string;
  icon: string;
  color: string;
  owner_id: number;
}

interface Channel {
  id: number;
  name: string;
  type: string;
  position: number;
}

interface Message {
  id: number;
  content: string;
  time: string;
  user_id: number;
  display_name: string;
  avatar_color: string;
  avatar: string;
}

// ---- Экран входа / регистрации ----
function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        action: isLogin ? "login" : "register",
        username: username.trim().toLowerCase(),
        password,
      };
      if (!isLogin) body.display_name = displayName.trim() || username.trim();

      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      localStorage.setItem("kiscord_token", data.token);
      onLogin(data.user, data.token);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#5865f2] rounded-3xl flex items-center justify-center mb-4 text-4xl shadow-lg">
            💬
          </div>
          <h1 className="text-white text-3xl font-bold">Kiscord</h1>
        </div>

        {/* Карточка */}
        <div className="bg-[#2f3136] rounded-xl shadow-2xl overflow-hidden">
          {/* Табы */}
          <div className="flex border-b border-[#202225]">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "text-white border-b-2 border-[#5865f2]"
                    : "text-[#8e9297] hover:text-[#dcddde]"
                }`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-8 space-y-4">
            {/* Заголовок */}
            <div className="text-center mb-6">
              <h2 className="text-white text-xl font-bold">
                {isLogin ? "С возвращением!" : "Создать аккаунт"}
              </h2>
              <p className="text-[#b9bbbe] text-sm mt-1">
                {isLogin ? "Рады снова видеть тебя!" : "Присоединяйся к нам сегодня!"}
              </p>
            </div>

            {/* Логин */}
            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">
                Имя пользователя <span className="text-[#ed4245]">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="example"
                maxLength={32}
                required
                className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
                autoFocus
              />
            </div>

            {/* Отображаемое имя — только при регистрации */}
            {!isLogin && (
              <div>
                <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Как тебя называть?"
                  maxLength={64}
                  className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
                />
              </div>
            )}

            {/* Пароль */}
            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">
                Пароль <span className="text-[#ed4245]">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Введите пароль" : "Минимум 6 символов"}
                required
                className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
              />
            </div>

            {/* Подтверждение пароля — только при регистрации */}
            {!isLogin && (
              <div>
                <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Повторите пароль <span className="text-[#ed4245]">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                  className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
                />
              </div>
            )}

            {/* Ошибка */}
            {error && (
              <div className="bg-[#ed4245]/10 border border-[#ed4245]/30 rounded px-4 py-3 flex items-center gap-2">
                <Icon name="AlertCircle" size={16} className="text-[#ed4245] flex-shrink-0" />
                <p className="text-[#ed4245] text-sm">{error}</p>
              </div>
            )}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={!username.trim() || !password || loading}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition-colors mt-2"
            >
              {loading ? (isLogin ? "Входим..." : "Создаём...") : isLogin ? "Войти" : "Зарегистрироваться"}
            </button>

            {/* Переключатель */}
            <p className="text-[#72767d] text-xs text-center pt-1">
              {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button
                type="button"
                onClick={() => switchMode(isLogin ? "register" : "login")}
                className="text-[#00b0f4] hover:underline"
              >
                {isLogin ? "Зарегистрируйся" : "Войди"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---- Модалка создания канала ----
function CreateChannelModal({
  server,
  token,
  onClose,
  onCreate,
}: {
  server: Server;
  token: string;
  onClose: () => void;
  onCreate: (ch: Channel) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API.channels}/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ server_id: server.id, name: name.trim(), type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onCreate(data.channel);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#36393f] rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-white text-xl font-bold">Создать канал</h2>
          <p className="text-[#b9bbbe] text-sm mt-1">в {server.icon} {server.name}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Тип канала</label>
            <div className="grid grid-cols-2 gap-2">
              {([["text", "# Текстовый", "Обычный чат"], ["voice", "🔊 Голосовой", "Голосовое общение"]] as const).map(([t, label, desc]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`p-3 rounded-lg text-left border-2 transition-colors ${
                    type === t ? "border-[#5865f2] bg-[#5865f2]/10" : "border-[#40444b] bg-[#40444b] hover:border-[#5d6269]"
                  }`}
                >
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-[#b9bbbe] text-xs mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Название канала</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72767d]">{type === "text" ? "#" : "🔊"}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder={type === "text" ? "новый-канал" : "голосовой"}
                maxLength={64}
                autoFocus
                className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 pl-8 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
              />
            </div>
          </div>

          {error && <p className="text-[#ed4245] text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-transparent hover:underline text-[#b9bbbe] py-2.5 rounded font-medium transition-colors">
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white py-2.5 rounded font-medium transition-colors"
            >
              {loading ? "Создаём..." : "Создать канал"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Модалка создания сервера ----
function CreateServerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (s: Server) => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💬");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("kiscord_token") || "";

  const ICONS = ["💬", "🎮", "🎵", "🎨", "💻", "🏆", "🔥", "🌍", "📚", "🎉", "⚡", "🦄"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API.servers}/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name: name.trim(), icon }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onCreate(data.server);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#36393f] rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white text-xl font-bold mb-1">Создать сервер</h2>
        <p className="text-[#b9bbbe] text-sm mb-6">Придумайте название и выберите иконку</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Иконка</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === ic ? "bg-[#5865f2] ring-2 ring-white" : "bg-[#40444b] hover:bg-[#4f545c]"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой крутой сервер"
              maxLength={64}
              className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
              autoFocus
            />
          </div>
          {error && <p className="text-[#ed4245] text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-[#4f545c] hover:bg-[#5d6269] text-white py-2.5 rounded font-medium transition-colors">
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white py-2.5 rounded font-medium transition-colors"
            >
              {loading ? "Создаём..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Настройки профиля ----
function ProfileSettings({ user, token, onClose, onUpdate }: {
  user: User; token: string; onClose: () => void;
  onUpdate: (u: User) => void;
}) {
  const [tab, setTab] = useState<"profile"|"account">("profile");
  const [displayName, setDisplayName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio || "");
  const [statusText, setStatusText] = useState(user.status_text || "");
  const [avatarColor, setAvatarColor] = useState(user.avatar_color);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{text:string;ok:boolean}|null>(null);
  const h = { "Content-Type":"application/json","X-Session-Token":token };

  const saveProfile = async () => {
    setSaving(true); setMsg(null);
    const res = await fetch(`${API.social}?action=profile_update`, {
      method:"POST", headers:h,
      body:JSON.stringify({display_name:displayName,bio,status_text:statusText,avatar_color:avatarColor})
    });
    const d = await res.json();
    setSaving(false);
    if (d.user) { onUpdate(d.user); setMsg({text:"Профиль сохранён!",ok:true}); }
    else setMsg({text:d.error||"Ошибка",ok:false});
  };

  const changePassword = async () => {
    if (newPw !== confirmPw) { setMsg({text:"Пароли не совпадают",ok:false}); return; }
    setSaving(true); setMsg(null);
    const res = await fetch(`${API.social}?action=password_change`, {
      method:"POST", headers:h,
      body:JSON.stringify({old_password:oldPw,new_password:newPw})
    });
    const d = await res.json();
    setSaving(false);
    if (d.success) { setMsg({text:"Пароль изменён!",ok:true}); setOldPw(""); setNewPw(""); setConfirmPw(""); }
    else setMsg({text:d.error||"Ошибка",ok:false});
  };

  return (
    <div className="fixed inset-0 bg-[#36393f] z-50 flex">
      {/* Боковое меню настроек */}
      <div className="w-52 bg-[#2f3136] flex flex-col p-4 gap-1">
        <p className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide px-2 mb-2">Настройки</p>
        {([["profile","Профиль"],["account","Учётная запись"]] as const).map(([t,label])=>(
          <button key={t} onClick={()=>{setTab(t);setMsg(null);}}
            className={`text-left px-2 py-2 rounded text-sm font-medium transition-colors ${tab===t?"bg-[#393c43] text-white":"text-[#b9bbbe] hover:bg-[#393c43] hover:text-white"}`}>
            {label}
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={onClose} className="flex items-center gap-2 px-2 py-2 rounded text-sm text-[#ed4245] hover:bg-[#ed4245]/10 w-full transition-colors">
            <Icon name="X" size={16}/> Закрыть
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {tab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold">Профиль</h2>

            {/* Превью аватара */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{backgroundColor:avatarColor}}>
                {displayName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{displayName}</p>
                <p className="text-[#b9bbbe] text-sm">#{user.username}</p>
              </div>
            </div>

            {/* Цвет аватара */}
            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Цвет аватара</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c=>(
                  <button key={c} onClick={()=>setAvatarColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${avatarColor===c?"border-white scale-110":"border-transparent"}`}
                    style={{backgroundColor:c}}/>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">Отображаемое имя</label>
              <input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={64}
                className="w-full bg-[#40444b] text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"/>
            </div>

            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">Статус</label>
              <input value={statusText} onChange={e=>setStatusText(e.target.value)} maxLength={128}
                placeholder="Чем занимаетесь?"
                className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"/>
            </div>

            <div>
              <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">О себе</label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={300} rows={3}
                placeholder="Расскажите о себе..."
                className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm resize-none"/>
              <p className="text-[#72767d] text-xs mt-1">{bio.length}/300</p>
            </div>

            {msg && <div className={`px-4 py-3 rounded text-sm ${msg.ok?"bg-[#3ba55c]/20 text-[#3ba55c]":"bg-[#ed4245]/20 text-[#ed4245]"}`}>{msg.text}</div>}
            <button onClick={saveProfile} disabled={saving}
              className="bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-6 py-2.5 rounded font-medium transition-colors">
              {saving?"Сохраняем...":"Сохранить изменения"}
            </button>
          </div>
        )}

        {tab === "account" && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold">Учётная запись</h2>

            <div className="bg-[#2f3136] rounded-lg p-4 space-y-3">
              <div>
                <p className="text-[#b9bbbe] text-xs uppercase tracking-wide mb-1">Имя пользователя</p>
                <p className="text-white font-medium">#{user.username}</p>
              </div>
            </div>

            <div className="bg-[#2f3136] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Сменить пароль</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">Текущий пароль</label>
                  <input type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)}
                    className="w-full bg-[#40444b] text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"/>
                </div>
                <div>
                  <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">Новый пароль</label>
                  <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}
                    className="w-full bg-[#40444b] text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"/>
                </div>
                <div>
                  <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">Подтвердите пароль</label>
                  <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)}
                    className="w-full bg-[#40444b] text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"/>
                </div>
                {msg && <div className={`px-4 py-3 rounded text-sm ${msg.ok?"bg-[#3ba55c]/20 text-[#3ba55c]":"bg-[#ed4245]/20 text-[#ed4245]"}`}>{msg.text}</div>}
                <button onClick={changePassword} disabled={saving||!oldPw||!newPw||!confirmPw}
                  className="bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-6 py-2.5 rounded font-medium transition-colors w-full">
                  {saving?"Меняем...":"Сменить пароль"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Друзья ----
function FriendsPanel({ token, onStartDM }: { token: string; onStartDM: (u:{id:number;display_name:string;username:string;avatar_color:string})=>void }) {
  const [tab, setTab] = useState<"all"|"pending"|"search">("all");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchRes, setSearchRes] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const h = { "Content-Type":"application/json","X-Session-Token":token };

  const loadFriends = async () => {
    const r = await fetch(`${API.social}?action=friends_list`,{headers:h});
    const d = await r.json(); if(d.friends) setFriends(d.friends);
  };
  const loadPending = async () => {
    const r = await fetch(`${API.social}?action=friends_pending`,{headers:h});
    const d = await r.json(); if(d.requests) setPending(d.requests);
  };

  useEffect(()=>{ loadFriends(); loadPending(); },[]);

  const search = async () => {
    if(searchQ.trim().length<2) return;
    setSearching(true);
    const r = await fetch(`${API.social}?action=friends_search&q=${encodeURIComponent(searchQ)}`,{headers:h});
    const d = await r.json();
    setSearchRes(d.users||[]); setSearching(false);
  };

  const sendReq = async (userId:number) => {
    await fetch(`${API.social}?action=friends_send`,{method:"POST",headers:h,body:JSON.stringify({user_id:userId})});
    setSearchRes(prev=>prev.map(u=>u.id===userId?{...u,friendship_status:"pending"}:u));
  };

  const accept = async (fid:number) => {
    await fetch(`${API.social}?action=friends_accept`,{method:"POST",headers:h,body:JSON.stringify({friendship_id:fid})});
    await loadFriends(); await loadPending();
  };

  const decline = async (fid:number) => {
    await fetch(`${API.social}?action=friends_decline`,{method:"POST",headers:h,body:JSON.stringify({friendship_id:fid})});
    await loadPending(); await loadFriends();
  };

  const Avatar = ({u}:{u:Friend}) => (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{backgroundColor:u.avatar_color||"#5865f2"}}>
      {(u.display_name||"?")[0].toUpperCase()}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#36393f]">
      {/* Header */}
      <div className="h-12 border-b border-[#202225] flex items-center px-4 gap-4">
        <Icon name="Users" size={20} className="text-[#8e9297]"/>
        <span className="text-white font-bold">Друзья</span>
        <div className="flex gap-1 ml-4">
          {([["all","Все"],["pending",`Входящие${pending.length>0?" ("+pending.length+")":""}`],["search","Добавить"]] as const).map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${tab===t?"bg-[#5865f2] text-white":"text-[#b9bbbe] hover:bg-[#40444b] hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Все друзья */}
        {tab==="all" && (
          <div>
            <p className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-3">Все друзья — {friends.length}</p>
            {friends.length===0 && <p className="text-[#72767d] text-sm">У вас пока нет друзей. Найдите людей во вкладке «Добавить»!</p>}
            {friends.map(f=>(
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#32353b] group">
                <Avatar u={f}/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{f.display_name}</p>
                  <p className="text-[#b9bbbe] text-xs">#{f.username}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>onStartDM(f)} title="Написать"
                    className="w-8 h-8 bg-[#40444b] rounded-full flex items-center justify-center hover:bg-[#5865f2] transition-colors">
                    <Icon name="MessageCircle" size={16} className="text-[#b9bbbe]"/>
                  </button>
                  <button onClick={()=>decline(f.friendship_id)} title="Удалить"
                    className="w-8 h-8 bg-[#40444b] rounded-full flex items-center justify-center hover:bg-[#ed4245] transition-colors">
                    <Icon name="UserMinus" size={16} className="text-[#b9bbbe]"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Входящие */}
        {tab==="pending" && (
          <div>
            <p className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-3">Входящие запросы — {pending.length}</p>
            {pending.length===0 && <p className="text-[#72767d] text-sm">Нет входящих запросов.</p>}
            {pending.map(f=>(
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#32353b]">
                <Avatar u={f}/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{f.display_name}</p>
                  <p className="text-[#b9bbbe] text-xs">Входящий запрос</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>accept(f.friendship_id)}
                    className="w-8 h-8 bg-[#3ba55c] rounded-full flex items-center justify-center hover:bg-[#2d8c4e] transition-colors">
                    <Icon name="Check" size={16} className="text-white"/>
                  </button>
                  <button onClick={()=>decline(f.friendship_id)}
                    className="w-8 h-8 bg-[#ed4245] rounded-full flex items-center justify-center hover:bg-[#c03537] transition-colors">
                    <Icon name="X" size={16} className="text-white"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Поиск */}
        {tab==="search" && (
          <div>
            <p className="text-white font-semibold mb-1">Добавить в друзья</p>
            <p className="text-[#b9bbbe] text-sm mb-4">Поиск по имени или нику</p>
            <div className="flex gap-2 mb-4">
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&search()}
                placeholder="Введите имя..."
                className="flex-1 bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"/>
              <button onClick={search} disabled={searching}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2.5 rounded font-medium transition-colors text-sm">
                {searching?"...":"Найти"}
              </button>
            </div>
            {searchRes.map(u=>(
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#32353b]">
                <Avatar u={u}/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{u.display_name}</p>
                  <p className="text-[#b9bbbe] text-xs">#{u.username}</p>
                </div>
                {!u.friendship_status && (
                  <button onClick={()=>sendReq(u.id)}
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs px-3 py-1.5 rounded font-medium transition-colors">
                    Добавить
                  </button>
                )}
                {u.friendship_status==="pending" && <span className="text-[#faa61a] text-xs font-medium">Запрос отправлен</span>}
                {u.friendship_status==="accepted" && <span className="text-[#3ba55c] text-xs font-medium">Уже друзья</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- DM чат ----
function DMChat({ me, token, partner, onBack }: {
  me: User; token: string;
  partner: {id:number;display_name:string;username:string;avatar_color:string};
  onBack: ()=>void;
}) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const h = { "Content-Type":"application/json","X-Session-Token":token };

  const load = useCallback(async(silent=false)=>{
    const r = await fetch(`${API.social}?action=dm_history&with_user=${partner.id}`,{headers:h});
    const d = await r.json();
    if(d.messages) setMessages(d.messages);
  },[partner.id,token]);

  useEffect(()=>{
    load();
    pollRef.current = setInterval(()=>load(true),3000);
    return ()=>{ if(pollRef.current) clearInterval(pollRef.current); };
  },[load]);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const send = async()=>{
    if(!input.trim()||sending) return;
    setSending(true);
    const content = input.trim(); setInput("");
    const r = await fetch(`${API.social}?action=dm_send`,{method:"POST",headers:h,body:JSON.stringify({receiver_id:partner.id,content})});
    const d = await r.json();
    if(d.message) setMessages(prev=>[...prev,d.message]);
    setSending(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 border-b border-[#202225] flex items-center px-4 gap-3">
        <button onClick={onBack} className="md:hidden text-[#8e9297] hover:text-white mr-1">
          <Icon name="ArrowLeft" size={20}/>
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{backgroundColor:partner.avatar_color}}>
          {partner.display_name[0]?.toUpperCase()}
        </div>
        <span className="text-white font-bold">{partner.display_name}</span>
        <span className="text-[#8e9297] text-sm hidden sm:block">#{partner.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {messages.length===0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4"
              style={{backgroundColor:partner.avatar_color}}>
              {partner.display_name[0]?.toUpperCase()}
            </div>
            <h3 className="text-white text-xl font-bold mb-1">{partner.display_name}</h3>
            <p className="text-[#b9bbbe] text-sm">Начало вашего диалога с {partner.display_name}</p>
          </div>
        )}
        {messages.map((msg,idx)=>{
          const prev = messages[idx-1];
          const grouped = prev&&prev.sender_id===msg.sender_id;
          return (
            <div key={msg.id} className={`flex gap-3 group hover:bg-[#32353b] px-2 py-0.5 rounded ${!grouped?"mt-4":""}`}>
              {!grouped?(
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                  style={{backgroundColor:msg.avatar_color}}>
                  {msg.avatar}
                </div>
              ):<div className="w-10 flex-shrink-0"/>}
              <div className="flex-1 min-w-0">
                {!grouped&&(
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-medium text-sm" style={{color:msg.avatar_color}}>{msg.display_name}</span>
                    {msg.is_me&&<span className="text-[#72767d] text-xs">(вы)</span>}
                    <span className="text-[#72767d] text-xs">{msg.time}</span>
                  </div>
                )}
                <p className="text-[#dcddde] text-sm leading-relaxed break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>

      <div className="px-4 pb-6 pt-0 flex-shrink-0">
        <div className="bg-[#40444b] rounded-lg flex items-center px-4">
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
            placeholder={`Сообщение @${partner.display_name}`}
            className="flex-1 bg-transparent text-[#dcddde] placeholder-[#72767d] text-sm py-3.5 outline-none"/>
          <button onClick={send} disabled={!input.trim()||sending}
            className={`transition-colors ${input.trim()&&!sending?"text-[#5865f2] hover:text-[#4752c4]":"text-[#4f545c]"}`}>
            <Icon name="Send" size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Основной интерфейс ----
function DiscordApp({ user: initialUser, token, onLogout }: { user: User; token: string; onLogout: () => void }) {
  const [user, setUser] = useState<User>(initialUser);
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState<"servers"|"friends"|"dm">("servers");
  const [dmPartner, setDmPartner] = useState<DMPartner|null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = authHeaders(token);

  // Загрузить серверы
  const loadServers = useCallback(async () => {
    const res = await fetch(API.servers, { headers });
    const data = await res.json();
    if (data.servers) {
      setServers(data.servers);
      if (!activeServer && data.servers.length > 0) {
        setActiveServer(data.servers[0]);
      }
    }
  }, [token]);

  // Загрузить каналы
  const loadChannels = useCallback(async (server: Server) => {
    const res = await fetch(`${API.channels}?server_id=${server.id}`, { headers });
    const data = await res.json();
    if (data.channels) {
      setChannels(data.channels);
      const first = data.channels.find((c: Channel) => c.type === "text");
      if (first) setActiveChannel(first);
    }
  }, [token]);

  // Загрузить сообщения
  const loadMessages = useCallback(async (channel: Channel, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    const res = await fetch(`${API.messages}?channel_id=${channel.id}`, { headers });
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
    if (!silent) setLoadingMsgs(false);
  }, [token]);

  useEffect(() => { loadServers(); }, [loadServers]);

  useEffect(() => {
    if (activeServer) loadChannels(activeServer);
  }, [activeServer]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeChannel, true), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeChannel || sending) return;
    setSending(true);
    const content = inputValue.trim();
    setInputValue("");
    const res = await fetch(API.messages, {
      method: "POST",
      headers,
      body: JSON.stringify({ channel_id: activeChannel.id, content }),
    });
    const data = await res.json();
    if (data.message) setMessages((prev) => [...prev, data.message]);
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const switchServer = (s: Server) => {
    setActiveServer(s);
    setActiveChannel(null);
    setChannels([]);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const switchChannel = (ch: Channel) => {
    setActiveChannel(ch);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const onServerCreated = (s: Server) => {
    setShowCreateServer(false);
    setServers((prev) => [...prev, s]);
    switchServer(s);
  };

  const onChannelCreated = (ch: Channel) => {
    setShowCreateChannel(false);
    setChannels((prev) => [...prev, ch]);
    switchChannel(ch);
  };

  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  const startDM = (partner: DMPartner) => {
    setDmPartner(partner);
    setView("dm");
    setMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen flex bg-[#36393f] text-white overflow-hidden select-none">
      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} onCreate={onServerCreated} />}
      {showCreateChannel && activeServer && (
        <CreateChannelModal server={activeServer} token={token} onClose={() => setShowCreateChannel(false)} onCreate={onChannelCreated} />
      )}
      {showProfile && (
        <ProfileSettings user={user} token={token} onClose={() => setShowProfile(false)} onUpdate={(u) => setUser(u)} />
      )}

      {/* Серверная панель */}
      <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        {/* DM кнопка */}
        <button
          onClick={() => { setView("friends"); setActiveServer(null); }}
          title="Личные сообщения"
          className={`w-12 h-12 flex items-center justify-center rounded-3xl hover:rounded-xl transition-all duration-200 text-xl ${view==="friends"||view==="dm" ? "bg-[#5865f2] rounded-xl" : "bg-[#36393f] hover:bg-[#5865f2]"}`}
        >
          💬
        </button>
        <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>

        {servers.map((s) => (
          <div key={s.id} className="relative flex items-center group" onClick={() => { switchServer(s); setView("servers"); }}>
            {activeServer?.id === s.id && (
              <div className="absolute -left-3 w-1 h-10 bg-white rounded-r-full" />
            )}
            <div
              title={s.name}
              className={`w-12 h-12 flex items-center justify-center cursor-pointer text-xl transition-all duration-200 ${
                activeServer?.id === s.id ? "rounded-xl" : "rounded-3xl hover:rounded-xl"
              }`}
              style={{ backgroundColor: activeServer?.id === s.id ? (s.color || "#5865f2") : "#36393f" }}
            >
              {s.icon || "💬"}
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
              {s.name}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowCreateServer(true)}
          title="Создать сервер"
          className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl hover:bg-[#3ba55c] transition-all duration-200 flex items-center justify-center text-[#3ba55c] hover:text-white text-2xl font-light"
        >
          +
        </button>

        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={() => setShowProfile(true)}
            title="Настройки профиля"
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold hover:ring-2 hover:ring-white transition-all relative"
            style={{ backgroundColor: user.avatar_color }}
          >
            {user.display_name[0]?.toUpperCase()}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#3ba55c] border-2 border-[#202225] rounded-full" />
          </button>
        </div>
      </div>

      {/* Панель каналов */}
      <div className={`${mobileSidebarOpen ? "flex" : "hidden"} md:flex w-60 bg-[#2f3136] flex-col flex-shrink-0`}>
        <div className="h-12 px-4 flex items-center border-b border-[#202225]">
          <h2 className="text-white font-bold text-base flex-1 truncate">{activeServer?.name || "Выберите сервер"}</h2>
          <Icon name="ChevronDown" size={18} className="text-[#8e9297]" />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!activeServer && (
            <div className="text-[#8e9297] text-sm text-center mt-8 px-4">
              Выберите сервер или создайте новый
            </div>
          )}

          {textChannels.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide group/header">
                <Icon name="ChevronDown" size={12} className="mr-1" />
                <span className="flex-1">Текстовые каналы</span>
                {activeServer?.owner_id === user.id && (
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    title="Создать канал"
                    className="opacity-0 group-hover/header:opacity-100 hover:text-white transition-opacity"
                  >
                    <Icon name="Plus" size={14} />
                  </button>
                )}
              </div>
              {textChannels.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => switchChannel(ch)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer ${
                    activeChannel?.id === ch.id
                      ? "bg-[#393c43] text-white"
                      : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]"
                  }`}
                >
                  <Icon name="Hash" size={16} />
                  <span className="text-sm">{ch.name}</span>
                </div>
              ))}
            </div>
          )}

          {voiceChannels.length > 0 && (
            <div>
              <div className="flex items-center gap-1 px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
                <Icon name="ChevronDown" size={12} />
                <span>Голосовые каналы</span>
              </div>
              {voiceChannels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]">
                  <Icon name="Volume2" size={16} />
                  <span className="text-sm">{ch.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Панель пользователя */}
        <div className="h-14 bg-[#292b2f] flex items-center px-2 gap-2">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: user.avatar_color }}>
              {user.display_name[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#292b2f] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.display_name}</div>
            <div className="text-[#b9bbbe] text-xs">#{user.username}</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setMuted(!muted)}
              className={`w-8 h-8 rounded flex items-center justify-center hover:bg-[#40444b] transition-colors ${muted ? "text-[#ed4245]" : "text-[#b9bbbe]"}`}
            >
              <Icon name={muted ? "MicOff" : "Mic"} size={16} />
            </button>
            <button
              onClick={() => setDeafened(!deafened)}
              className={`w-8 h-8 rounded flex items-center justify-center hover:bg-[#40444b] transition-colors ${deafened ? "text-[#ed4245]" : "text-[#b9bbbe]"}`}
            >
              <Icon name={deafened ? "VolumeX" : "Headphones"} size={16} />
            </button>
            <button
              onClick={() => setShowProfile(true)}
              title="Настройки"
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#40444b] text-[#b9bbbe] transition-colors">
              <Icon name="Settings" size={16} />
            </button>
            <button onClick={onLogout} title="Выйти" className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#40444b] text-[#b9bbbe] hover:text-[#ed4245] transition-colors">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Область чата или DM/Друзья */}
      {view === "friends" && (
        <FriendsPanel token={token} onStartDM={startDM} />
      )}
      {view === "dm" && dmPartner && (
        <DMChat me={user} token={token} partner={dmPartner} onBack={() => setView("friends")} />
      )}
      <div className={`flex-1 flex flex-col min-w-0 ${view !== "servers" ? "hidden" : ""}`}>
        {/* Заголовок */}
        <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-3 flex-shrink-0">
          <button className="md:hidden text-[#8e9297] hover:text-white mr-1" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
            <Icon name="Menu" size={22} />
          </button>
          {activeChannel ? (
            <>
              <Icon name="Hash" size={20} className="text-[#8e9297]" />
              <span className="text-white font-bold">{activeChannel.name}</span>
              <div className="w-px h-6 bg-[#40444b] mx-1 hidden sm:block" />
              <span className="text-[#8e9297] text-sm hidden sm:block">#{activeChannel.name} — {activeServer?.name}</span>
            </>
          ) : (
            <span className="text-[#8e9297]">Выберите канал</span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button className="text-[#b9bbbe] hover:text-white transition-colors"><Icon name="Bell" size={20} /></button>
            <button className="text-[#b9bbbe] hover:text-white transition-colors"><Icon name="Search" size={20} /></button>
          </div>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {!activeServer && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-white text-2xl font-bold mb-2">Добро пожаловать!</h3>
              <p className="text-[#b9bbbe]">Создайте сервер или выберите существующий слева</p>
              <button
                onClick={() => setShowCreateServer(true)}
                className="mt-4 bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2.5 rounded font-medium transition-colors"
              >
                Создать сервер
              </button>
            </div>
          )}

          {activeServer && !activeChannel && !loadingMsgs && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">{activeServer.icon}</div>
              <h3 className="text-white text-2xl font-bold mb-2">{activeServer.name}</h3>
              <p className="text-[#b9bbbe]">Выберите канал слева чтобы начать общение</p>
            </div>
          )}

          {activeChannel && messages.length === 0 && !loadingMsgs && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[#40444b] rounded-full flex items-center justify-center mb-4">
                <Icon name="Hash" size={32} className="text-[#8e9297]" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">#{activeChannel.name}</h3>
              <p className="text-[#b9bbbe]">Начало канала #{activeChannel.name}. Напишите первое сообщение!</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const grouped = prev && prev.user_id === msg.user_id;
            return (
              <div key={msg.id} className={`flex gap-4 group hover:bg-[#32353b] px-2 py-0.5 rounded ${!grouped ? "mt-4" : ""}`}>
                {!grouped ? (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: msg.avatar_color }}>
                    {msg.avatar}
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[#72767d] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{msg.time}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {!grouped && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-medium text-sm" style={{ color: msg.avatar_color }}>{msg.display_name}</span>
                      {msg.user_id === user.id && <span className="text-[#72767d] text-xs">(вы)</span>}
                      <span className="text-[#72767d] text-xs">{msg.time}</span>
                    </div>
                  )}
                  <p className="text-[#dcddde] text-sm leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        {activeChannel && (
          <div className="px-4 pb-6 pt-0 flex-shrink-0">
            <div className="bg-[#40444b] rounded-lg flex items-center gap-2 px-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Сообщение #${activeChannel.name}`}
                className="flex-1 bg-transparent text-[#dcddde] placeholder-[#72767d] text-sm py-3.5 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || sending}
                className={`transition-colors ${inputValue.trim() && !sending ? "text-[#5865f2] hover:text-[#4752c4]" : "text-[#4f545c]"}`}
              >
                <Icon name="Send" size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Корневой компонент ----
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("kiscord_token");
    if (!saved) { setChecking(false); return; }
    fetch(`${API.auth}/me`, { headers: { "X-Session-Token": saved } })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) { setUser(d.user); setToken(saved); }
        else localStorage.removeItem("kiscord_token");
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (u: User, t: string) => { setUser(u); setToken(t); };
  const handleLogout = () => {
    localStorage.removeItem("kiscord_token");
    setUser(null);
    setToken("");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-[#b9bbbe] text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;
  return <DiscordApp user={user} token={token} onLogout={handleLogout} />;
};

export default Index;