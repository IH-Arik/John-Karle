
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.3",
    "info": {
      "title": "John Karle API",
      "version": "1.0.0",
      "description": "RESTful API for the John Karle platform — authentication, user management, and memory vault.",
      "contact": {
        "name": "API Support"
      }
    },
    "servers": [
      {
        "url": "http://localhost:5000",
        "description": "Local development server"
      }
    ],
    "components": {
      "securitySchemes": {
        "BearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT",
          "description": "JWT access token obtained from /api/v1/auth/login or /api/v1/auth/register"
        }
      },
      "schemas": {
        "SuccessResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "data": {
              "type": "object"
            }
          }
        },
        "ErrorResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": false
            },
            "error": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string",
                  "example": "VALIDATION_ERROR"
                },
                "message": {
                  "type": "string",
                  "example": "Request validation failed."
                },
                "details": {
                  "type": "object",
                  "nullable": true,
                  "description": "Additional error context (Zod issues, key values, etc.)"
                }
              }
            }
          }
        },
        "AuthTokens": {
          "type": "object",
          "properties": {
            "accessToken": {
              "type": "string"
            },
            "refreshToken": {
              "type": "string"
            },
            "tokenType": {
              "type": "string",
              "example": "Bearer"
            },
            "expiresIn": {
              "type": "string",
              "example": "15m"
            }
          }
        },
        "AuthResponse": {
          "type": "object",
          "properties": {
            "user": {
              "$ref": "#/components/schemas/PublicUser"
            },
            "tokens": {
              "$ref": "#/components/schemas/AuthTokens"
            }
          }
        },
        "UserProfilePicture": {
          "type": "object",
          "properties": {
            "key": {
              "type": "string"
            },
            "url": {
              "type": "string",
              "format": "uri"
            },
            "originalName": {
              "type": "string"
            },
            "mimeType": {
              "type": "string"
            },
            "size": {
              "type": "number"
            }
          }
        },
        "FamilyMember": {
          "type": "object",
          "properties": {
            "userId": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "relation": {
              "type": "string",
              "example": "brother"
            },
            "role": {
              "type": "string",
              "enum": [
                "viewer",
                "editor",
                "owner"
              ]
            },
            "status": {
              "type": "string",
              "enum": [
                "pending",
                "accepted"
              ]
            }
          }
        },
        "UserPreferences": {
          "type": "object",
          "properties": {
            "notifications": {
              "type": "boolean"
            },
            "aiInsight": {
              "type": "boolean"
            },
            "darkMode": {
              "type": "boolean"
            },
            "anonymousAnalytics": {
              "type": "boolean"
            }
          }
        },
        "PublicUser": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "phoneNumber": {
              "type": "string"
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "role": {
              "type": "string",
              "enum": [
                "user",
                "admin",
                "super_admin"
              ]
            },
            "isEmailVerified": {
              "type": "boolean"
            },
            "address": {
              "type": "string"
            },
            "profilePicture": {
              "$ref": "#/components/schemas/UserProfilePicture"
            },
            "familyMembers": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/FamilyMember"
              }
            },
            "preferences": {
              "$ref": "#/components/schemas/UserPreferences"
            },
            "legacyAccessEnabled": {
              "type": "boolean"
            },
            "lastActiveAt": {
              "type": "string",
              "format": "date-time"
            },
            "lastLoginAt": {
              "type": "string",
              "format": "date-time"
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "TrustedContactAccessScope": {
          "type": "object",
          "properties": {
            "profile": {
              "type": "boolean"
            },
            "documents": {
              "type": "boolean"
            },
            "notes": {
              "type": "boolean"
            },
            "messages": {
              "type": "boolean"
            },
            "paymentInfo": {
              "type": "boolean"
            },
            "accountTransfer": {
              "type": "boolean"
            }
          }
        },
        "TrustedContact": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "phone": {
              "type": "string"
            },
            "status": {
              "type": "string",
              "enum": [
                "pending",
                "accepted",
                "declined",
                "removed"
              ]
            },
            "inactivityDays": {
              "type": "integer"
            },
            "accessScope": {
              "$ref": "#/components/schemas/TrustedContactAccessScope"
            },
            "acceptedAt": {
              "type": "string",
              "format": "date-time"
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "LegacyAccessRequest": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "userId": {
              "type": "string"
            },
            "trustedContactId": {
              "type": "string"
            },
            "trustedContact": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "email": {
                  "type": "string",
                  "format": "email"
                },
                "status": {
                  "type": "string",
                  "enum": [
                    "pending",
                    "accepted",
                    "declined",
                    "removed"
                  ]
                },
                "accessScope": {
                  "$ref": "#/components/schemas/TrustedContactAccessScope"
                }
              }
            },
            "status": {
              "type": "string",
              "enum": [
                "waiting_period",
                "approved",
                "cancelled",
                "expired"
              ]
            },
            "triggeredAt": {
              "type": "string",
              "format": "date-time"
            },
            "unlockAt": {
              "type": "string",
              "format": "date-time"
            },
            "expiresAt": {
              "type": "string",
              "format": "date-time"
            },
            "cancelledAt": {
              "type": "string",
              "format": "date-time"
            },
            "approvedAt": {
              "type": "string",
              "format": "date-time"
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "MemoryVaultFile": {
          "type": "object",
          "properties": {
            "key": {
              "type": "string"
            },
            "url": {
              "type": "string",
              "format": "uri"
            },
            "originalName": {
              "type": "string"
            },
            "mimeType": {
              "type": "string"
            },
            "size": {
              "type": "number"
            }
          }
        },
        "PublicMemoryVaultItem": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "type": {
              "type": "string",
              "enum": [
                "photo",
                "video",
                "journal",
                "voice"
              ]
            },
            "whoseMemoryIsThis": {
              "type": "string"
            },
            "files": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/MemoryVaultFile"
              }
            },
            "title": {
              "type": "string"
            },
            "narrative": {
              "type": "string"
            },
            "date": {
              "type": "string",
              "format": "date-time"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "updatedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "MemoryTimelineGroup": {
          "type": "object",
          "properties": {
            "date": {
              "type": "string",
              "example": "2025-01-15"
            },
            "memories": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/PublicMemoryVaultItem"
              }
            }
          }
        }
      }
    },
    "paths": {
      "/api/v1/auth/register": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Register a new user account",
          "description": "Creates a new user and returns authentication tokens.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "name",
                    "email",
                    "password"
                  ],
                  "properties": {
                    "name": {
                      "type": "string",
                      "minLength": 2,
                      "maxLength": 80,
                      "example": "John Doe"
                    },
                    "email": {
                      "type": "string",
                      "format": "email",
                      "maxLength": 254,
                      "example": "john@example.com"
                    },
                    "password": {
                      "type": "string",
                      "minLength": 8,
                      "maxLength": 128,
                      "description": "Must include lowercase, uppercase, and a number.",
                      "example": "SecurePass1"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Account created successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/AuthResponse"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Validation error",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "409": {
              "description": "Email already exists",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/login": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Log in with email and password",
          "description": "Authenticates a user and returns JWT tokens.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "email",
                    "password"
                  ],
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "john@example.com"
                    },
                    "password": {
                      "type": "string",
                      "minLength": 1,
                      "example": "SecurePass1"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Login successful",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/AuthResponse"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Invalid credentials",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "403": {
              "description": "Invitation pending",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/refresh": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Refresh authentication tokens",
          "description": "Exchanges a valid refresh token for new access and refresh tokens.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "refreshToken"
                  ],
                  "properties": {
                    "refreshToken": {
                      "type": "string",
                      "minLength": 1
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Tokens refreshed",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "$ref": "#/components/schemas/AuthResponse"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Invalid or expired refresh token",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/forgot-password": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Request a password reset code",
          "description": "Sends a 6-digit password reset code to the user's email address. Always returns success to prevent email enumeration.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "email"
                  ],
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "john@example.com"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Reset code sent (if account exists)",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "message": {
                            "type": "string",
                            "example": "If an account exists for this email, a password reset code has been sent."
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/forgot-password/verify-code": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Verify the password reset code",
          "description": "Verifies the 6-digit reset code and returns a one-time reset token for the next step.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "email",
                    "code"
                  ],
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "john@example.com"
                    },
                    "code": {
                      "type": "string",
                      "pattern": "^\\d{6}$",
                      "example": "123456"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Code verified; reset token issued",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "message": {
                            "type": "string",
                            "example": "Password reset code verified successfully."
                          },
                          "resetToken": {
                            "type": "string",
                            "format": "uuid"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Invalid or expired code",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/forgot-password/reset": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Reset password with reset token",
          "description": "Sets a new password using the reset token received from the verify-code step.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "email",
                    "resetToken",
                    "password",
                    "confirmPassword"
                  ],
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "john@example.com"
                    },
                    "resetToken": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "password": {
                      "type": "string",
                      "minLength": 8,
                      "maxLength": 128,
                      "description": "Must include lowercase, uppercase, and a number.",
                      "example": "NewSecure1"
                    },
                    "confirmPassword": {
                      "type": "string",
                      "example": "NewSecure1"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password reset successful",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "message": {
                            "type": "string",
                            "example": "Password has been reset successfully."
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Invalid or expired reset token",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/me": {
        "get": {
          "tags": [
            "Auth"
          ],
          "summary": "Get current user profile",
          "description": "Returns the authenticated user's public profile.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Current user profile",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "user": {
                            "$ref": "#/components/schemas/PublicUser"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/auth/logout": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "Log out the current user",
          "description": "Invalidates the user's refresh tokens by incrementing the token version.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "204": {
              "description": "Logged out successfully (no content)"
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/admin/dashboard/metrics": {
        "get": {
          "tags": [
            "Admin"
          ],
          "summary": "Get dashboard metrics",
          "description": "Returns platform-level dashboard metrics. totalActiveProfiles is derived from users with a recorded lastActiveAt timestamp.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Metrics retrieved successfully"
            },
            "401": {
              "description": "Authentication required"
            },
            "403": {
              "description": "Admin access required"
            }
          }
        }
      },
      "/api/v1/admin/users": {
        "get": {
          "tags": [
            "Admin"
          ],
          "summary": "List users for admin management",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "minimum": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Users retrieved successfully"
            }
          }
        }
      },
      "/api/v1/admin/users/{userId}": {
        "get": {
          "tags": [
            "Admin"
          ],
          "summary": "Get a single user by id",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "userId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "User retrieved successfully"
            },
            "404": {
              "description": "User not found"
            }
          }
        }
      },
      "/api/v1/admin/admins": {
        "post": {
          "tags": [
            "Admin"
          ],
          "summary": "Create an admin user",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "name",
                    "email",
                    "password"
                  ],
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "password": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "address": {
                      "type": "string"
                    },
                    "profileImage": {
                      "type": "string",
                      "format": "uri"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Admin created successfully"
            }
          }
        }
      },
      "/api/v1/admin/bulk-email": {
        "post": {
          "tags": [
            "Admin"
          ],
          "summary": "Send a private bulk email to selected users",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "userIds",
                    "subject",
                    "message"
                  ],
                  "properties": {
                    "userIds": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "subject": {
                      "type": "string"
                    },
                    "message": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Email send completed"
            }
          }
        }
      },
      "/api/v1/admin/profile": {
        "get": {
          "tags": [
            "Admin"
          ],
          "summary": "Get the authenticated admin profile",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Profile retrieved successfully"
            }
          }
        },
        "patch": {
          "tags": [
            "Admin"
          ],
          "summary": "Update the authenticated admin profile",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "address": {
                      "type": "string"
                    },
                    "profileImage": {
                      "type": "string",
                      "format": "uri"
                    },
                    "profilePicture": {
                      "type": "string",
                      "format": "binary"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Profile updated successfully"
            }
          }
        }
      },
      "/api/v1/admin/profile/password": {
        "patch": {
          "tags": [
            "Admin"
          ],
          "summary": "Change the authenticated admin password",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "currentPassword",
                    "newPassword"
                  ],
                  "properties": {
                    "currentPassword": {
                      "type": "string"
                    },
                    "newPassword": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password updated successfully"
            }
          }
        }
      },
      "/api/v1/admin/settings": {
        "get": {
          "tags": [
            "Admin"
          ],
          "summary": "Get static dashboard settings content",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Settings retrieved successfully"
            }
          }
        },
        "patch": {
          "tags": [
            "Admin"
          ],
          "summary": "Update static dashboard settings content",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "termsAndConditions": {
                      "type": "string"
                    },
                    "privacyPolicy": {
                      "type": "string"
                    },
                    "aboutUs": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Settings updated successfully"
            }
          }
        }
      },
      "/api/v1/users/profile": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "Get authenticated user's profile",
          "description": "Returns the full public profile of the currently authenticated user.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "User profile retrieved",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "user": {
                            "$ref": "#/components/schemas/PublicUser"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        },
        "patch": {
          "tags": [
            "Users"
          ],
          "summary": "Update user profile",
          "description": "Updates the authenticated user's profile. Supports multipart/form-data for profile picture upload.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string",
                      "minLength": 2,
                      "maxLength": 80,
                      "example": "John Updated"
                    },
                    "phoneNumber": {
                      "type": "string",
                      "maxLength": 30,
                      "example": "+1234567890"
                    },
                    "address": {
                      "type": "string",
                      "maxLength": 300,
                      "example": "123 Main St, Springfield"
                    },
                    "familyMembers": {
                      "type": "string",
                      "description": "JSON array of family member objects, e.g. [{\"name\":\"Jane\",\"email\":\"jane@example.com\",\"relation\":\"sister\",\"role\":\"viewer\",\"status\":\"accepted\"}]"
                    },
                    "notifications": {
                      "type": "boolean",
                      "description": "Enable/disable notifications"
                    },
                    "aiInsight": {
                      "type": "boolean",
                      "description": "Enable/disable AI insights"
                    },
                    "darkMode": {
                      "type": "boolean",
                      "description": "Enable/disable dark mode"
                    },
                    "anonymousAnalytics": {
                      "type": "boolean",
                      "description": "Enable/disable anonymous analytics"
                    },
                    "profilePicture": {
                      "type": "string",
                      "format": "binary",
                      "description": "Profile picture image file (JPEG, PNG, WebP — max 5 MB)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Profile updated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "user": {
                            "$ref": "#/components/schemas/PublicUser"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Validation error",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/users/family-members": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "List accepted family members",
          "description": "Returns only accepted family members for the authenticated user.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Accepted family members retrieved"
            },
            "401": {
              "description": "Authentication required"
            }
          }
        }
      },
      "/api/v1/users/invitations": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "List pending invitations for the authenticated invitee",
          "description": "Returns pending family-member invitations addressed to the authenticated user by user id or email.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Invitations retrieved"
            },
            "401": {
              "description": "Authentication required"
            }
          }
        },
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Create a family invitation",
          "description": "Invites a family member by email. If the email belongs to an existing user, the family-member relationship remains pending until that user accepts. If the email does not belong to an existing user, a new user account is created with a temporary password and the relationship remains pending until acceptance.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "name",
                    "email",
                    "role"
                  ],
                  "properties": {
                    "name": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 80,
                      "example": "Jane Doe"
                    },
                    "email": {
                      "type": "string",
                      "format": "email",
                      "maxLength": 254,
                      "example": "jane@example.com"
                    },
                    "relation": {
                      "type": "string",
                      "maxLength": 50,
                      "example": "brother"
                    },
                    "role": {
                      "type": "string",
                      "enum": [
                        "viewer",
                        "editor",
                        "owner"
                      ],
                      "example": "viewer"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Invitation sent",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "invitation": {
                            "type": "object",
                            "properties": {
                              "email": {
                                "type": "string",
                                "format": "email"
                              },
                              "expiresAt": {
                                "type": "string",
                                "format": "date-time"
                              },
                              "role": {
                                "type": "string",
                                "enum": [
                                  "viewer",
                                  "editor",
                                  "owner"
                                ]
                              },
                              "status": {
                                "type": "string",
                                "enum": [
                                  "pending"
                                ]
                              },
                              "isExistingUser": {
                                "type": "boolean"
                              }
                            }
                          },
                          "message": {
                            "type": "string",
                            "example": "Invitation sent successfully."
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "409": {
              "description": "Duplicate pending or accepted family invitation/member",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/users/invitations/{invitationId}/accept": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Accept a pending family invitation as the authenticated invitee",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "invitationId",
              "required": true,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Invitation accepted"
            },
            "401": {
              "description": "Authentication required"
            },
            "404": {
              "description": "Invitation not found"
            }
          }
        }
      },
      "/api/v1/users/invitations/{invitationId}/decline": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Decline a pending family invitation as the authenticated invitee",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "invitationId",
              "required": true,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Invitation declined"
            },
            "401": {
              "description": "Authentication required"
            },
            "404": {
              "description": "Invitation not found"
            }
          }
        }
      },
      "/api/v1/users/invitations/accept": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Accept a family invitation",
          "description": "Accepts a pending invitation using the invitation token received via email. No authentication required.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "token"
                  ],
                  "properties": {
                    "token": {
                      "type": "string",
                      "minLength": 1,
                      "description": "The invitation token from the invitation email link."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Invitation accepted",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "email": {
                            "type": "string",
                            "format": "email"
                          },
                          "message": {
                            "type": "string",
                            "example": "Invitation accepted successfully."
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Invalid or expired invitation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/memory-vault": {
        "get": {
          "tags": [
            "Memory Vault"
          ],
          "summary": "List all memories",
          "description": "Retrieves a list of memories for the authenticated user, or for an accepted family member when `familyMemberUserId` is provided, sorted by memory date and creation time descending.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "familyMemberUserId",
              "required": false,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "description": "Accepted family member user id to filter memories by."
            }
          ],
          "responses": {
            "200": {
              "description": "Memories list retrieved",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "memories": {
                            "type": "array",
                            "items": {
                              "$ref": "#/components/schemas/PublicMemoryVaultItem"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        },
        "post": {
          "tags": [
            "Memory Vault"
          ],
          "summary": "Create a new memory",
          "description": "Creates a new memory item. Supports multipart/form-data for uploading files (images, videos, voice recordings).",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "type",
                    "whoseMemoryIsThis",
                    "title",
                    "narrative",
                    "date"
                  ],
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": [
                        "photo",
                        "video",
                        "journal",
                        "voice"
                      ],
                      "example": "photo"
                    },
                    "whoseMemoryIsThis": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 120,
                      "example": "My son's first step"
                    },
                    "title": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 160,
                      "example": "First Steps"
                    },
                    "narrative": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 5000,
                      "example": "He walked from the sofa to the kitchen table."
                    },
                    "date": {
                      "type": "string",
                      "format": "date-time",
                      "description": "ISO date-time string",
                      "example": "2025-01-15T10:30:00.000Z"
                    },
                    "tags": {
                      "type": "string",
                      "description": "Comma-separated list or JSON array of tags",
                      "example": "milestone, family"
                    },
                    "files": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      },
                      "description": "Files to upload. Types other than 'journal' require at least 1 file. Max 10 files."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Memory created successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "memory": {
                            "$ref": "#/components/schemas/PublicMemoryVaultItem"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Validation error or missing files",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/memory-vault/timeline": {
        "get": {
          "tags": [
            "Memory Vault"
          ],
          "summary": "Get memories grouped by date",
          "description": "Retrieves the timeline view for the authenticated user, or for an accepted family member when `familyMemberUserId` is provided, grouping memories by date (YYYY-MM-DD).",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "familyMemberUserId",
              "required": false,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "description": "Accepted family member user id to filter the timeline by."
            }
          ],
          "responses": {
            "200": {
              "description": "Timeline data retrieved",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "timeline": {
                            "type": "array",
                            "items": {
                              "$ref": "#/components/schemas/MemoryTimelineGroup"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/memory-vault/{memoryId}": {
        "get": {
          "tags": [
            "Memory Vault"
          ],
          "summary": "Get a specific memory item",
          "description": "Retrieves detail of a single memory by ID.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "memoryId",
              "required": true,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "description": "24-character hexadecimal MongoDB ObjectId"
            }
          ],
          "responses": {
            "200": {
              "description": "Memory retrieved",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "memory": {
                            "$ref": "#/components/schemas/PublicMemoryVaultItem"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Invalid memory ID format",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "404": {
              "description": "Memory not found",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        },
        "patch": {
          "tags": [
            "Memory Vault"
          ],
          "summary": "Update an existing memory",
          "description": "Updates an existing memory item. Supports multipart/form-data for updating files.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "memoryId",
              "required": true,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "description": "24-character hexadecimal MongoDB ObjectId"
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": [
                        "photo",
                        "video",
                        "journal",
                        "voice"
                      ]
                    },
                    "whoseMemoryIsThis": {
                      "type": "string",
                      "maxLength": 120
                    },
                    "title": {
                      "type": "string",
                      "maxLength": 160
                    },
                    "narrative": {
                      "type": "string",
                      "maxLength": 5000
                    },
                    "date": {
                      "type": "string",
                      "format": "date-time"
                    },
                    "tags": {
                      "type": "string",
                      "description": "Comma-separated list or JSON array of tags"
                    },
                    "files": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "binary"
                      },
                      "description": "Files to replace previous files."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Memory updated successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "memory": {
                            "$ref": "#/components/schemas/PublicMemoryVaultItem"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Validation error",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "404": {
              "description": "Memory not found",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        },
        "delete": {
          "tags": [
            "Memory Vault"
          ],
          "summary": "Delete a memory",
          "description": "Deletes a memory item and removes associated files from storage.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "memoryId",
              "required": true,
              "schema": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "description": "24-character hexadecimal MongoDB ObjectId"
            }
          ],
          "responses": {
            "204": {
              "description": "Memory deleted successfully (no content)"
            },
            "400": {
              "description": "Invalid memory ID format",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Authentication required",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            },
            "404": {
              "description": "Memory not found",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/ErrorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/health": {
        "get": {
          "tags": [
            "Health"
          ],
          "summary": "Get service health status",
          "description": "Returns the health status, uptime, and current server timestamp.",
          "responses": {
            "200": {
              "description": "Server is healthy",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string",
                        "example": "Server is healthy"
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "uptime": {
                            "type": "number",
                            "example": 456.78
                          },
                          "timestamp": {
                            "type": "string",
                            "format": "date-time",
                            "example": "2025-01-15T12:00:00.000Z"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/trusted-contacts": {
        "post": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "Add a trusted contact",
          "description": "Requires authentication and current-password reauthentication. Creates a pending trusted contact, stores only a hashed invitation token, sends an invitation email, and records an audit log.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "name",
                    "email",
                    "inactivityDays",
                    "accessScope",
                    "currentPassword"
                  ],
                  "properties": {
                    "name": {
                      "type": "string",
                      "example": "Jane Trusted"
                    },
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "jane@example.com"
                    },
                    "phone": {
                      "type": "string",
                      "example": "+15551234567"
                    },
                    "inactivityDays": {
                      "type": "integer",
                      "minimum": 30,
                      "maximum": 365,
                      "example": 90
                    },
                    "currentPassword": {
                      "type": "string",
                      "example": "SecurePass1"
                    },
                    "accessScope": {
                      "$ref": "#/components/schemas/TrustedContactAccessScope"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Trusted contact created"
            },
            "400": {
              "description": "Validation or self-reference error"
            },
            "401": {
              "description": "Authentication or reauthentication failed"
            },
            "409": {
              "description": "Duplicate active trusted contact"
            }
          }
        },
        "get": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "List trusted contacts",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Trusted contacts retrieved"
            }
          }
        }
      },
      "/api/v1/trusted-contacts/{id}": {
        "patch": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "Update a trusted contact",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "currentPassword"
                  ],
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "inactivityDays": {
                      "type": "integer",
                      "minimum": 30,
                      "maximum": 365
                    },
                    "accessScope": {
                      "$ref": "#/components/schemas/TrustedContactAccessScope"
                    },
                    "currentPassword": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Trusted contact updated"
            }
          }
        },
        "delete": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "Remove a trusted contact",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "currentPassword"
                  ],
                  "properties": {
                    "currentPassword": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Trusted contact removed"
            }
          }
        }
      },
      "/api/v1/trusted-contacts/invite/{token}": {
        "get": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "Validate a trusted contact invitation",
          "parameters": [
            {
              "in": "path",
              "name": "token",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Safe invitation details returned"
            },
            "400": {
              "description": "Invalid or expired invitation"
            }
          }
        }
      },
      "/api/v1/trusted-contacts/invite/{token}/accept": {
        "post": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "Accept a trusted contact invitation",
          "parameters": [
            {
              "in": "path",
              "name": "token",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Invitation accepted"
            },
            "400": {
              "description": "Invalid or expired invitation"
            }
          }
        }
      },
      "/api/v1/trusted-contacts/invite/{token}/decline": {
        "post": {
          "tags": [
            "Trusted Contacts"
          ],
          "summary": "Decline a trusted contact invitation",
          "parameters": [
            {
              "in": "path",
              "name": "token",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Invitation declined"
            },
            "400": {
              "description": "Invalid or expired invitation"
            }
          }
        }
      },
      "/api/v1/legacy-access/settings": {
        "patch": {
          "tags": [
            "Legacy Access"
          ],
          "summary": "Enable or disable legacy access",
          "description": "Requires authentication and current-password reauthentication.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "legacyAccessEnabled",
                    "currentPassword"
                  ],
                  "properties": {
                    "legacyAccessEnabled": {
                      "type": "boolean",
                      "example": true
                    },
                    "currentPassword": {
                      "type": "string",
                      "example": "SecurePass1"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Settings updated"
            }
          }
        }
      },
      "/api/v1/legacy-access/requests": {
        "get": {
          "tags": [
            "Legacy Access"
          ],
          "summary": "List legacy access requests for the authenticated trusted contact account",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Requests retrieved"
            }
          }
        }
      },
      "/api/v1/legacy-access/{requestId}/claim": {
        "post": {
          "tags": [
            "Legacy Access"
          ],
          "summary": "Claim a waiting legacy access request after the unlock date",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "requestId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Request approved"
            },
            "400": {
              "description": "Request expired or invalid state"
            },
            "403": {
              "description": "Waiting period not over or unauthorized"
            }
          }
        }
      },
      "/api/v1/legacy-access/{requestId}/data": {
        "get": {
          "tags": [
            "Legacy Access"
          ],
          "summary": "Get scoped, view-only legacy access data",
          "description": "Returns only data explicitly allowed by the trusted contact access scope. Passwords, tokens, payment secrets, credentials, and admin-only data are never returned.",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "requestId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Scoped legacy data returned"
            },
            "403": {
              "description": "Request not approved or unauthorized"
            }
          }
        }
      },
      "/api/v1/legacy-access/{requestId}/cancel": {
        "post": {
          "tags": [
            "Legacy Access"
          ],
          "summary": "Cancel a legacy access request as the original user",
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "requestId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Request cancelled"
            }
          }
        }
      }
    },
    "tags": [
      {
        "name": "Auth",
        "description": "Authentication & session management"
      },
      {
        "name": "Admin",
        "description": "Admin and super-admin dashboard operations"
      },
      {
        "name": "Users",
        "description": "User profile & invitation management"
      },
      {
        "name": "Memory Vault",
        "description": "CRUD operations & timeline view for memories"
      },
      {
        "name": "Health",
        "description": "Service health checking"
      },
      {
        "name": "Trusted Contacts",
        "description": "Trusted contact management and invitation flows"
      },
      {
        "name": "Legacy Access",
        "description": "Legacy-access settings, requests, and trusted-contact data access"
      }
    ]
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
