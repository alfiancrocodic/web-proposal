import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast, { useToast } from '@/components/Toast';

describe('Toast Component', () => {
  jest.useFakeTimers();

  it('renders the message correctly', () => {
    render(<Toast message="Test message" type="info" onClose={() => {}} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies the correct style for type "success"', () => {
    const { container } = render(<Toast message="Success" type="success" onClose={() => {}} />);
    // Check for a class specific to the success style
    expect(container.firstChild).toHaveClass('border-green-500');
  });

  it('applies the correct style for type "error"', () => {
    const { container } = render(<Toast message="Error" type="error" onClose={() => {}} />);
    // Check for a class specific to the error style
    expect(container.firstChild).toHaveClass('border-red-500');
  });

  it('calls onClose after the specified duration', () => {
    const handleClose = jest.fn();
    render(<Toast message="Auto close" type="info" duration={3000} onClose={handleClose} />);
    
    // Fast-forward time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Fast-forward time for the fade-out animation
    act(() => {
        jest.advanceTimersByTime(300);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Toast message="Manual close" type="warning" onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Tutup notifikasi');
    fireEvent.click(closeButton);

    // Fast-forward time for the fade-out animation
    act(() => {
        jest.advanceTimersByTime(300);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('useToast Hook', () => {
  jest.useFakeTimers();

  const TestComponent = () => {
    const { showToast, ToastContainer, showSuccess } = useToast();
    return (
      <div>
        <button onClick={() => showToast('Info toast', 'info')}>Show Info</button>
        <button onClick={() => showSuccess('Success toast')}>Show Success</button>
        <ToastContainer />
      </div>
    );
  };

  it('should not show any toast initially', () => {
    render(<TestComponent />);
    expect(screen.queryByText('Info toast')).not.toBeInTheDocument();
    expect(screen.queryByText('Success toast')).not.toBeInTheDocument();
  });

  it('should show a toast when showToast is called', () => {
    render(<TestComponent />);
    const button = screen.getByText('Show Info');
    
    fireEvent.click(button);
    
    expect(screen.getByText('Info toast')).toBeInTheDocument();
  });

  it('should show a success toast when showSuccess is called', () => {
    render(<TestComponent />);
    const button = screen.getByText('Show Success');
    
    fireEvent.click(button);
    
    const toast = screen.getByText('Success toast');
    expect(toast).toBeInTheDocument();
    // Check if the success style is applied
    expect(toast.closest('div[class*="border-green-500"]')).toBeInTheDocument();
  });

  it('should remove the toast after the duration', () => {
    render(<TestComponent />);
    const button = screen.getByText('Show Info');
    
    fireEvent.click(button);
    
    // Toast is visible
    expect(screen.getByText('Info toast')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.runAllTimers();
    });
    
    // Toast should be removed from the DOM
    expect(screen.queryByText('Info toast')).not.toBeInTheDocument();
  });
});
