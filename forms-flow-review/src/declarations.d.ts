declare module "*.html" {
  const rawHtmlFile: string;
  export = rawHtmlFile;
}

declare module "*.bmp" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "@formsflow/service" {
  export const {
    KeycloakService,
    RequestService,
    StorageService,
    i18nService,
    StyleServices,
    HelperServices,
    formioResourceBundle,
    RESOURCE_BUNDLES_DATA,  
  }: any;
}

declare module "@formsflow/components" {
  export const {
    TableFooter,
    SortableHeader,
    FilterSortActions,
    CustomButton,
    ButtonDropdown,
    DateRangePicker,
    CloseIcon,
    PencilIcon,
    SaveIcon,
    InputDropdown,
    CustomTabs,
    FormInput,
    CustomInfo,
    DragandDropSort,
    CustomSearch,
    AddIcon,
    AssignUser,
    RefreshIcon,
    DeleteIcon,
    UpdateIcon,
    ConfirmModal,
    ReusableResizableTable,
    useSuccessCountdown
    BackToPrevIcon,
  }: any;
}

