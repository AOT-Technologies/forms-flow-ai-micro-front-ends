import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { ImportModal } from '../components/CustomComponents/ImportModal';
import userEvent from '@testing-library/user-event';
 
const renderImportModal = (props) =>  render(<ImportModal {...props} />);

describe('ImportModal Component', () => {
  const defaultProps = {
    showModal: true,
    onClose: jest.fn(),
    uploadActionType: {
      IMPORT: 'IMPORT',
      VALIDATE: 'VALIDATE',
    },
    importError: null,
    importLoader: false,
    formName: 'Test Form',
    description: 'Test Description',
    handleImport: jest.fn(),
    fileItems: null,
    fileType: '.json',
    primaryButtonText: 'Import',
    headerText: 'Import Form',
    processVersion: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with upload area when no file is selected', () => {
    renderImportModal(defaultProps);
    
    expect(screen.getByTestId("import-modal-file-upload-area")).toBeInTheDocument();
  });

  it('handles file upload through input change', async () => {
    renderImportModal(defaultProps);
    const file = new File(['test content'], 'test.json', { type: 'application/json' });
    const fileInput = screen.getByTestId("import-modal-file-upload-area");
    const input = screen.getByTestId("import-modal-file-input");
    fireEvent.click(fileInput);
    await userEvent.upload(input, file);
    expect(defaultProps.handleImport).toHaveBeenCalledWith(
      file,
      'VALIDATE',
      true,
      true
    );
  });

  it('displays error message when import fails', async() => {
    const errorProps = {
      ...defaultProps,
      importError: 'Failed to import file',
    };
    renderImportModal(errorProps);
    const file = new File(['test content'], 'test.json', { type: 'application/json' });
    const fileInput = screen.getByTestId("import-modal-file-upload-area");
    const input = screen.getByTestId("import-modal-file-input");
    fireEvent.click(fileInput);
    await userEvent.upload(input, file);
    expect(screen.getByText('Failed to import file')).toBeInTheDocument();
  });

  it('shows version options when fileItems has versions', async() => {
    const propsWithVersions = {
      ...defaultProps,
      fileItems: {
        form: {
          majorVersion: 1,
          minorVersion: 0,
        },
        workflow: {
          majorVersion: 1,
          minorVersion: 0,
        },
      },
    };

    renderImportModal(propsWithVersions);
    const file = new File(['test content'], 'test.json', { type: 'application/json' });
    const fileInput = screen.getByTestId("import-modal-file-upload-area");
    const input = screen.getByTestId("import-modal-file-input");
    fireEvent.click(fileInput);
    await userEvent.upload(input, file);
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Flow')).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', () => {
   renderImportModal(defaultProps);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('disables import button when no file is selected', () => {
    renderImportModal(defaultProps);
    const importButton = screen.getByTestId('import-modal-primary-button');
    expect(importButton).toBeDisabled();
  });

  it('shows progress bar when file is being uploaded', async () => {
    renderImportModal(defaultProps);
    const file = new File(['test content'], 'test.json', { type: 'application/json' });
    const fileInput = screen.getByTestId("import-modal-file-upload-area");
    const input = screen.getByTestId("import-modal-file-input");
    fireEvent.click(fileInput);
    await userEvent.upload(input, file);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Import in progress')).toBeInTheDocument();
  });
}); 