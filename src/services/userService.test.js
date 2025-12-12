import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getUserById,
  getMyRoles,
  getMyRights 
} from './userService';

vi.mock('../config.js', () => ({
  API_BASE_URL: 'http://localhost:8098',
}));
const generateTestPassword = () => `testPwd_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
const TEST_PASSWORD = generateTestPassword();

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getAllUsers', () => {
    it('should fetch users with pagination parameters', async () => {
      const mockResponse = {
        content: [
          { id: 1, email: 'user1@example.com' },
          { id: 2, email: 'user2@example.com' },
        ],
        totalElements: 2,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getUsers('token', { page: 0, size: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users?page=0&size=20',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      await expect(getUsers('token', { page: 0, size: 20 })).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('should create user with correct payload', async () => {
      const newUser = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: TEST_PASSWORD,
        locale: 'de',
        roles: ['USER'],
      };

      const mockResponse = { id: 3, ...newUser };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createUser('token', newUser);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Email already exists',
      });

      await expect(createUser('token', {})).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user with PUT request', async () => {
      const updates = { id: 1, firstName: 'Updated' };
      const mockResponse = { id: 1, firstName: 'Updated' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateUser('token', 1, updates);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserById', () => {
    it('should fetch single user by id', async () => {
      const mockUser = { id: 1, email: 'user@example.com' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await getUserById('token', 1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockUser);
    });
  });

  describe('getMyRoles', () => {
    it('should fetch current user roles', async () => {
      const mockRoles = ['USER', 'ADMIN'];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      });

      const result = await getMyRoles('token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me/roles',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockRoles);
    });
  });

  describe('getMyRights', () => {
    it('should fetch current user rights', async () => {
      const mockRights = ['USER_ADMIN', 'ROLE_ADMIN'];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRights,
      });

      const result = await getMyRights('token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me/roles/rights',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockRights);
    });
  });

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteUser('token', 1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer token',
          },
        })
      );
    });

    it('should handle delete errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(deleteUser('token', 'nonexistent@example.com')).rejects.toThrow();
    });
  });

  describe('getUsersBasic', () => {
    it('should fetch users basic without parameters', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      const result = await import('./userService').then(m => m.getUsersBasic('token'));

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/basic',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockUsers);
    });

    it('should fetch users basic with filter parameters', async () => {
      const mockUsers = [{ id: 1, email: 'test@example.com' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      const result = await import('./userService').then(m => 
        m.getUsersBasic('token', { email: 'test@example.com', roles: 'ADMIN' })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/basic?email=test%40example.com&roles=ADMIN',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );

      expect(result).toEqual(mockUsers);
    });
  });

  describe('patchMe', () => {
    it('should patch current user profile', async () => {
      const partialData = { firstName: 'Updated' };
      const userId = 123;
      const mockResponse = { id: userId, firstName: 'Updated', email: 'test@example.com' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await import('./userService').then(m => 
        m.patchMe('token', partialData, userId)
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/me',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...partialData, id: userId }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle patch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid data',
      });

      await expect(
        import('./userService').then(m => m.patchMe('token', {}, 123))
      ).rejects.toThrow();
    });
  });

  describe('updateMyPassword', () => {
    it('should update current user password', async () => {
      const passwordData = { password: TEST_PASSWORD, verification: TEST_PASSWORD };
      const mockResponse = { success: true };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await import('./userService').then(m => 
        m.updateMyPassword('token', passwordData)
      );

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

      expect(result).toEqual(mockResponse);
    });

    it('should handle password update errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Password too weak',
      });

      await expect(
        import('./userService').then(m => 
          m.updateMyPassword('token', { password: 'weak' })
        )
      ).rejects.toThrow();
    });
  });

  describe('deleteMyToken', () => {
    it('should delete current user token', async () => {
      const tokenId = 'token-123';

      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await import('./userService').then(m => m.deleteMyToken('token', tokenId));

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8098/v1/users/me/token/${tokenId}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer token',
          },
        })
      );
    });

    it('should handle token deletion errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Token not found',
      });

      await expect(
        import('./userService').then(m => m.deleteMyToken('token', 'invalid'))
      ).rejects.toThrow();
    });
  });

  describe('terminateUserSessions', () => {
    it('should terminate all user sessions', async () => {
      const userId = 123;

      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await import('./userService').then(m => m.terminateUserSessions('token', userId));

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8098/v1/users/${userId}/terminate`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token',
          },
        })
      );
    });

    it('should handle session termination errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      await expect(
        import('./userService').then(m => m.terminateUserSessions('token', 123))
      ).rejects.toThrow();
    });
  });

  describe('getAllUsersWithTokens', () => {
    it('should fetch all users with their tokens (admin)', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com', tokens: [] },
        { id: 2, email: 'user2@example.com', tokens: [{ id: 'token-1' }] }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      const result = await import('./userService').then(m => 
        m.getAllUsersWithTokens('admin-token')
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/users/token',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer admin-token',
          }),
        })
      );

      expect(result).toEqual(mockUsers);
    });
  });

  describe('deleteUserToken', () => {
    it('should delete specific user token (admin)', async () => {
      const userId = 123;
      const tokenId = 'token-456';

      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await import('./userService').then(m => 
        m.deleteUserToken('admin-token', userId, tokenId)
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8098/v1/users/${userId}/token/${tokenId}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer admin-token',
          },
        })
      );
    });

    it('should handle user token deletion errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Insufficient permissions',
      });

      await expect(
        import('./userService').then(m => 
          m.deleteUserToken('token', 123, 'token-id')
        )
      ).rejects.toThrow();
    });
  });
});
