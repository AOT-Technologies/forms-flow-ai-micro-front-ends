import React from 'react';

interface NoDataFoundProps {
  message: string;
}

export const NoDataFound: React.FC<NoDataFoundProps> = ({ message }) => {
  return (
    <tbody className="no-data-body">
      <tr>
        <td colSpan={2} className="no-data-container">
          <span className="no-data-text" data-testid="no-data-found">
            {message}
          </span>
        </td>
      </tr>
    </tbody>
  );
};
