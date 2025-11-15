<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Button labels
const save = t("Save");
const cancel = t("Cancel");
const delete_ = t("Delete");
const edit = t("Edit");
const close = t("Close");

// Confirmation messages
const areYouSure = t("Are you sure?");
const confirmDelete = t("Do you really want to delete {name}?");
const cannotUndo = t("This action cannot be undone");
</script>

<template>
  <div>
    <button>{{ t("Save") }}</button>
    <button>{{ t("Cancel") }}</button>
    <button>{{ t("Delete") }}</button>
    <button>{{ t("Edit") }}</button>
    <button>{{ t("Close") }}</button>
  </div>
</template>
