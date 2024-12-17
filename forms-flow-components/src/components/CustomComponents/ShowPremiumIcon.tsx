// ShowPremiumIcons.tsx
import React from 'react';
import { SHOW_PREMIUM_ICON } from '../../constants/constants';
import { StarPremiumIcon } from '../SvgIcons/index';

interface ShowPremiumIconsProps {
  color: string;
}

export const ShowPremiumIcons: React.FC<ShowPremiumIconsProps> = ({ color }) => {
  return (
    <>
      {SHOW_PREMIUM_ICON && <StarPremiumIcon color={color} />} 
    </>
  );
};
