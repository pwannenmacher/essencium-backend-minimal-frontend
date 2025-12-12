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

// Test-Passwort zur Laufzeit generieren
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
});
