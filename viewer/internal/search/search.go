package search

import (
	"strings"
	"unicode/utf8"

	"teams-chat-viewer/internal/model"
)

const maxSnippetLen = 120

// Search performs case-insensitive substring matching across chat names,
// message bodies, and sender display names. It returns at most maxResults hits.
func Search(export *model.Export, query string, maxResults int) []model.SearchResult {
	if export == nil || query == "" {
		return nil
	}
	if maxResults <= 0 {
		maxResults = 200
	}

	q := strings.ToLower(query)
	results := make([]model.SearchResult, 0)

	for i := range export.Chats {
		chat := &export.Chats[i]

		for j := range chat.Messages {
			if len(results) >= maxResults {
				return results
			}

			msg := &chat.Messages[j]
			snippet, matched := matchMessage(msg, chat.Name, q)
			if !matched {
				continue
			}

			results = append(results, model.SearchResult{
				ChatID:          chat.ID,
				ChatName:        chat.Name,
				MessageID:       msg.ID,
				Snippet:         snippet,
				From:            msg.From.DisplayName,
				CreatedDateTime: msg.CreatedDateTime,
			})
		}
	}

	return results
}

func matchMessage(msg *model.Message, chatName, query string) (snippet string, matched bool) {
	// Prefer contentProcessed, fall back to content
	body := msg.Body.ContentProcessed
	if body == "" {
		body = msg.Body.Content
	}

	bodyLower := strings.ToLower(body)
	if idx := strings.Index(bodyLower, query); idx >= 0 {
		return extractSnippet(body, idx, len(query)), true
	}

	fromLower := strings.ToLower(msg.From.DisplayName)
	if strings.Contains(fromLower, query) {
		return extractSnippet(body, 0, 0), true
	}

	chatLower := strings.ToLower(chatName)
	if strings.Contains(chatLower, query) {
		return extractSnippet(body, 0, 0), true
	}

	return "", false
}

// extractSnippet returns a substring of body centered around pos (the match
// start index) with the match highlighted. If the body is short enough it is
// returned as-is.
func extractSnippet(body string, pos, matchLen int) string {
	plain := stripHTMLTags(body)
	plain = collapseWhitespace(plain)

	if utf8.RuneCountInString(plain) <= maxSnippetLen {
		return plain
	}

	runes := []rune(plain)

	// Re-locate the match position in the cleaned text
	posInPlain := 0
	if pos > 0 {
		// Approximate: the cleaned text is shorter, so scale pos down
		ratio := float64(len(plain)) / float64(max(len(body), 1))
		posInPlain = int(float64(pos) * ratio)
		if posInPlain >= len(runes) {
			posInPlain = len(runes) - 1
		}
	}

	half := maxSnippetLen / 2
	start := posInPlain - half
	if start < 0 {
		start = 0
	}
	end := start + maxSnippetLen
	if end > len(runes) {
		end = len(runes)
		start = end - maxSnippetLen
		if start < 0 {
			start = 0
		}
	}

	s := string(runes[start:end])
	if start > 0 {
		s = "…" + s
	}
	if end < len(runes) {
		s = s + "…"
	}
	return s
}

func stripHTMLTags(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	inTag := false
	for _, r := range s {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func collapseWhitespace(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	prevSpace := false
	for _, r := range s {
		if r == ' ' || r == '\t' || r == '\n' || r == '\r' {
			if !prevSpace {
				b.WriteByte(' ')
			}
			prevSpace = true
		} else {
			b.WriteRune(r)
			prevSpace = false
		}
	}
	return strings.TrimSpace(b.String())
}
