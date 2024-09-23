const computedStyle = getComputedStyle(document.documentElement);
const baseColor = computedStyle.getPropertyValue("--ff-base-600");
const grayColor = computedStyle.getPropertyValue("--ff-gray-800");

export const ChevronIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="10"
    viewBox="0 0 16 10"
    fill="none"
  >
    <path
      d="M1.49969 1.74976L8.00028 8.25034L14.5003 1.75034"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const HistoryIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill={color}
    {...props}
  >
    <g clip-path="url(#clip0_1459_2724)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8 3.49996C6.91935 3.50038 5.86793 3.85089 5.00321 4.499C4.13848 5.14711 3.50701 6.05793 3.20336 7.09504C2.89972 8.13215 2.94025 9.23972 3.31889 10.2519C3.69752 11.264 4.39388 12.1262 5.30366 12.7094C6.21344 13.2926 7.28768 13.5653 8.36546 13.4867C9.44325 13.4082 10.4666 12.9825 11.2822 12.2736C12.0977 11.5646 12.6617 10.6105 12.8895 9.55416C13.1174 8.49781 12.9968 7.39607 12.546 6.41396C12.4969 6.29456 12.4959 6.1608 12.5432 6.04069C12.5906 5.92057 12.6825 5.82341 12.7998 5.76953C12.9171 5.71565 13.0507 5.70924 13.1727 5.75163C13.2946 5.79402 13.3954 5.88193 13.454 5.99696C13.995 7.17555 14.1396 8.49769 13.8661 9.76535C13.5926 11.033 12.9157 12.1779 11.9369 13.0286C10.9581 13.8793 9.73004 14.39 8.43664 14.4841C7.14325 14.5783 5.85416 14.2509 4.76247 13.5509C3.67078 12.8509 2.83526 11.8161 2.38106 10.6014C1.92686 9.38673 1.87843 8.05759 2.24303 6.81308C2.60763 5.56856 3.36563 4.47568 4.40348 3.69812C5.44134 2.92056 6.70318 2.50018 8 2.49996V3.49996Z"
        fill={color}
      />
      <path
        d="M8 4.96596V1.03396C8.00002 0.98646 8.01357 0.939945 8.03907 0.899865C8.06457 0.859785 8.10096 0.827799 8.14398 0.807653C8.187 0.787507 8.23487 0.780035 8.28198 0.786112C8.32909 0.792188 8.3735 0.811562 8.41 0.841964L10.77 2.80796C10.89 2.90796 10.89 3.09196 10.77 3.19196L8.41 5.15796C8.3735 5.18837 8.32909 5.20774 8.28198 5.21382C8.23487 5.21989 8.187 5.21242 8.14398 5.19228C8.10096 5.17213 8.06457 5.14014 8.03907 5.10006C8.01357 5.05998 8.00002 5.01347 8 4.96596Z"
        fill={color}
      />
    </g>
    <defs>
      <clipPath id="clip0_1459_2724">
        <rect
          width="16"
          height="16"
          fill={color}
          transform="translate(0 0.5)"
        />
      </clipPath>
    </defs>
  </svg>
);
export const HamburgerIcon = ({ color = baseColor, onClick, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill={color}
    {...props}
    onClick={onClick}
  >
    <path
      d="M0 1C0 0.447715 0.447715 0 1 0H11C11.5523 0 12 0.447715 12 1C12 1.55228 11.5523 2 11 2H1C0.447715 2 0 1.55228 0 1Z"
      fill={color}
      {...props}
    />
    <path
      d="M0 6C0 5.44772 0.447715 5 1 5H11C11.5523 5 12 5.44772 12 6C12 6.55228 11.5523 7 11 7H1C0.447715 7 0 6.55228 0 6Z"
      fill={color}
      {...props}
    />
    <path
      d="M0 11C0 10.4477 0.447715 10 1 10H11C11.5523 10 12 10.4477 12 11C12 11.5523 11.5523 12 11 12H1C0.447715 12 0 11.5523 0 11Z"
      fill={color}
      {...props}
    />
  </svg>
);

export const MessageIcon = ({ color = baseColor, onClick, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill={color}
    {...props}
    onClick={onClick}
  >
    <path
      d="M16 7.00058C15.9999 7.10306 15.9706 7.20326 15.9157 7.28873C15.8608 7.3742 15.7827 7.44117 15.6911 7.48133L1.06208 13.9366C0.933224 13.9935 0.791638 14.0126 0.652908 13.9919C0.514178 13.9712 0.38368 13.9115 0.27578 13.8194C0.167879 13.7272 0.0867575 13.6062 0.0413435 13.4697C-0.00407044 13.3331 -0.0120162 13.1863 0.0183806 13.0454L1.32355 7.00059L0.0183811 0.955753C-0.0122657 0.81471 -0.00447475 0.667691 0.0408943 0.530919C0.0862634 0.394147 0.167447 0.272939 0.275486 0.180669C0.383526 0.0883999 0.514222 0.0286557 0.653152 0.00802981C0.792082 -0.0125961 0.933846 0.00669818 1.0628 0.0637831L15.6904 6.52058C15.782 6.56074 15.8601 6.62771 15.915 6.71318C15.9699 6.79865 15.9992 6.89885 15.9993 7.00132L16 7.00058ZM2.25016 7.52275L1.11739 12.7732L13.0162 7.52275H2.25016ZM13.0162 6.47694L1.11739 1.22645L2.2516 6.47694L13.0162 6.47694Z"
      fill={color}
      {...props}
    />
  </svg>
);
export const PreviewIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="17"
    viewBox="0 0 20 19"
    fill="none"
  >
    <path
      d="M15.1846 4.31689L4.81556 14.6859"
      stroke="#253DF4"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M14.3867 13.0894L15.1843 4.31557L6.41055 5.11319"
      stroke="#253DF4"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const SwitchIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="18"
    viewBox="0 0 20 18"
    fill="none"
  >
    <path
      d="M3.09012 5.95238C4.22399 3.0458 6.93103 1 10.0901 1C13.2492 1 15.9562 3.0458 17.0901 5.95238M17.0901 12.0476C15.9562 14.9542 13.2492 17 10.0901 17C6.93103 17 4.22399 14.9542 3.09012 12.0476M13.683 11.9777L17.7603 10.7539L18.9841 14.8312M6.58723 5.78665L2.59452 7.36523L1.01593 3.37252"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const AddIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M8 1V15"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M1 8L15 8"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const DuplicateIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="18"
    viewBox="0 0 16 18"
    fill="none"
  >
    <path
      d="M5.5 1.5H13.5C14.0523 1.5 14.5 1.94772 14.5 2.5V12.5"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M2.5 6.5H9.5V4.5H2.5V6.5ZM9.5 6.5V15.5H11.5V6.5H9.5ZM9.5 15.5H2.5V17.5H9.5V15.5ZM2.5 15.5V6.5H0.5V15.5H2.5ZM2.5 15.5H2.5H0.5C0.5 16.6046 1.39543 17.5 2.5 17.5V15.5ZM9.5 15.5V17.5C10.6046 17.5 11.5 16.6046 11.5 15.5H9.5ZM9.5 6.5H11.5C11.5 5.39543 10.6046 4.5 9.5 4.5V6.5ZM2.5 4.5C1.39543 4.5 0.5 5.39543 0.5 6.5H2.5V6.5V4.5Z"
      fill={color}
    />
  </svg>
);

export const SaveTemplateIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
  >
    <path
      d="M2 2H12V0H2V2ZM12 2V14H14V2H12ZM12 14H2V16H12V14ZM2 14V2H0V14H2ZM2 14H2H0C0 15.1046 0.89543 16 2 16V14ZM12 14V16C13.1046 16 14 15.1046 14 14H12ZM12 2H14C14 0.895431 13.1046 0 12 0V2ZM2 0C0.89543 0 0 0.895431 0 2H2V2V0Z"
      fill={color}
    />
    <path
      d="M7 5L7 11"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
    />
    <path d="M4 8H10" stroke={color} stroke-width="2" stroke-linecap="round" />
  </svg>
);

