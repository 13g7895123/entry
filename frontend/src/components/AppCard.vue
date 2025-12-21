<script setup>
defineProps({
  title: String,
  icon: String,
  url: String,
  description: String
})
</script>

<template>
  <a :href="url" class="app-card glass">
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
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.app-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
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
