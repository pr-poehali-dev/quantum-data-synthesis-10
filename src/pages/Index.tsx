import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = {
  auth: "https://functions.poehali.dev/80c8a01f-6b37-4959-81a3-5f64efa52c96",
  servers: "https://functions.poehali.dev/0255463e-3f83-4cb8-8525-ea681ace3083",
  channels: "https://functions.poehali.dev/4e8bfbb0-213c-419e-a835-197d62939f9e",
  messages: "https://functions.poehali.dev/02771259-ef74-4425-bb72-322f5b54e75d",
};

function authHeaders(token: string) {
  return { "Content-Type": "application/json", "X-Session-Token": token };
}

interface User {
  id: number;
  username: string;
  display_name: string;
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

// ---- Экран входа ----
function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim().toLowerCase(), display_name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      localStorage.setItem("discord_token", data.token);
      onLogin(data.user, data.token);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#2f3136] rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#5865f2] rounded-2xl flex items-center justify-center mb-4 text-3xl">
            💬
          </div>
          <h1 className="text-white text-2xl font-bold">Добро пожаловать!</h1>
          <p className="text-[#b9bbbe] text-sm mt-1">Введите ваше имя чтобы войти</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">
              Имя пользователя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя..."
              maxLength={32}
              className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
              autoFocus
            />
          </div>
          {error && <p className="text-[#ed4245] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded transition-colors"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
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
  const token = localStorage.getItem("discord_token") || "";

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

// ---- Основной интерфейс ----
function DiscordApp({ user, token, onLogout }: { user: User; token: string; onLogout: () => void }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
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

  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  return (
    <div className="h-screen flex bg-[#36393f] text-white overflow-hidden select-none">
      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} onCreate={onServerCreated} />}

      {/* Серверная панель */}
      <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <div className="w-12 h-12 bg-[#5865f2] rounded-2xl flex items-center justify-center text-2xl">💬</div>
        <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>

        {servers.map((s) => (
          <div key={s.id} className="relative flex items-center group" onClick={() => switchServer(s)}>
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

        <div className="mt-auto relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer" style={{ backgroundColor: user.avatar_color }}>
            {user.display_name[0]?.toUpperCase()}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#3ba55c] border-2 border-[#202225] rounded-full" />
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
              <div className="flex items-center gap-1 px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
                <Icon name="ChevronDown" size={12} />
                <span>Текстовые каналы</span>
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
            <button onClick={onLogout} title="Выйти" className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#40444b] text-[#b9bbbe] hover:text-[#ed4245] transition-colors">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Область чата */}
      <div className="flex-1 flex flex-col min-w-0">
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
    const saved = localStorage.getItem("discord_token");
    if (!saved) { setChecking(false); return; }
    fetch(`${API.auth}/me`, { headers: { "X-Session-Token": saved } })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) { setUser(d.user); setToken(saved); }
        else localStorage.removeItem("discord_token");
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (u: User, t: string) => { setUser(u); setToken(t); };
  const handleLogout = () => {
    localStorage.removeItem("discord_token");
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
