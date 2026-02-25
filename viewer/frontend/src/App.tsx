import { useState, useCallback, useEffect } from "react";
import { OpenFileDialog, GetChats } from "../wailsjs/go/main/App";
import { model } from "../wailsjs/go/models";
import SearchBar, { SearchHit } from "./components/SearchBar";
import ChatList from "./components/ChatList";
import MessageView from "./components/MessageView";
import "./App.css";

function App() {
  const [chats, setChats] = useState<model.ChatSummary[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 8000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleOpenFile = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const result = await OpenFileDialog();
      if (result.error) {
        setError(result.error);
        return;
      }
      const chatList = await GetChats();
      if (chatList && chatList.length > 0) {
        setChats(chatList);
        setLoaded(true);
        setSelectedChatId(null);
        setSearchQuery("");
        setHighlightMessageId(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to open file");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setHighlightMessageId(null);
  }, []);

  const handleSelectSearchResult = useCallback((hit: SearchHit) => {
    setSelectedChatId(hit.chatId);
    setHighlightMessageId(hit.messageId);
  }, []);

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  if (!loaded) {
    return (
      <div id="App">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1>Teams Chat Viewer</h1>
          <p>Open a Microsoft Teams export JSON file to browse your chats and messages.</p>
          <button className="btn btn-primary" onClick={handleOpenFile} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Opening…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Open Export File
              </>
            )}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div id="App">
      <header className="top-bar">
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelectResult={handleSelectSearchResult}
          disabled={!loaded}
        />
        <div className="top-bar-actions">
          <button
            className="btn btn-sm"
            onClick={handleOpenFile}
            disabled={loading}
            title="Open another file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Open
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Chats</h2>
            <span className="sidebar-count">{chats.length}</span>
          </div>
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
          />
        </aside>

        <main className="main-area">
          <MessageView
            chatId={selectedChatId}
            chatName={selectedChat?.name ?? null}
            highlightMessageId={highlightMessageId}
            onHighlightComplete={() => setHighlightMessageId(null)}
          />
        </main>
      </div>

      {error && (
        <div className="toast-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}

export default App;
