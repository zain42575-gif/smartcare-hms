import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../src/pages/Login.jsx';
import { AuthProvider, useAuth } from '../src/context/AuthContext.jsx';
import api from '../src/api/client.js';

vi.mock('../src/api/client.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn().mockResolvedValue({ data: { data: null } }),
  }
}));

const MockAuthProvider = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Login portal="patient" />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Enter patient email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter password/i)).toBeInTheDocument();
  });

  it('handles standard login successfully', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { name: 'Test User', role: 'patient' },
          requires2fa: false
        }
      }
    });
    
    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Login portal="patient" />
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter patient email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login as Patient/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
        role: 'patient'
      });
    });
  });

  it('switches to 2FA view if requires2fa is true', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          requires2fa: true,
          userId: 'testuser123'
        }
      }
    });

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Login portal="patient" />
        </MockAuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter patient email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login as Patient/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });
  });
});
