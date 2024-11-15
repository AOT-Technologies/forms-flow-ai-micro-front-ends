import React from 'react';
import { useTranslation } from 'react-i18next';

export const NoDataFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <tbody className="no-data-body">
      <tr>
        <td colSpan={2} className="no-data-container">
          <span className="no-data-text">{t("Nothing is found. Please try again.")}</span>
        </td>
      </tr>
    </tbody>
  );
};
