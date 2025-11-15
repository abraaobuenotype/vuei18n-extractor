<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Dashboard messages
const title = t("Dashboard");
const welcome = t("Welcome to your dashboard");
const overview = t("Overview");
const stats = t("Statistics");

// Stats with variables
const totalUsers = t("Total users: {count}");
const activeNow = t("{count, plural, =0 {No users} one {# user} other {# users}} active now");
const lastUpdated = t("Last updated: {date, date, short} at {time, time, short}");
</script>

<template>
  <div>
    <h1>{{ t("Dashboard") }}</h1>
    <p>{{ t("Welcome to your dashboard") }}</p>
    
    <div class="stats">
      <h2>{{ t("Overview") }}</h2>
      <div>{{ t("Statistics") }}</div>
    </div>
  </div>
</template>
