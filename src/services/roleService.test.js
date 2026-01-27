import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRoles, createRole, updateRole, deleteRole, getRoleByName } from './roleService';

vi.mock('../config.js', () => ({
  API_BASE_URL: 'http://localhost:8098',
}));

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getAllRoles', () => {
    it('should fetch all roles with authorization', async () => {
      const mockRoles = {
        content: [
          { name: 'ADMIN', rights: ['USER_ADMIN', 'ROLE_ADMIN'] },
          { name: 'USER', rights: [] },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles,
      });

      const result = await getRoles('token', { page: 0, size: 100 });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/roles?page=0&size=100',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token',
          },
        })
      );

      expect(result).toEqual(mockRoles);
    });

    it('should handle fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(getRoles('token')).rejects.toThrow();
    });
  });

  describe('createRole', () => {
    it('should create role with name and rights', async () => {
      const newRole = {
        name: 'EDITOR',
        rights: ['CONTENT_EDIT'],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newRole,
      });

      const result = await createRole('token', newRole);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/roles',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRole),
        })
      );

      expect(result).toEqual(newRole);
    });

    it('should handle role creation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'Role already exists',
      });

      await expect(createRole('token', { name: 'ADMIN' })).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('should update existing role with PUT', async () => {
      const updates = { name: 'EDITOR', rights: ['NEW_RIGHT'] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updates,
      });

      const result = await updateRole('token', 'EDITOR', updates);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/roles/EDITOR',
        expect.objectContaining({
          method: 'PUT',
        })
      );

      expect(result.rights).toEqual(['NEW_RIGHT']);
    });

    it('should handle update errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid role data',
      });

      await expect(updateRole('token', 'EDITOR', {})).rejects.toThrow();
    });
  });

  describe('getRoleByName', () => {
    it('should fetch single role by name', async () => {
      const mockRole = { name: 'ADMIN', rights: ['USER_ADMIN', 'ROLE_ADMIN'] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRole,
      });

      const result = await getRoleByName('token', 'ADMIN');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/roles/ADMIN',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token',
          },
        })
      );

      expect(result).toEqual(mockRole);
    });

    it('should throw error when role not found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getRoleByName('token', 'NONEXISTENT')).rejects.toThrow();
    });
  });

  describe('deleteRole', () => {
    it('should delete role by name', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteRole('token', 'OLD_ROLE');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/roles/OLD_ROLE',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('patchRole', () => {
    it('should patch role with partial data', async () => {
      const partialData = { description: 'Updated description' };
      const roleName = 'ADMIN';
      const mockResponse = {
        name: roleName,
        description: 'Updated description',
        rights: ['USER_ADMIN', 'ROLE_ADMIN'],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await import('./roleService').then((m) =>
        m.patchRole('token', roleName, partialData)
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8098/v1/roles/${roleName}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...partialData, name: roleName }),
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
        import('./roleService').then((m) => m.patchRole('token', 'ADMIN', { description: '' }))
      ).rejects.toThrow();
    });
  });

  describe('getAllRights', () => {
    it('should fetch all rights without parameters', async () => {
      const mockRights = {
        content: [
          { authority: 'USER_READ' },
          { authority: 'USER_WRITE' },
          { authority: 'USER_ADMIN' },
        ],
        totalElements: 3,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRights,
      });

      const result = await import('./roleService').then((m) => m.getAllRights('token'));

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/rights',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token',
          },
        })
      );

      expect(result).toEqual(mockRights);
    });

    it('should fetch all rights with pagination', async () => {
      const mockRights = {
        content: [{ authority: 'USER_READ' }, { authority: 'USER_WRITE' }],
        totalElements: 10,
        page: 0,
        size: 2,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRights,
      });

      const result = await import('./roleService').then((m) =>
        m.getAllRights('token', { page: 0, size: 2, sort: 'authority,asc' })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/v1/rights?page=0&size=2&sort=authority%2Casc',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token',
          },
        })
      );

      expect(result).toEqual(mockRights);
    });

    it('should handle getAllRights errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(import('./roleService').then((m) => m.getAllRights('token'))).rejects.toThrow(
        'Fehler beim Laden der Rechte: 403'
      );
    });
  });
});
