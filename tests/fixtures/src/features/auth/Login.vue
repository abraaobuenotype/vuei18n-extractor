<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Auth-related messages
const title = t("Sign in to your account");
const subtitle = t("Enter your credentials to continue");
const emailLabel = t("Email address");
const passwordLabel = t("Password");
const submitButton = t("Sign in");
const forgotPassword = t("Forgot your password?");
const noAccount = t("Don't have an account?");
const signUpLink = t("Sign up here");

// Validation messages
const emailRequired = t("Email is required");
const passwordRequired = t("Password is required");
const invalidCredentials = t("Invalid email or password");

// With variables
const welcomeBack = t("Welcome back, {name}!");
const loginAttempts = t("You have {attempts, plural, =0 {no attempts} one {# attempt} other {# attempts}} remaining");
</script>

<template>
  <div class="auth-container">
    <h1>{{ t("Sign in to your account") }}</h1>
    <p>{{ t("Enter your credentials to continue") }}</p>
    
    <form>
      <label>{{ t("Email address") }}</label>
      <input type="email" />
      
      <label>{{ t("Password") }}</label>
      <input type="password" />
      
      <button>{{ t("Sign in") }}</button>
    </form>
    
    <a href="#">{{ t("Forgot your password?") }}</a>
    <p>
      {{ t("Don't have an account?") }}
      <a href="#">{{ t("Sign up here") }}</a>
    </p>
  </div>
</template>
