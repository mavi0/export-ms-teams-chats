package loader

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"teams-chat-viewer/internal/model"
)

type Store struct {
	export   *model.Export
	FilePath string
}

func New() *Store {
	return &Store{}
}

func (s *Store) LoadFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("could not read file: %w", err)
	}

	var export model.Export
	if err := json.Unmarshal(data, &export); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}

	if len(export.Chats) == 0 {
		return fmt.Errorf("no chats found in export file")
	}

	s.export = &export
	s.FilePath = path
	return nil
}

func (s *Store) IsLoaded() bool {
	return s.export != nil
}

func (s *Store) GetExport() *model.Export {
	return s.export
}

func (s *Store) GetChats() []model.ChatSummary {
	if s.export == nil {
		return []model.ChatSummary{}
	}

	summaries := make([]model.ChatSummary, 0, len(s.export.Chats))
	for _, chat := range s.export.Chats {
		lastDate := ""
		if len(chat.Messages) > 0 {
			lastDate = chat.Messages[len(chat.Messages)-1].CreatedDateTime
		}

		summaries = append(summaries, model.ChatSummary{
			ID:              chat.ID,
			Name:            chat.Name,
			LastMessageDate: lastDate,
			MemberCount:     len(chat.Members),
			ChatType:        chat.ChatType,
		})
	}

	sort.Slice(summaries, func(i, j int) bool {
		return summaries[i].LastMessageDate > summaries[j].LastMessageDate
	})

	return summaries
}

func (s *Store) GetMessages(chatID string) []model.Message {
	if s.export == nil {
		return []model.Message{}
	}
	for _, chat := range s.export.Chats {
		if chat.ID == chatID {
			if chat.Messages == nil {
				return []model.Message{}
			}
			return chat.Messages
		}
	}
	return []model.Message{}
}
