// Empfohlene Test-Erweiterungen für userService.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  updateMe,
  patchUser,
  updateMyPassword,
  getMyTokens,
  deleteMyToken
} from './userService';

describe('userService - Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // KRITISCH: Eigenes Profil aktualisieren
  describe('updateMe', () => {
    it('should update own profile with userId in body', async () => {
      const updates = { 
        firstName: 'Updated', 
        lastName: 'Name',
        email: 'updated@example.com'
      };
      const userId = 1;
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: userId, ...updates }),
      });

      const result = await updateMe('token', updates, userId);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...updates, id: userId }),
        })
      );

      expect(result.firstName).toBe('Updated');
      expect(result.id).toBe(userId);
    });

    it('should handle validation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid email format',
      });

      await expect(updateMe('token', {}, 1)).rejects.toThrow();
    });
  });

  // KRITISCH: Partielles Update (PATCH vs PUT)
  describe('patchUser', () => {
    it('should partially update user with PATCH', async () => {
      const partialUpdate = { firstName: 'NewName' };
      const userId = 1;
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: userId, ...partialUpdate }),
      });

      const result = await patchUser('token', userId, partialUpdate);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ ...partialUpdate, id: userId }),
        })
      );

      expect(result.firstName).toBe('NewName');
    });

    it('should handle 404 when user not found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'User not found',
      });

      await expect(patchUser('token', 999, {})).rejects.toThrow();
    });
  });

  // KRITISCH: Passwort ändern
  describe('updateMyPassword', () => {
    it('should change password with old and new password', async () => {
      const passwordData = { 
        oldPassword: 'old123', 
        newPassword: 'new456' 
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await updateMyPassword('token', passwordData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me/password',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(passwordData),
        })
      );

      expect(result.success).toBe(true);
    });

    it('should handle wrong old password error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Current password is incorrect',
      });

      await expect(
        updateMyPassword('token', { oldPassword: 'wrong', newPassword: 'new' })
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should handle weak new password error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Password too weak',
      });

      await expect(
        updateMyPassword('token', { oldPassword: 'old', newPassword: '123' })
      ).rejects.toThrow('Password too weak');
    });
  });

  // MITTEL: Session-Management
  describe('getMyTokens', () => {
    it('should fetch refresh tokens for current user', async () => {
      const mockTokens = [
        { 
          id: 1, 
          createdAt: '2024-01-01T10:00:00Z',
          expiresAt: '2024-01-08T10:00:00Z',
          userAgent: 'Mozilla/5.0'
        },
      ];
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });

      const result = await getMyTokens('token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me/token',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockTokens);
      expect(result[0].userAgent).toBe('Mozilla/5.0');
    });

    it('should handle unauthorized access', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(getMyTokens('invalid-token')).rejects.toThrow();
    });
  });

  describe('deleteMyToken', () => {
    it('should delete specific token/session', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteMyToken('token', 123);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me/token/123',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer token',
          },
        })
      );
    });

    it('should handle non-existent token error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Token not found',
      });

      await expect(deleteMyToken('token', 999)).rejects.toThrow();
    });
  });
});

// OPTIONAL: getUsersBasic
describe('getUsersBasic', () => {
  it('should fetch users without pagination', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com' },
      { id: 2, email: 'user2@example.com' },
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    const result = await getUsersBasic('token', { roles: 'ADMIN' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8098/v1/users/basic?roles=ADMIN',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer token',
        }),
      })
    );

    expect(result).toEqual(mockUsers);
  });
});
