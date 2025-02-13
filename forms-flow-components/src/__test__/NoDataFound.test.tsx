import React from 'react';
import { render, screen } from '@testing-library/react';
import { NoDataFound } from '../components/CustomComponents/NoDataFound';

 

const renderNoDataFound = () => render(<table><NoDataFound message='Nothing is found based on your search query. Please try again.'/></table>);

describe('NoDataFound Component', () => {
  it('renders the no data message correctly', () => {
    renderNoDataFound();
    
    // Check if the message is rendered
    const noDataMessage = screen.getByTestId('no-data-found');
    expect(noDataMessage).toBeInTheDocument();
    expect(noDataMessage.textContent).toBe(
      'Nothing is found based on your search query. Please try again.'
    );
  });

  it('renders with correct HTML structure', () => {
    renderNoDataFound();
    
    // Check if tbody exists
    const tbody = document.querySelector('.no-data-body');
    expect(tbody).toBeInTheDocument();

    // Check if td has correct colspan
    const td = document.querySelector('.no-data-container');
    expect(td).toHaveAttribute('colspan', '2');
  });
}); 