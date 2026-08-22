package db

import (
	"time"

	"github.com/google/uuid"
)

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
type Plugin struct {
	ID        uuid.UUID
	Name      string
	Version   string
	Author    string
	Manifest  string
	Enabled   bool
	CreatedAt time.Time
}