export const CloseIcon = ({
  color = grayColor,
  width = 14,
  height = 14,
  onClick,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 14 14"
    fill="none"
    onClick={onClick}
    {...props}
  >
    <path
      d="M1.5 1.5L12.5 12.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12.5 1.5L1.5 12.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const ExportIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="18"
    viewBox="0 0 10 18"
    fill="none"
  >
    <path
      d="M5 1V12.7895M5 12.7895L1 9.42105M5 12.7895L9 9.42105M1 17H9"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const ImportIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="18"
    viewBox="0 0 10 18"
    fill="none"
  >
    <path
      d="M5 17L5 5.21053M5 5.21053L9 8.57895M5 5.21053L1 8.57895M9 1L1 0.999999"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const PencilIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
  >
    <path
      d="M6.53858 3.58705L15.0242 12.0727L16.5 16.5L12.0727 15.0242L3.58705 6.53858M6.53858 3.58705L5.06281 2.11128C4.24777 1.29624 2.92633 1.29624 2.11128 2.11128C1.29624 2.92633 1.29624 4.24777 2.11128 5.06281L3.58705 6.53858M6.53858 3.58705L3.58705 6.53858"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const CurlyBracketsIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="18"
    viewBox="0 0 16 18"
    fill="none"
  >
    <path
      d="M6 1.97852H5C4.44772 1.97852 4 2.42623 4 2.97852V6.52468C4 6.86428 3.82764 7.18068 3.54231 7.36485L1 9.00586L3.5547 10.709C3.8329 10.8945 4 11.2067 4 11.541V14.9785C4 15.5308 4.44772 15.9785 5 15.9785H6"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M10 16.0215L11 16.0215C11.5523 16.0215 12 15.5738 12 15.0215L12 11.4753C12 11.1357 12.1724 10.8193 12.4577 10.6351L15 8.99414L12.4453 7.29101C12.1671 7.10554 12 6.79331 12 6.45896L12 3.02148C12 2.4692 11.5523 2.02148 11 2.02148L10 2.02148"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const AngleRightIcon = ({ color = baseColor, onClick, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="15"
    viewBox="0 0 10 15"
    fill="none"
    onClick={onClick}
  >
    <path
      d="M1.74951 14.0005L8.2501 7.4999L1.75009 0.999901"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const UploadIcon = ({ color = baseColor, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M1 19.7998C1.26522 19.7998 1.51957 19.9052 1.70711 20.0927C1.89464 20.2803 2 20.5346 2 20.7998V25.7998C2 26.3303 2.21071 26.839 2.58579 27.214C2.96086 27.5891 3.46957 27.7998 4 27.7998H28C28.5304 27.7998 29.0391 27.5891 29.4142 27.214C29.7893 26.839 30 26.3303 30 25.7998V20.7998C30 20.5346 30.1054 20.2803 30.2929 20.0927C30.4804 19.9052 30.7348 19.7998 31 19.7998C31.2652 19.7998 31.5196 19.9052 31.7071 20.0927C31.8946 20.2803 32 20.5346 32 20.7998V25.7998C32 26.8607 31.5786 27.8781 30.8284 28.6283C30.0783 29.3784 29.0609 29.7998 28 29.7998H4C2.93913 29.7998 1.92172 29.3784 1.17157 28.6283C0.421427 27.8781 0 26.8607 0 25.7998V20.7998C0 20.5346 0.105357 20.2803 0.292893 20.0927C0.48043 19.9052 0.734784 19.7998 1 19.7998Z"
      fill={color}
    />
    <path
      d="M15.292 2.29183C15.3849 2.19871 15.4952 2.12482 15.6167 2.07441C15.7382 2.024 15.8685 1.99805 16 1.99805C16.1315 1.99805 16.2618 2.024 16.3833 2.07441C16.5048 2.12482 16.6151 2.19871 16.708 2.29183L22.708 8.29183C22.8958 8.47961 23.0013 8.73428 23.0013 8.99983C23.0013 9.26539 22.8958 9.52006 22.708 9.70783C22.5202 9.89561 22.2656 10.0011 22 10.0011C21.7344 10.0011 21.4798 9.89561 21.292 9.70783L17 5.41383V22.9998C17 23.2651 16.8946 23.5194 16.7071 23.7069C16.5196 23.8945 16.2652 23.9998 16 23.9998C15.7348 23.9998 15.4804 23.8945 15.2929 23.7069C15.1054 23.5194 15 23.2651 15 22.9998V5.41383L10.708 9.70783C10.615 9.80081 10.5046 9.87456 10.3832 9.92488C10.2617 9.9752 10.1315 10.0011 10 10.0011C9.86851 10.0011 9.73831 9.9752 9.61683 9.92488C9.49535 9.87456 9.38498 9.80081 9.292 9.70783C9.19902 9.61486 9.12527 9.50448 9.07495 9.383C9.02464 9.26152 8.99874 9.13132 8.99874 8.99983C8.99874 8.86835 9.02464 8.73815 9.07495 8.61667C9.12527 8.49519 9.19902 8.38481 9.292 8.29183L15.292 2.29183Z"
      fill={color}
    />
  </svg>
);

export const BackToPrevIcon = ({ color = baseColor, onClick, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="33"
    viewBox="0 0 32 33"
    fill="none"
    onClick={onClick}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M29.9998 16.5C29.9998 16.2348 29.8945 15.9805 29.7069 15.7929C29.5194 15.6054 29.2651 15.5 28.9998 15.5H5.41383L11.7078 9.20804C11.8008 9.11507 11.8746 9.00469 11.9249 8.88321C11.9752 8.76173 12.0011 8.63153 12.0011 8.50004C12.0011 8.36855 11.9752 8.23835 11.9249 8.11688C11.8746 7.9954 11.8008 7.88502 11.7078 7.79204C11.6149 7.69907 11.5045 7.62531 11.383 7.575C11.2615 7.52468 11.1313 7.49878 10.9998 7.49878C10.8683 7.49878 10.7381 7.52468 10.6167 7.575C10.4952 7.62531 10.3848 7.69907 10.2918 7.79204L2.29183 15.792C2.19871 15.8849 2.12482 15.9953 2.07441 16.1168C2.024 16.2383 1.99805 16.3685 1.99805 16.5C1.99805 16.6316 2.024 16.7618 2.07441 16.8833C2.12482 17.0048 2.19871 17.1152 2.29183 17.208L10.2918 25.208C10.3848 25.301 10.4952 25.3748 10.6167 25.4251C10.7381 25.4754 10.8683 25.5013 10.9998 25.5013C11.1313 25.5013 11.2615 25.4754 11.383 25.4251C11.5045 25.3748 11.6149 25.301 11.7078 25.208C11.8008 25.1151 11.8746 25.0047 11.9249 24.8832C11.9752 24.7617 12.0011 24.6315 12.0011 24.5C12.0011 24.3686 11.9752 24.2384 11.9249 24.1169C11.8746 23.9954 11.8008 23.885 11.7078 23.792L5.41383 17.5H28.9998C29.2651 17.5 29.5194 17.3947 29.7069 17.2071C29.8945 17.0196 29.9998 16.7653 29.9998 16.5Z"
      fill="white"
    />
  </svg>
);
