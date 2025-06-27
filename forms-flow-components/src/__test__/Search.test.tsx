import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { CustomSearch } from '../components/CustomComponents/Search';
 
describe('CustomSearch Component', () => {
  const defaultProps = {
    searchLoading: false,
    handleClearSearch: jest.fn(),
    search: '',
    setSearch: jest.fn(),
    handleSearch: jest.fn(),
    dataTestId: 'custom-search',
  };

  it('renders with default props', () => {
    render(<CustomSearch {...defaultProps} />);
    const searchInput = screen.getByTestId('custom-search');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search...');
  });

  it('shows clear button when search has value', () => {
    render(<CustomSearch {...defaultProps} search="test" />);
    const clearButton = screen.getByTestId('form-search-clear-button');
    expect(clearButton).toBeInTheDocument();
  });

  it('shows loading spinner when searchLoading is true', () => {
    render(<CustomSearch {...defaultProps} search="test" searchLoading={true} />);
    const spinner = screen.getByTestId('search-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('calls handleSearch when Enter key is pressed', () => {
    const handleSearch = jest.fn();
    render(<CustomSearch {...defaultProps} handleSearch={handleSearch} />);
    const searchInput = screen.getByTestId('custom-search');
    
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  it('calls setSearch when input value changes', () => {
    const setSearch = jest.fn();
    render(<CustomSearch {...defaultProps} setSearch={setSearch} />);
    const searchInput = screen.getByTestId('custom-search');
    
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(setSearch).toHaveBeenCalledWith('test');
  });

  it('calls handleClearSearch when clear button is clicked', () => {
    const handleClearSearch = jest.fn();
    render(
      <CustomSearch {...defaultProps} search="test" handleClearSearch={handleClearSearch} />
    );
    const clearButton = screen.getByTestId('form-search-clear-button');
    
    fireEvent.click(clearButton);
    expect(handleClearSearch).toHaveBeenCalledTimes(1);
  });

  it('renders with custom placeholder and title', () => {
    render(
      <CustomSearch
        {...defaultProps}
        placeholder="Custom placeholder"
        title="Custom title"
      />
    );
    const searchInput = screen.getByTestId('custom-search');
    expect(searchInput).toHaveAttribute('placeholder', 'Custom placeholder');
    expect(searchInput).toHaveAttribute('title', 'Custom title');
  });
}); 