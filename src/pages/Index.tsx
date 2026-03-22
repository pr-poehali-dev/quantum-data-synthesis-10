import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const SERVERS = [
  { id: "1", name: "Discord", icon: "💬", color: "#5865f2" },
  { id: "2", name: "Геймеры", icon: "🎮", color: "#3ba55c" },
  { id: "3", name: "Музыка", icon: "🎵", color: "#faa61a" },
  { id: "4", name: "Арт", icon: "🎨", color: "#ed4245" },
  { id: "5", name: "Код", icon: "💻", color: "#5865f2" },
];

const CHANNELS: Record<string, { text: { id: string; name: string }[]; voice: { id: string; name: string }[] }> = {
  "1": {
    text: [
      { id: "general", name: "основной" },
      { id: "random", name: "случайный" },
      { id: "memes", name: "мемы" },
      { id: "news", name: "новости" },
      { id: "help", name: "помощь" },
    ],
    voice: [
      { id: "v1", name: "Общий" },
      { id: "v2", name: "Игры" },
      { id: "v3", name: "AFK" },
    ],
  },
  "2": {
    text: [
      { id: "games-chat", name: "игровой-чат" },
      { id: "lfg", name: "поиск-команды" },
      { id: "reviews", name: "обзоры" },
    ],
    voice: [
      { id: "gv1", name: "Squad 1" },
      { id: "gv2", name: "Squad 2" },
    ],
  },
  "3": {
    text: [
      { id: "music-chat", name: "музыкальный" },
      { id: "recommendations", name: "рекомендации" },
    ],
    voice: [{ id: "mv1", name: "Слушаем вместе" }],
  },
  "4": {
    text: [
      { id: "art-showcase", name: "витрина" },
      { id: "feedback", name: "критика" },
      { id: "wip", name: "в-процессе" },
    ],
    voice: [{ id: "av1", name: "Рисуем вместе" }],
  },
  "5": {
    text: [
      { id: "code-help", name: "помощь-с-кодом" },
      { id: "projects", name: "проекты" },
      { id: "jobs", name: "вакансии" },
    ],
    voice: [{ id: "cv1", name: "Код-ревью" }],
  },
};

interface Message {
  id: number;
  author: string;
  avatar: string;
  color: string;
  content: string;
  time: string;
  isBot?: boolean;
  reactions?: { emoji: string; count: number; reacted: boolean }[];
}

const INITIAL_MESSAGES: Record<string, Message[]> = {
  general: [
    {
      id: 1,
      author: "Система",
      avatar: "🤖",
      color: "#5865f2",
      content: "Добро пожаловать в **#основной**! Это начало канала.",
      time: "01.01.2024",
      isBot: true,
    },
    {
      id: 2,
      author: "Алекс",
      avatar: "А",
      color: "#5865f2",
      content: "Всем привет! Как дела? 😄",
      time: "10:02",
      reactions: [{ emoji: "👋", count: 3, reacted: false }],
    },
    {
      id: 3,
      author: "Маша",
      avatar: "М",
      color: "#ed4245",
      content: "Привет! Всё отлично, спасибо! А у тебя? 🙂",
      time: "10:04",
      reactions: [{ emoji: "❤️", count: 2, reacted: false }],
    },
    {
      id: 4,
      author: "Вася",
      avatar: "В",
      color: "#3ba55c",
      content: "Смотрите что нашёл — это невероятно крутой проект! 🔥",
      time: "10:07",
    },
    {
      id: 5,
      author: "Катя",
      avatar: "К",
      color: "#faa61a",
      content: "Вась, ты всегда что-то интересное находишь 😂",
      time: "10:09",
      reactions: [
        { emoji: "😂", count: 5, reacted: false },
        { emoji: "👍", count: 2, reacted: false },
      ],
    },
  ],
  random: [
    {
      id: 1,
      author: "Рома",
      avatar: "Р",
      color: "#9b59b6",
      content: "Кто хочет в войс сегодня вечером?",
      time: "09:30",
      reactions: [{ emoji: "✋", count: 4, reacted: false }],
    },
    {
      id: 2,
      author: "Лена",
      avatar: "Л",
      color: "#e74c3c",
      content: "Я! Во сколько? 🎉",
      time: "09:32",
    },
    {
      id: 3,
      author: "Дима",
      avatar: "Д",
      color: "#1abc9c",
      content: "Давайте в 19:00? Всем удобно?",
      time: "09:35",
      reactions: [
        { emoji: "👍", count: 6, reacted: false },
        { emoji: "❤️", count: 1, reacted: false },
      ],
    },
  ],
  memes: [
    {
      id: 1,
      author: "МемЛорд",
      avatar: "😎",
      color: "#f39c12",
      content: "Новый мем дня! (представьте тут что-то очень смешное) 💀",
      time: "08:00",
      reactions: [
        { emoji: "💀", count: 15, reacted: false },
        { emoji: "😂", count: 12, reacted: false },
        { emoji: "🔥", count: 8, reacted: false },
      ],
    },
    {
      id: 2,
      author: "Вася",
      avatar: "В",
      color: "#3ba55c",
      content: "ХАХАХА это топ 💀💀💀",
      time: "08:15",
    },
  ],
};

