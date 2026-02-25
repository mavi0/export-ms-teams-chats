import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search } from "../../wailsjs/go/main/App";
import { model } from "../../wailsjs/go/models";

export interface SearchHit {
  chatId: string;
  chatName: string;
  messageId: string;
  snippet: string;
  from: string;
  createdDateTime: string;
}

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelectResult: (hit: SearchHit) => void;
  disabled?: boolean;
}

function formatResultDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function SearchBar({ query, onQueryChange, onSelectResult, disabled }: SearchBarProps) {
  const [results, setResults] = useState<model.SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const hits = await Search(query.trim());
        setResults(hits ?? []);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = useCallback(
    (result: model.SearchResult) => {
      onSelectResult({
        chatId: result.chatId,
        chatName: result.chatName,
        messageId: result.messageId,
        snippet: result.snippet,
        from: result.from,
        createdDateTime: result.createdDateTime,
      });
      setShowDropdown(false);
      inputRef.current?.blur();
    },
    [onSelectResult]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [showDropdown, results, activeIndex, handleSelect]
  );

  const handleClear = useCallback(() => {
    onQueryChange("");
    setShowDropdown(false);
    setResults([]);
    inputRef.current?.focus();
  }, [onQueryChange]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="search-bar" ref={containerRef}>
      <svg
        className="search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Search chats and messages…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => { if (hasQuery && results.length > 0) setShowDropdown(true); }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {searching && <span className="search-spinner" />}
      {hasQuery && !searching && (
        <button
          className="search-clear"
          onClick={handleClear}
          title="Clear search"
        >
          ×
        </button>
      )}

      {showDropdown && hasQuery && (
        <div className="search-dropdown">
          {results.length === 0 && !searching ? (
            <div className="search-no-results">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>No results for "{query.trim()}"</span>
            </div>
          ) : (
            <>
              <div className="search-result-count">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
              <ul className="search-results" ref={listRef} role="listbox">
                {results.map((r, i) => (
                  <li
                    key={`${r.chatId}-${r.messageId}`}
                    className={`search-result-item${i === activeIndex ? " search-result-item--active" : ""}`}
                    onClick={() => handleSelect(r)}
                    role="option"
                    aria-selected={i === activeIndex}
                  >
                    <div className="search-result-header">
                      <span className="search-result-chat" title={r.chatName}>
                        {r.chatName || "Unnamed Chat"}
                      </span>
                      <span className="search-result-date">
                        {formatResultDate(r.createdDateTime)}
                      </span>
                    </div>
                    <div className="search-result-meta">
                      <span className="search-result-from">{r.from || "Unknown"}</span>
                    </div>
                    {r.snippet && (
                      <div className="search-result-snippet" title={r.snippet}>
                        {r.snippet}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
