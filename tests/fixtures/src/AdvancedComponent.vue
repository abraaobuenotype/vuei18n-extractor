<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Simple translation
const greeting = t("Hello World");

// With variables
const welcome = t("Welcome {name}!");

// With pluralization
const items = t("{count, plural, one {# item} other {# items}}");

// With date
const today = t("Today is {date, date, long}");

// Complex message
const complex = t("Hello {name}, you have {count, plural, zero {no messages} one {# message} other {# messages}} from {date, date, short}");
</script>

<template>
  <div>
    <h1>{{ t("App Title") }}</h1>
    <p>{{ t("Welcome to our app, {username}!") }}</p>
    <p>{{ t("You have {notifications, plural, =0 {no notifications} one {# notification} other {# notifications}}") }}</p>
  </div>
</template>