const MEMBERS = [
  { id: "1", name: "Алекс", avatar: "А", color: "#5865f2", status: "online", activity: "Играет в Minecraft" },
  { id: "2", name: "Маша", avatar: "М", color: "#ed4245", status: "online", activity: "" },
  { id: "3", name: "Вася", avatar: "В", color: "#3ba55c", status: "idle", activity: "" },
  { id: "4", name: "Катя", avatar: "К", color: "#faa61a", status: "online", activity: "Слушает Spotify" },
  { id: "5", name: "Рома", avatar: "Р", color: "#9b59b6", status: "dnd", activity: "Не беспокоить" },
  { id: "6", name: "Лена", avatar: "Л", color: "#e74c3c", status: "offline", activity: "" },
  { id: "7", name: "Дима", avatar: "Д", color: "#1abc9c", status: "offline", activity: "" },
];

const EMOJI_LIST = ["😀", "😂", "❤️", "🔥", "👍", "👎", "😮", "😢", "🎉", "💀", "✨", "🙏", "🤔", "😎", "🥰", "💯"];

const statusColor: Record<string, string> = {
  online: "#3ba55c",
  idle: "#faa61a",
  dnd: "#ed4245",
  offline: "#747f8d",
};

const statusLabel: Record<string, string> = {
  online: "В сети",
  idle: "Отошёл",
  dnd: "Не беспокоить",
  offline: "Не в сети",
};

function formatTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

