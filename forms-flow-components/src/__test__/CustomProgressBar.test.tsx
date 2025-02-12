import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomProgressBar } from '../components/CustomComponents/ProgressBar';

describe('CustomProgressBar Component', () => {
  it('renders progress bar with correct progress value', () => {
    const progress = 50;
    render(<CustomProgressBar progress={progress} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', progress.toString());
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders progress bar with 0 progress', () => {
    render(<CustomProgressBar progress={0} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders progress bar with 100 progress', () => {
    render(<CustomProgressBar progress={100} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
}); 