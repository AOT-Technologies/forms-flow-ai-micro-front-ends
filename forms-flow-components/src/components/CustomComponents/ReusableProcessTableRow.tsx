import React from 'react';
import { useTranslation } from 'react-i18next';
import {CustomButton} from '../CustomComponents/Button';
import { HelperServices } from "@formsflow/service";


interface ProcessTableRowProps {
  item: {
    name: string;
    processKey?: string;
    modified?: string;
    status?: string;
    _id: string;
  };
  gotoEdit: (item: any) => void;
  buttonLabel: string;
}

export const ReusableProcessTableRow: React.FC<ProcessTableRowProps> = ({ item, gotoEdit, buttonLabel }) => {
  const { t } = useTranslation();

  return (
    <tr>
      <td className="w-25 text-ellipsis">
        <span className="ms-4">{item.name}</span>
      </td>
      <td className="w-20 text-ellipsis">
        <span>{item.processKey}</span>
      </td>
      <td className="w-15">{HelperServices?.getLocaldate(item.modified)}</td>
      <td className="w-15">
        <span data-testid={`sub-flow-status-${item._id}`} className="d-flex align-items-center">
          <span className={item.status === 'Published' ? 'status-live' : 'status-draft'}></span>
          {item.status === 'Published' ? t('Live') : t('Draft')}
        </span>
      </td>
      <td className="w-25">
        <span className="d-flex justify-content-end">
          <CustomButton
            variant="secondary"
            size="sm"
            label={t('Edit')}
            ariaLabel={`Edit ${buttonLabel} Button`}
            onClick={() => gotoEdit(item)}
            dataTestid={`Edit ${buttonLabel} Button`}
          />
        </span>
      </td>
    </tr>
  );
};
