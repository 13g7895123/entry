<script setup>
import Navbar from './components/Navbar.vue'
import AppCard from './components/AppCard.vue'
import { ref, onMounted } from 'vue'

const apps = ref([])
const isEditMode = ref(false)
const showEditDialog = ref(false)
const editingApp = ref(null)

// Load apps
const fetchApps = async () => {
  try {
    const response = await fetch('http://localhost:8001/api/apps')
    if (response.ok) {
        apps.value = await response.json()
    }
  } catch (e) {
    console.error("Failed to fetch apps", e)
  }
}

onMounted(fetchApps)

const openEditDialog = (app) => {
  if (isEditMode.value) {
    editingApp.value = { ...app } // Clone
    showEditDialog.value = true
  }
}

const saveApp = async () => {
    try {
        const response = await fetch(`http://localhost:8001/api/apps/${editingApp.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingApp.value)
        })
        if (response.ok) {
            await fetchApps()
            showEditDialog.value = false
        }
    } catch (e) {
        console.error(e)
    }
}
</script>

<template>
  <Navbar :is-edit-mode="isEditMode" @toggle-edit="isEditMode = !isEditMode" />
  
  <main class="main-container">
    <div class="grid-container">
      <div 
        v-for="app in apps" 
        :key="app.id" 
        class="card-wrapper" 
        @click.prevent="openEditDialog(app)"
        :class="{ 'editing': isEditMode }"
      >
        <AppCard 
            :title="app.title"
            :icon="app.icon_url"
            :url="isEditMode ? '#' : app.link_url"
            :description="app.description"
        />
        <div v-if="isEditMode" class="edit-overlay">
            <span>✏️ Edit</span>
        </div>
      </div>
    </div>
  </main>

  <!-- Edit Dialog -->
  <div v-if="showEditDialog" class="dialog-overlay" @click.self="showEditDialog = false">
    <div class="dialog glass-panel">
        <h2>Edit Application</h2>
        
        <div class="form-group">
            <label>Title</label>
            <input v-model="editingApp.title" type="text">
        </div>

        <div class="form-group">
            <label>Icon URL</label>
            <input v-model="editingApp.icon_url" type="text">
        </div>

        <div class="form-group">
            <label>Link URL</label>
            <input v-model="editingApp.link_url" type="text">
        </div>
        
        <div class="form-group">
            <label>Description</label>
            <input v-model="editingApp.description" type="text">
        </div>

        <div class="dialog-actions">
            <button @click="showEditDialog = false" class="btn-cancel">Cancel</button>
            <button @click="saveApp" class="btn-save">Save</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  margin-top: 60px; /* Navbar height */
}

.card-wrapper {
    position: relative;
    cursor: default;
}

.card-wrapper.editing {
    cursor: pointer;
}

.card-wrapper.editing:hover .edit-overlay {
    opacity: 1;
}

.edit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    border-radius: 16px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none; /* Let clicks pass through if needed, but here we capture on parent */
}

/* Dialog Styles */
.dialog-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(4px);
}

.dialog {
    padding: 2rem;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    color: white;
}

.form-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group input {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(0,0,0,0.3);
    color: white;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: bold;
}

.btn-save {
    background: #38bdf8;
    color: #0f172a;
}

.btn-cancel {
    background: transparent;
    color: white;
    border: 1px solid rgba(255,255,255,0.2);
}


<style scoped>
.main-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  margin-top: 60px; /* Navbar height */
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  padding: 1rem;
}

@media (max-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
