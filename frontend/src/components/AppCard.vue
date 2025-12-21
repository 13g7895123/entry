<script setup>
import { ref } from 'vue'

defineProps({
  title: String,
  icon: String,
  url: String,
  description: String
})

const cardRef = ref(null)
const tiltStyle = ref({})

const handleMouseMove = (e) => {
    if (!cardRef.value) return
    const rect = cardRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -10 // Max -10 to 10 deg
    const rotateY = ((x - centerX) / centerX) * 10 // Max -10 to 10 deg

    tiltStyle.value = {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    }
}

const handleMouseLeave = () => {
    tiltStyle.value = {
        transform: 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
    }
}
</script>

<template>
  <a 
    :href="url" 
    class="app-card glass" 
    ref="cardRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :style="tiltStyle"
  >
    <div class="icon-wrapper">
      <img :src="icon" :alt="title" />
    </div>
    <div class="content">
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="glow"></div>
  </a>
</template>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 16px;
  text-decoration: none;
  color: var(--text-color);
  transition: transform 0.1s ease-out, box-shadow 0.3s ease; /* Fast transform for touch */
  position: relative;
  overflow: hidden;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255, 255, 255, 0.03);
}

.app-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

/* Holographic Border Glow */
.app-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 16px;
    padding: 1.5px; /* Border width */
    background: radial-gradient(
        300px circle at var(--mouse-x) var(--mouse-y), 
        rgba(56, 189, 248, 0.6), 
        transparent 40%
    );
    -webkit-mask: 
        linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.5;
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  padding: 5px;
}

.icon-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.content p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, var(--primary-glow) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.app-card:hover .glow {
  opacity: 0.2;
}
</style>
