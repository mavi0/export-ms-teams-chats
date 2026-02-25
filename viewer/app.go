package main

import (
	"context"
	"path/filepath"

	"teams-chat-viewer/internal/loader"
	"teams-chat-viewer/internal/model"
	"teams-chat-viewer/internal/search"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx   context.Context
	store *loader.Store
}

func NewApp() *App {
	return &App{
		store: loader.New(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type LoadResult struct {
	Error string `json:"error,omitempty"`
}

func (a *App) LoadFile(filePath string) LoadResult {
	if err := a.store.LoadFile(filePath); err != nil {
		return LoadResult{Error: err.Error()}
	}
	name := filepath.Base(a.store.FilePath)
	wailsRuntime.WindowSetTitle(a.ctx, "Teams Chat Viewer – "+name)
	return LoadResult{}
}

func (a *App) OpenFileDialog() LoadResult {
	path, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Open Teams Export JSON",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return LoadResult{Error: err.Error()}
	}
	if path == "" {
		return LoadResult{}
	}
	return a.LoadFile(path)
}

func (a *App) GetChats() []model.ChatSummary {
	return a.store.GetChats()
}

func (a *App) GetMessages(chatID string) []model.Message {
	return a.store.GetMessages(chatID)
}

func (a *App) Search(query string) []model.SearchResult {
	return search.Search(a.store.GetExport(), query, 200)
}