function renderContent(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

const ME = { name: "Вы", avatar: "Я", color: "#5865f2" };

const Index = () => {
  const [activeServer, setActiveServer] = useState("1");
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channels = CHANNELS[activeServer] || CHANNELS["1"];
  const currentMessages = messages[activeChannel] || [];
  const server = SERVERS.find((s) => s.id === activeServer)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel, messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      author: ME.name,
      avatar: ME.avatar,
      color: ME.color,
      content: inputValue.trim(),
      time: formatTime(),
    };
    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }));
    setInputValue("");
    setShowEmoji(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = (channelId: string, msgId: number, emoji: string) => {
    setMessages((prev) => {
      const channelMsgs = prev[channelId] || [];
      return {
        ...prev,
        [channelId]: channelMsgs.map((msg) => {
          if (msg.id !== msgId) return msg;
          const existing = msg.reactions?.find((r) => r.emoji === emoji);
          if (existing) {
            return {
              ...msg,
              reactions: msg.reactions?.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
                  : r
              ),
            };
          }
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1, reacted: true }],
          };
        }),
      };
    });
  };

  const switchChannel = (id: string) => {
    setActiveChannel(id);
    setMobileSidebarOpen(false);
    if (!messages[id]) {
      setMessages((prev) => ({ ...prev, [id]: [] }));
    }
  };

  const switchServer = (id: string) => {
    setActiveServer(id);
    const ch = CHANNELS[id]?.text[0]?.id || "general";
    setActiveChannel(ch);
    if (!messages[ch]) {
      setMessages((prev) => ({ ...prev, [ch]: [] }));
    }
  };

  const onlineMembers = MEMBERS.filter((m) => m.status !== "offline");
  const offlineMembers = MEMBERS.filter((m) => m.status === "offline");
  const channelName = channels.text.find((c) => c.id === activeChannel)?.name || activeChannel;

  return (
    <div className="h-screen flex bg-[#36393f] text-white overflow-hidden select-none">
      {/* Боковая панель серверов */}
      <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        {/* Discord иконка */}
        <div className="w-12 h-12 bg-[#5865f2] rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer mb-1">
          <span className="text-2xl">💬</span>
        </div>
        <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>

        {SERVERS.map((s) => (
          <div key={s.id} className="relative flex items-center group" onClick={() => switchServer(s.id)}>
            {activeServer === s.id && (
              <div className="absolute -left-3 w-1 h-10 bg-white rounded-r-full"></div>
            )}
            <div
              className={`w-12 h-12 flex items-center justify-center cursor-pointer text-xl transition-all duration-200 ${
                activeServer === s.id ? "rounded-xl" : "rounded-3xl hover:rounded-xl"
              }`}
              style={{ backgroundColor: activeServer === s.id ? s.color : "#36393f" }}
              title={s.name}
            >
              {s.icon}
            </div>
          </div>
        ))}

        <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>
        <div className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl hover:bg-[#3ba55c] transition-all duration-200 flex items-center justify-center cursor-pointer text-[#3ba55c] hover:text-white text-xl">
          +
        </div>

        {/* Аватар пользователя снизу */}
        <div className="mt-auto relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: ME.color }}>
            {ME.avatar}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#3ba55c] border-2 border-[#202225] rounded-full"></div>
        </div>
      </div>

      {/* Боковая панель каналов */}
      <div
        className={`${mobileSidebarOpen ? "flex" : "hidden"} md:flex w-60 bg-[#2f3136] flex-col flex-shrink-0 z-30`}
      >
        {/* Заголовок сервера */}
        <div className="h-12 px-4 flex items-center border-b border-[#202225] cursor-pointer hover:bg-[#3c3f45] transition-colors">
          <h2 className="text-white font-bold text-base flex-1 truncate">{server.name}</h2>
          <Icon name="ChevronDown" size={18} className="text-[#8e9297]" />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Текстовые каналы */}
          <div className="mb-2">
            <div className="flex items-center gap-1 px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide hover:text-[#dcddde] cursor-pointer">
              <Icon name="ChevronDown" size={12} />
              <span>Текстовые каналы</span>
            </div>
            <div className="space-y-0.5">
              {channels.text.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => switchChannel(ch.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group ${
                    activeChannel === ch.id
                      ? "bg-[#393c43] text-white"
                      : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]"
                  }`}
                >
                  <Icon name="Hash" size={16} />
                  <span className="text-sm flex-1">{ch.name}</span>
                  {activeChannel === ch.id && (
                    <Icon name="Settings" size={14} className="opacity-0 group-hover:opacity-100 text-[#8e9297]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Голосовые каналы */}
          <div>
            <div className="flex items-center gap-1 px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide hover:text-[#dcddde] cursor-pointer">
              <Icon name="ChevronDown" size={12} />
              <span>Голосовые каналы</span>
            </div>
            <div className="space-y-0.5">
              {channels.voice.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]"
                >
                  <Icon name="Volume2" size={16} />
                  <span className="text-sm">{ch.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Панель пользователя */}
        <div className="h-14 bg-[#292b2f] flex items-center px-2 gap-2">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: ME.color }}>
              {ME.avatar}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#292b2f] rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{ME.name}</div>
            <div className="text-[#b9bbbe] text-xs truncate">В сети</div>
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
            <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#40444b] text-[#b9bbbe] transition-colors">
              <Icon name="Settings" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Заголовок канала */}
        <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-3 flex-shrink-0 z-10">
          <button
            className="md:hidden text-[#8e9297] hover:text-white mr-1"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <Icon name="Menu" size={22} />
          </button>
          <Icon name="Hash" size={20} className="text-[#8e9297] flex-shrink-0" />
          <span className="text-white font-bold text-base">{channelName}</span>
          <div className="w-px h-6 bg-[#40444b] mx-1 hidden sm:block"></div>
          <span className="text-[#8e9297] text-sm hidden sm:block truncate">Добро пожаловать в #{channelName}!</span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setMembersOpen(!membersOpen)}
              className={`transition-colors ${membersOpen ? "text-white" : "text-[#b9bbbe] hover:text-white"}`}
            >
              <Icon name="Users" size={20} />
            </button>
            <button className="text-[#b9bbbe] hover:text-white transition-colors">
              <Icon name="Bell" size={20} />
            </button>
            <button className="text-[#b9bbbe] hover:text-white transition-colors">
              <Icon name="Search" size={20} />
            </button>
            <button className="text-[#b9bbbe] hover:text-white transition-colors hidden sm:block">
              <Icon name="HelpCircle" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Область сообщений */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {currentMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-[#40444b] rounded-full flex items-center justify-center mb-4">
                    <Icon name="Hash" size={32} className="text-[#8e9297]" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">Добро пожаловать в #{channelName}!</h3>
                  <p className="text-[#b9bbbe] text-base">Это начало канала #{channelName}. Напишите первое сообщение!</p>
                </div>
              )}

              {currentMessages.map((msg, idx) => {
                const prevMsg = currentMessages[idx - 1];
                const grouped = prevMsg && prevMsg.author === msg.author && !msg.isBot;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 group hover:bg-[#32353b] px-2 py-0.5 rounded relative ${!grouped ? "mt-4" : ""}`}
                  >
                    {/* Аватар */}
                    {!grouped ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: msg.isBot ? "#5865f2" : msg.color }}
                      >
                        {msg.avatar}
                      </div>
                    ) : (
                      <div className="w-10 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[#72767d] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.time}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {!grouped && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span
                            className="font-medium text-sm hover:underline cursor-pointer"
                            style={{ color: msg.isBot ? "#5865f2" : msg.color }}
                          >
                            {msg.author}
                          </span>
                          {msg.isBot && (
                            <span className="bg-[#5865f2] text-white text-[10px] px-1 py-0 rounded font-bold">БОТ</span>
                          )}
                          <span className="text-[#72767d] text-xs">{msg.time}</span>
                        </div>
                      )}
                      <p
                        className="text-[#dcddde] text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                      />
                      {/* Реакции */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {msg.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => addReaction(activeChannel, msg.id, r.emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors ${
                                r.reacted
                                  ? "bg-[#5865f2]/20 border-[#5865f2] text-[#5865f2]"
                                  : "bg-[#2f3136] border-[#40444b] text-[#dcddde] hover:bg-[#3c3f45]"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Панель действий при наведении */}
                    <div className="absolute right-2 top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex bg-[#2f3136] border border-[#202225] rounded shadow-lg">
                      {["😀", "👍", "❤️"].map((e) => (
                        <button
                          key={e}
                          onClick={() => addReaction(activeChannel, msg.id, e)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#40444b] text-sm rounded transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Поле ввода */}
            <div className="px-4 pb-6 pt-0 flex-shrink-0">
              <div className="bg-[#40444b] rounded-lg flex items-center gap-2 px-4 relative">
                <button className="text-[#b9bbbe] hover:text-[#dcddde] py-3 transition-colors">
                  <Icon name="Plus" size={20} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Сообщение #${channelName}`}
                  className="flex-1 bg-transparent text-[#dcddde] placeholder-[#72767d] text-sm py-3 outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="text-[#b9bbbe] hover:text-[#dcddde] transition-colors"
                  >
                    <Icon name="Smile" size={20} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    className={`transition-colors ${inputValue.trim() ? "text-[#5865f2] hover:text-[#4752c4]" : "text-[#4f545c]"}`}
                  >
                    <Icon name="Send" size={20} />
                  </button>
                </div>

                {/* Эмодзи пикер */}
                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#2f3136] border border-[#202225] rounded-lg p-3 shadow-xl z-50">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_LIST.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setInputValue((v) => v + e);
                            inputRef.current?.focus();
                          }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#40444b] rounded text-lg transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Панель участников */}
          {membersOpen && (
            <div className="hidden lg:flex w-60 bg-[#2f3136] flex-col flex-shrink-0 overflow-y-auto p-4">
              {/* Онлайн */}
              <div className="mb-4">
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">
                  В сети — {onlineMembers.length}
                </div>
                <div className="space-y-0.5">
                  {onlineMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#36393f] cursor-pointer group">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.avatar}
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#2f3136] rounded-full"
                          style={{ backgroundColor: statusColor[m.status] }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#dcddde] group-hover:text-white text-sm font-medium truncate">{m.name}</div>
                        {m.activity && (
                          <div className="text-[#b9bbbe] text-xs truncate">{m.activity}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Оффлайн */}
              <div>
                <div className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">
                  Не в сети — {offlineMembers.length}
                </div>
                <div className="space-y-0.5">
                  {offlineMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#36393f] cursor-pointer group">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold opacity-40"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.avatar}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#747f8d] border-2 border-[#2f3136] rounded-full" />
                      </div>
                      <div className="text-[#72767d] group-hover:text-[#dcddde] text-sm truncate">{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
