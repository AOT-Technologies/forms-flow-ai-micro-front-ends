import React from 'react';
import { useTranslation } from 'react-i18next';

export const NoDataFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <tbody className="no-data-body">
      <tr>
        <td colSpan={2} className="no-data-container">
          <span className="no-data-text" data-testid="no-data-found">{t("Nothing is found based on your search query. Please try again.")}</span>
        </td>
      </tr>
    </tbody>
  );
};
