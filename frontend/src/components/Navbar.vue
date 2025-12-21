<script setup>
defineProps({
    isEditMode: Boolean
})
defineEmits(['toggle-edit'])
</script>

<template>
  <nav class="navbar glass">
    <div class="nav-content">
      <div class="logo">
        <span class="logo-icon">✨</span>
        <span class="logo-text">Portal</span>
      </div>
      <div class="nav-links">
        <button @click="$emit('toggle-edit')" class="nav-item btn-link" :class="{ 'active': isEditMode }">
            {{ isEditMode ? 'Done' : 'Settings' }}
        </button>
        <a href="#" class="nav-item">Documentation</a>
        <a href="#" class="nav-item">Support</a>
        <div class="user-profile">
            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.btn-link {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0.5rem 1rem;
    border-radius: 6px;
}

.btn-link.active {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-content {
  width: 100%;
  max-width: 1400px;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: -0.025em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-item {
  text-decoration: none;
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.nav-item:hover {
  opacity: 1;
}

.user-profile img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
}
</style>
