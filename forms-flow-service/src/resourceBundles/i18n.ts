import { createInstance, Resource } from "i18next"; 
import { RESOURCE_BUNDLES_ZH } from "./zh/resourceBundles";
import { RESOURCE_BUNDLES_EN } from "./en/resourceBundles";
import { RESOURCE_BUNDLES_FR } from "./fr/resourceBundles";
import { RESOURCE_BUNDLES_PT } from "./pt/resourceBundles";
import { RESOURCE_BUNDLES_BG } from "./bg/resourceBundles";
import { RESOURCE_BUNDLES_DE } from "./de/resourceBundles";
import { RESOURCE_BUNDLES_ES } from "./es/resourceBundles";
interface CustomResourceBundle {
  [key: string]: Resource;
}

class I18nManager {
  private i18nInstance: any;
  constructor() {
    const resources: CustomResourceBundle = {
      en: {
        translation: RESOURCE_BUNDLES_EN,
      },
      "zh-CN": {
        translation: RESOURCE_BUNDLES_ZH,
      },
      pt: {
        translation: RESOURCE_BUNDLES_PT,
      },
      fr: {
        translation: RESOURCE_BUNDLES_FR,
      },
      bg: {
        translation: RESOURCE_BUNDLES_BG,
      },
      de: {
        translation: RESOURCE_BUNDLES_DE,
      },
      es: {
        translation: RESOURCE_BUNDLES_ES,
      },
    };
    
    this.i18nInstance = createInstance({
      resources,
    }, (err: Error, t: any) => {
      if (err) {
        console.error(err);
      } else {
        this.checkCustomResourceBundleAndUpdate();
      }
    });
  }

  private async checkCustomResourceBundleAndUpdate() {
    const envValue: any = (window as any)._env_;
    if (envValue.REACT_APP_CUSTOM_RESOURCE_BUNDLE_URL) {
      try {
        const response = await fetch(envValue.REACT_APP_CUSTOM_RESOURCE_BUNDLE_URL);
        const data = await response.json();

        Object.keys(data).forEach((key) => {
          this.updateResourceBundle(key, data[key]);
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  public updateResourceBundle(language: any, newTranslations: any) {
    this.i18nInstance.addResourceBundle(
      language,
      "translation",
      newTranslations,
      true,
      true
    );
  }

  public getInstance() {
    return this.i18nInstance;
  }
}

const i18nManager = new I18nManager();
export default i18nManager.getInstance();

