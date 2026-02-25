import React, { useCallback, useRef, useEffect } from "react";
import { model } from "../../wailsjs/go/models";

interface ChatListProps {
  chats: model.ChatSummary[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#84cc16", "#a855f7",
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
}

function getInitials(name: string, isGroup: boolean): string {
  if (!name) return isGroup ? "G" : "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const ChatItem = React.memo(function ChatItem({
  chat,
  isSelected,
  onSelect,
}: {
  chat: model.ChatSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const displayName = chat.name || "Unnamed Chat";
  const isGroup = chat.chatType === "group";
  const initials = getInitials(displayName, isGroup);
  const avatarColor = getAvatarColor(chat.id);

  return (
    <li
      className={`chat-item${isSelected ? " chat-item--selected" : ""}`}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      data-chat-id={chat.id}
    >
      <div
        className={`chat-avatar${isGroup ? " chat-avatar--group" : ""}`}
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {isGroup ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="chat-item-content">
        <div className="chat-item-header">
          <span className="chat-name" title={displayName}>
            {displayName}
          </span>
          {isGroup && chat.memberCount > 0 && (
            <span className="chat-member-count" title={`${chat.memberCount} members`}>
              {chat.memberCount}
            </span>
          )}
        </div>
        <span className="chat-date">
          {chat.lastMessageDate ? formatDate(chat.lastMessageDate) : "No messages"}
        </span>
      </div>
    </li>
  );
});

export default function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (chats.length === 0) return;

      const currentIndex = chats.findIndex((c) => c.id === selectedChatId);

      let nextIndex = -1;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = currentIndex < chats.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : chats.length - 1;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = chats.length - 1;
      }

      if (nextIndex >= 0) {
        onSelectChat(chats[nextIndex].id);
      }
    },
    [chats, selectedChatId, onSelectChat]
  );

  useEffect(() => {
    if (!selectedChatId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-chat-id="${CSS.escape(selectedChatId)}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedChatId]);

  if (chats.length === 0) {
    return (
      <div className="chat-list-empty">
        <p>No chats found.</p>
      </div>
    );
  }

  return (
    <ul
      className="chat-list"
      ref={listRef}
      role="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Chat list"
    >
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isSelected={selectedChatId === chat.id}
          onSelect={() => onSelectChat(chat.id)}
        />
      ))}
    </ul>
  );
}
