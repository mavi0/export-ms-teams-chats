import { useState, useEffect, useRef, useMemo } from "react";
import { GetMessages } from "../../wailsjs/go/main/App";
import { model } from "../../wailsjs/go/models";

interface MessageViewProps {
  chatId: string | null;
  chatName: string | null;
  highlightMessageId?: string | null;
  onHighlightComplete?: () => void;
}

export default function MessageView({ chatId, chatName, highlightMessageId, onHighlightComplete }: MessageViewProps) {
  const [messages, setMessages] = useState<model.Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    GetMessages(chatId).then((msgs) => {
      if (cancelled) return;
      setMessages(msgs ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    if (loading || !bodyRef.current) return;

    if (highlightMessageId) {
      requestAnimationFrame(() => {
        const el = bodyRef.current?.querySelector(`#msg-${CSS.escape(highlightMessageId)}`);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          setFlashId(highlightMessageId);
          setTimeout(() => {
            setFlashId(null);
            onHighlightComplete?.();
          }, 2000);
        } else {
          onHighlightComplete?.();
        }
      });
    } else {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading, highlightMessageId, onHighlightComplete]);

  const grouped = useMemo(() => groupByDate(messages), [messages]);

  if (!chatId) {
    return (
      <div className="message-view-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p>Select a chat to view messages</p>
      </div>
    );
  }

  return (
    <div className="message-view">
      <div className="message-view-header">
        <h2>{chatName || "Chat"}</h2>
        {messages.length > 0 && (
          <span className="message-count">{messages.length} messages</span>
        )}
      </div>
      <div className="message-view-body" ref={bodyRef}>
        {loading ? (
          <p className="message-view-placeholder">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="message-view-placeholder">No messages in this chat.</p>
        ) : (
          grouped.map(({ date, messages: dayMessages }) => (
            <div key={date} className="message-date-group">
              <div className="date-separator">
                <span>{date}</span>
              </div>
              {dayMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isFlashing={msg.id === flashId} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, isFlashing }: { message: model.Message; isFlashing?: boolean }) {
  const isSystem = isSystemMessage(message);
  const isDeleted = !!message.deletedDateTime;
  const flashClass = isFlashing ? " msg--highlight" : "";

  if (isSystem) {
    return (
      <div className={`msg msg-system${flashClass}`} id={`msg-${message.id}`}>
        <span className="msg-system-text">
          {getSystemText(message)}
        </span>
        <span className="msg-time">{formatTime(message.createdDateTime)}</span>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className={`msg${message.isFromMe ? " msg-mine" : ""}${flashClass}`} id={`msg-${message.id}`}>
        <div className="msg-header">
          <span className="msg-sender">{message.from?.displayName || "Unknown"}</span>
          <span className="msg-time">{formatTime(message.createdDateTime)}</span>
        </div>
        <div className="msg-body msg-deleted">This message was deleted.</div>
      </div>
    );
  }

  const bodyHtml = message.body?.contentProcessed || message.body?.content || "";
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const isEdited = !!message.lastEditedDateTime;

  return (
    <div className={`msg${message.isFromMe ? " msg-mine" : ""}${flashClass}`} id={`msg-${message.id}`}>
      <div className="msg-header">
        <span className="msg-sender">{message.from?.displayName || "Unknown"}</span>
        <span className="msg-time">
          {formatTime(message.createdDateTime)}
          {isEdited && <span className="msg-edited" title={`Edited ${formatTime(message.lastEditedDateTime!)}`}> (edited)</span>}
        </span>
      </div>
      <div
        className="msg-body"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {hasAttachments && (
        <div className="msg-attachments">
          {message.attachments.map((att, i) => (
            <div key={i} className="msg-attachment">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="attachment-name" title={att.name}>{att.name || "Attachment"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isSystemMessage(msg: model.Message): boolean {
  if (msg.systemEvent) return true;
  const t = msg.messageType?.toLowerCase() ?? "";
  return t.includes("event") || t.includes("system") || t === "unknownfuturemessagetype";
}

function getSystemText(msg: model.Message): string {
  if (msg.systemEvent?.description) return msg.systemEvent.description;
  const body = msg.body?.contentProcessed || msg.body?.content || "";
  return stripHtml(body) || msg.messageType || "System event";
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeading(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

interface DateGroup {
  date: string;
  messages: model.Message[];
}

function groupByDate(messages: model.Message[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let currentKey = "";

  for (const msg of messages) {
    const key = formatDateHeading(msg.createdDateTime);
    if (key !== currentKey) {
      groups.push({ date: key, messages: [msg] });
      currentKey = key;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}
