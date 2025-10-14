import React from 'react';

interface NoDataFoundProps {
  message: string;
}

export const NoDataFound: React.FC<NoDataFoundProps> = ({ message }) => {
  return (
    <tbody className="table-empty">
      <p className="empty-message" data-testid="no-data-found">
        {message}
      </p>
    </tbody>
  );
};
