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
  export const { KeycloakService, RequestService, StorageService, i18nService, HelperServices }: any;
}

declare module "@formsflow/components" {
  export const {
    DownloadPDFButton,
    BackToPrevIcon,
    ReusableResizableTable,
    TableFooter,
    CustomButton,
    SortableHeader,
    FormSubmissionHistoryModal,
    SubmissionHistoryWithViewButton,
  }: any;
}
declare module "@formsflow/components" {
  export const {
    CollapsibleSearch
  }: any;
}