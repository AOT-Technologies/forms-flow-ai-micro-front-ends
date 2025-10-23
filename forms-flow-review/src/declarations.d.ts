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
    fetchAndStoreFormioRoles
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
    ConnectIcon,
    CheckboxCheckedIcon,
    CheckboxUncheckedIcon,
    FormVariableIcon,
    SharedWithOthersIcon,
    SharedWithMeIcon,
    AssignUser,
    UserSelect,
    RefreshIcon,
    DeleteIcon,
    UpdateIcon,
    ConfirmModal,
    useSuccessCountdown,
    ReusableResizableTable,
    BackToPrevIcon,
    StepperComponent,
    PromptModal,
    CustomUrl,
    Switch,
    SelectDropdown,
    V8CustomButton,
    ReusableTable
  }: any;
}

