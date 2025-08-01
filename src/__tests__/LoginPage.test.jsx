import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import LoginPage from '../pages/LoginPage';

vi.mock('axios');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    axios.post.mockResolvedValue({ data: { profileId: '123' } });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('successful login shows toast and navigates', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(localStorage.getItem('profileId')).toBe('123');
    expect(screen.getByText(/Logged in successfully!/i)).toBeInTheDocument();

    vi.runAllTimers();
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });
});
