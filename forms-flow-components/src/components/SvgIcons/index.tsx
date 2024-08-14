
export const ChevronIcon = ({ color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
  >
    <path
      d="M12 6.5L8 10.5L4 6.5"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RefreshIcon = ({ color = "currentColor", ...props }) => (
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
export const HamburgerIcon = ({ color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill={color}
    {...props}
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

export const MessageIcon = ({ color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill={color}
    {...props}
  >
    <path
      d="M16 7.00058C15.9999 7.10306 15.9706 7.20326 15.9157 7.28873C15.8608 7.3742 15.7827 7.44117 15.6911 7.48133L1.06208 13.9366C0.933224 13.9935 0.791638 14.0126 0.652908 13.9919C0.514178 13.9712 0.38368 13.9115 0.27578 13.8194C0.167879 13.7272 0.0867575 13.6062 0.0413435 13.4697C-0.00407044 13.3331 -0.0120162 13.1863 0.0183806 13.0454L1.32355 7.00059L0.0183811 0.955753C-0.0122657 0.81471 -0.00447475 0.667691 0.0408943 0.530919C0.0862634 0.394147 0.167447 0.272939 0.275486 0.180669C0.383526 0.0883999 0.514222 0.0286557 0.653152 0.00802981C0.792082 -0.0125961 0.933846 0.00669818 1.0628 0.0637831L15.6904 6.52058C15.782 6.56074 15.8601 6.62771 15.915 6.71318C15.9699 6.79865 15.9992 6.89885 15.9993 7.00132L16 7.00058ZM2.25016 7.52275L1.11739 12.7732L13.0162 7.52275H2.25016ZM13.0162 6.47694L1.11739 1.22645L2.2516 6.47694L13.0162 6.47694Z"
      fill={color}
      {...props}
    />
  </svg>
);
export const PreviewIcon = ({ color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M15.1848 4.81689L4.81583 15.1859"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M14.3872 13.5894L15.1848 4.81557L6.41104 5.61319"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const SwitchIcon = ({ color = "currentColor", ...props }) => (
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

export const AddIcon = ({ color = "currentColor", ...props }) => (
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

export const DuplicateIcon = ({ color = "currentColor", ...props }) => (
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

export const SaveTemplateIcon = ({ color = "currentColor", ...props }) => (
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

export const CloseIcon = ({ color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
  >
    <path
      d="M1.5 1.5L12.5 12.5"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M12.5 1.5L1.5 12.5"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
);

export const ExportIcon = ({ color = "currentColor", ...props }) => (
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

export const ImportIcon = ({ color = "currentColor", ...props }) => (
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
