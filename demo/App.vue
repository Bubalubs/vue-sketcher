<template>
    <div>
        <h1 style="text-align: center; font-family: Arial, Helvetica, sans-serif; margin: 20px 0">
            Vue Sketcher Demo
        </h1>

        <a
            href="https://github.com/Bubalubs/vue-sketcher"
            target="_blank"
            style="display: block; text-align: center; margin: 20px 0"
            title="GitHub Repository"
        >
            <img
                src="https://img.shields.io/github/stars/Bubalubs/vue-sketcher?style=social"
                alt="GitHub stars"
            />
        </a>

        <VueSketcher :canvasWidth="800" :canvasHeight="500" />
    </div>
</template>

<script setup lang="ts">
import VueSketcher from '../src/components/VueSketcher.vue';
</script>
