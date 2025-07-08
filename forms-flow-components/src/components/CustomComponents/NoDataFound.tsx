import React from 'react';

interface NoDataFoundProps {
  message: string;
}

export const NoDataFound: React.FC<NoDataFoundProps> = ({ message }) => {
  return (
    <p className="empty-message" data-testid="no-data-found">
      {message}
    </p>
  );
};
