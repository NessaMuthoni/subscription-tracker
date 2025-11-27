package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	db *database.DB
}

func NewUserHandler(db *database.DB) *UserHandler {
	return &UserHandler{db: db}
}

func (h *UserHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var user models.User
	var preferencesJSON []byte
	err := h.db.QueryRow(
		"SELECT id, email, name, COALESCE(preferences, '{}'::jsonb), created_at FROM users WHERE id = $1",
		userID.(uuid.UUID),
	).Scan(&user.ID, &user.Email, &user.Name, &preferencesJSON, &user.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}

	// Parse preferences JSON
	if len(preferencesJSON) > 0 {
		var prefs models.UserPreferences
		if err := json.Unmarshal(preferencesJSON, &prefs); err == nil {
			user.Preferences = &prefs
		}
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argCount))
		args = append(args, *req.Name)
		argCount++
	}

	if req.Email != nil {
		updates = append(updates, fmt.Sprintf("email = $%d", argCount))
		args = append(args, *req.Email)
		argCount++
	}

	if req.Preferences != nil {
		preferencesJSON, err := json.Marshal(req.Preferences)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid preferences format"})
			return
		}
		updates = append(updates, fmt.Sprintf("preferences = $%d", argCount))
		args = append(args, preferencesJSON)
		argCount++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "No fields to update"})
		return
	}

	args = append(args, userID.(uuid.UUID))
	query := "UPDATE users SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += fmt.Sprintf(" WHERE id = $%d", argCount)

	_, err := h.db.Exec(query, args...)
	if err != nil {
		fmt.Printf("Failed to update user: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to update user"})
		return
	}

	// Return updated user with preferences
	var user models.User
	var preferencesJSON []byte
	err = h.db.QueryRow(
		"SELECT id, email, name, COALESCE(preferences, '{}'::jsonb), created_at FROM users WHERE id = $1",
		userID.(uuid.UUID),
	).Scan(&user.ID, &user.Email, &user.Name, &preferencesJSON, &user.CreatedAt)

	if err != nil {
		fmt.Printf("Failed to retrieve updated user: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to retrieve updated user"})
		return
	}

	// Parse preferences JSON
	if len(preferencesJSON) > 0 {
		var prefs models.UserPreferences
		if err := json.Unmarshal(preferencesJSON, &prefs); err == nil {
			user.Preferences = &prefs
		}
	}

	c.JSON(http.StatusOK, user)
}