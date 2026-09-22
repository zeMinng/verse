<script setup>
import { computed } from 'vue'
import Footer from '@components/oss/Footer.vue'
// import Spacer from '@components/shared/Spacer.vue'
import Hero from './Hero.vue'

</script>

<template>
  <Hero />
  <Footer
    heading="Verse"
    subheading="书写所思，辑录篇章 | Document thoughts and build my knowledge verse."
    button-text="翻阅笔记"
    button-link="/web/vue3/basic/"
  />
</template>