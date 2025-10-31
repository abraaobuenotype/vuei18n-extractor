<script setup>
const { t } = useI18n();

const greeting = t("Hello World");
const farewell = t("Goodbye");
</script>

<template>
  <div>
    <h1>{{ t("Welcome to the app") }}</h1>
    <p>{{ t("This is a test component") }}</p>
    <button>{{ t("Click me") }}</button>
  </div>
</template>
