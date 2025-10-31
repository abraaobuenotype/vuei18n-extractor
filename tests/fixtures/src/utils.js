import { useI18n } from "vue-i18n";

const { t } = useI18n();

export function getMessage() {
  return t("Test message");
}

export const title = t("Page title");
export const description = t("Page description");
