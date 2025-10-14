// compactViewHelper.js
let styleElement = null;

export const applyCompactFormStyles = () => {
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "single-spa-style-overrides";
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = `
    .formio-form, .form-builder {
      transform: scale(0.95);
      transform-origin: top;
      zoom: 0.9 !important;
    }
    .formio-form .form-group, .formio-builder-form .form-group {
      margin-bottom: 0 !important;
    }
    .formio-component {
      padding-top: .25rem !important;
    }
    .formio-form, .formio-wizard-nav-container.list-inline {
      padding-top: 0.25rem !important;
    }
    .col-form-label {
      padding-bottom: 0 !important;
    }
    .choices__item.choices__item--selectable{
      overflow: visible !important;
    }
  `;
};


