<template>
    <div>
        <h1 style="text-align: center; font-family: Arial, Helvetica, sans-serif; margin: 20px 0">
            Vue Sketcher Demo
        </h1>

        <VueSketcher :canvasWidth="800" :canvasHeight="500" />
    </div>
</template>

<script setup lang="ts">
import VueSketcher from '../src/components/VueSketcher.vue';
</script>
