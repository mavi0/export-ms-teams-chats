package model

type Export struct {
	ExportedAt    string `json:"exportedAt"`
	ExportVersion string `json:"exportVersion"`
	User          User   `json:"user"`
	Chats         []Chat `json:"chats"`
}

type User struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
}

type Chat struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	ChatType string    `json:"chatType"`
	Members  []Member  `json:"members"`
	Messages []Message `json:"messages"`
}

type Member struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
}

type Message struct {
	ID                 string       `json:"id"`
	MessageType        string       `json:"messageType"`
	CreatedDateTime    string       `json:"createdDateTime"`
	From               From         `json:"from"`
	Importance         string       `json:"importance"`
	DeletedDateTime    *string      `json:"deletedDateTime"`
	LastEditedDateTime *string      `json:"lastEditedDateTime"`
	IsFromMe           bool         `json:"isFromMe"`
	Body               Body         `json:"body"`
	Attachments        []Attachment `json:"attachments"`
	SystemEvent        *SystemEvent `json:"systemEvent,omitempty"`
}

type From struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
}

type Body struct {
	ContentType      string `json:"contentType"`
	Content          string `json:"content"`
	ContentProcessed string `json:"contentProcessed,omitempty"`
}

type Attachment struct {
	Name        string `json:"name"`
	ContentURL  string `json:"contentUrl"`
	ContentType string `json:"contentType"`
}

type SystemEvent struct {
	Type        string `json:"@odata.type,omitempty"`
	Description string `json:"description,omitempty"`
}

// ChatSummary is the lightweight shape returned by GetChats for the sidebar.
type ChatSummary struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	LastMessageDate string `json:"lastMessageDate"`
	MemberCount     int    `json:"memberCount"`
	ChatType        string `json:"chatType"`
}

// SearchResult represents a single hit from a search query.
type SearchResult struct {
	ChatID          string `json:"chatId"`
	ChatName        string `json:"chatName"`
	MessageID       string `json:"messageId"`
	Snippet         string `json:"snippet"`
	From            string `json:"from"`
	CreatedDateTime string `json:"createdDateTime"`
}
