import React from 'react';
import { SHOW_PREMIUM_ICON} from '../../constants/constants'
import { StarPremiumIcon } from '../SvgIcons/index'

export const ShowPremiumIcons: React.FC = () => {
  return (
    <>
    {SHOW_PREMIUM_ICON && <StarPremiumIcon />}
    </>
  );
};
