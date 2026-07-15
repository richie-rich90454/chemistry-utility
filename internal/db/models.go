package db
import (
	"time"
	"github.com/google/uuid"
)
type User struct {
	ID            uuid.UUID
	Email         string
	PasswordHash  string
	Name          string
	Role          string
	EmailVerified bool
	OAuthProvider string
	OAuthID       string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
type Calculation struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	CalculatorType string
	Inputs         string
	Result         string
	Annotation     string
	Starred        bool
	WorkspaceID    uuid.UUID
	CreatedAt      time.Time
}
type Workspace struct {
	ID          uuid.UUID
	Name        string
	Description string
	OwnerID     uuid.UUID
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
type WorkspaceMember struct {
	WorkspaceID uuid.UUID
	UserID      uuid.UUID
	Role        string
	JoinedAt    time.Time
}
type Compound struct {
	ID         uuid.UUID
	Name       string
	Formula    string
	CASNumber  string
	SMILES     string
	InChI      string
	MolarMass  float64
	Properties string
	Source     string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
type APIKey struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	Name       string
	KeyHash    string
	LastUsedAt time.Time
	CreatedAt  time.Time
}
type Plugin struct {
	ID        uuid.UUID
	Name      string
	Version   string
	Author    string
	Manifest  string
	Enabled   bool
	CreatedAt time.Time
}
type AnalyticsEvent struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	EventType string
	EventData string
	CreatedAt time.Time
}
