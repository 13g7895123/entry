<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()


const apps = ref([])
const showEditDialog = ref(false)
const editingApp = ref(null)
const activeTab = ref('apps') // 'apps', 'account', or 'notifications'

const getHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}

const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
}

const checkAuth = (response) => {
    if (response.status === 401) {
        handleLogout()
        return false
    }
    return true
}


const fetchApps = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/apps`)
        if (checkAuth(response)) {
            apps.value = await response.json()
        }
    } catch (e) {

        console.error("Failed to fetch apps", e)
    }
}

const openEditDialog = (app) => {
    editingApp.value = { ...app }
    showEditDialog.value = true
}

const openCreateDialog = () => {
    editingApp.value = {
        title: '',
        icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=new',
        link_url: 'http://',
        description: ''
    }
    showEditDialog.value = true
}

const showConfirm = ref(false)
const itemToDelete = ref(null)

const requestDelete = (id) => {
    itemToDelete.value = id
    showConfirm.value = true
}

const executeDelete = async () => {
    if (!itemToDelete.value) return
    
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/apps/${itemToDelete.value}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        if (checkAuth(response)) {
            await fetchApps()
            window.sysNotify('Node successfully purged from database.', 'success')
        }
    } catch (e) {
        window.sysNotify('FATAL_ERROR: Node purge protocol failed.', 'error')
    } finally {
        showConfirm.value = false
        itemToDelete.value = null
    }
}

const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        })

        if (checkAuth(response)) {
            const data = await response.json()
            if (editingApp.value) {
                editingApp.value.icon_url = data.url
            }
        }
    } catch (e) {
        console.error("Upload error", e)
    }
}

const saveApp = async () => {
    const isEditing = !!editingApp.value.id
    const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/api/apps/${editingApp.value.id}`
        : `${import.meta.env.VITE_API_URL}/api/apps`
    
    try {
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(editingApp.value)
        })
        if (checkAuth(response)) {
            await fetchApps()
            showEditDialog.value = false
            window.sysNotify(`Protocol ${isEditing ? 'UPDATE' : 'INIT'} complete: Database synchronized.`, 'success')
        }
    } catch (e) {
        window.sysNotify('FATAL_EXCEPTION: Resource synchronization failed.', 'error')
    }
}

const profile = ref({
    username: 'admin',
    password: ''
})
const profileLoading = ref(false)
const profileMessage = ref({ text: '', type: '' })

const updateProfile = async () => {
    profileLoading.value = true
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(profile.value)
        })
        if (checkAuth(response)) {
            window.sysNotify('Security credentials updated. Re-authentication required.', 'success')
            setTimeout(() => {
                handleLogout()
            }, 2000)
        } else {
            window.sysNotify('ACCESS_DENIED: Profile update failed.', 'error')
        }
    } catch (e) {
        window.sysNotify('NETWORK_ERROR: Security terminal connection lost.', 'error')
    } finally {
        profileLoading.value = false
    }
}

// ===== LINE Bot 通知管理 =====
const lineBots = ref([])
const showLineBotDialog = ref(false)
const editingLineBot = ref(null)
const showLineBotConfirm = ref(false)
const lineBotToDelete = ref(null)
const testingLineBot = ref(null)
const testMessage = ref('這是一則測試通知訊息 🔔')
const showTestDialog = ref(false)

const fetchLineBots = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/linebot-configs`, {
            headers: getHeaders()
        })
        if (checkAuth(response)) {
            lineBots.value = await response.json()
        }
    } catch (e) {
        console.error("Failed to fetch LINE Bot configs", e)
    }
}

const openLineBotCreateDialog = () => {
    editingLineBot.value = {
        name: '',
        channel_access_token: '',
        channel_secret: '',
        user_id: '',
        enabled: true,
        description: ''
    }
    showLineBotDialog.value = true
}

const openLineBotEditDialog = (bot) => {
    editingLineBot.value = { ...bot }
    showLineBotDialog.value = true
}

const saveLineBot = async () => {
    const isEditing = !!editingLineBot.value.id
    const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/api/linebot-configs/${editingLineBot.value.id}`
        : `${import.meta.env.VITE_API_URL}/api/linebot-configs`

    try {
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(editingLineBot.value)
        })
        if (checkAuth(response)) {
            await fetchLineBots()
            showLineBotDialog.value = false
            window.sysNotify(`LINE_BOT ${isEditing ? 'UPDATE' : 'INIT'} complete: Configuration synchronized.`, 'success')
        }
    } catch (e) {
        window.sysNotify('FATAL_EXCEPTION: LINE Bot configuration failed.', 'error')
    }
}

const requestLineBotDelete = (id) => {
    lineBotToDelete.value = id
    showLineBotConfirm.value = true
}

const executeLineBotDelete = async () => {
    if (!lineBotToDelete.value) return

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/linebot-configs/${lineBotToDelete.value}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        if (checkAuth(response)) {
            await fetchLineBots()
            window.sysNotify('LINE Bot configuration purged from database.', 'success')
        }
    } catch (e) {
        window.sysNotify('FATAL_ERROR: LINE Bot purge protocol failed.', 'error')
    } finally {
        showLineBotConfirm.value = false
        lineBotToDelete.value = null
    }
}

const openTestDialog = (bot) => {
    testingLineBot.value = bot
    testMessage.value = '這是一則測試通知訊息 🔔'
    showTestDialog.value = true
}

const sendTestMessage = async () => {
    if (!testingLineBot.value) return

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/linebot-configs/${testingLineBot.value.id}/test`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ message: testMessage.value })
        })
        const result = await response.json()
        if (response.ok) {
            window.sysNotify('TEST_MESSAGE sent successfully to LINE Bot.', 'success')
            showTestDialog.value = false
        } else {
            window.sysNotify(`TEST_FAILED: ${result.detail || result.message}`, 'error')
        }
    } catch (e) {
        window.sysNotify('NETWORK_ERROR: Test message transmission failed.', 'error')
    }
}

const toggleLineBotStatus = async (bot) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/linebot-configs/${bot.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ enabled: !bot.enabled })
        })
        if (checkAuth(response)) {
            await fetchLineBots()
            window.sysNotify(`LINE Bot ${!bot.enabled ? 'ENABLED' : 'DISABLED'} successfully.`, 'success')
        }
    } catch (e) {
        window.sysNotify('FATAL_ERROR: Status toggle failed.', 'error')
    }
}

// 當切換到通知頁籤時載入資料
watch(activeTab, (newTab) => {
    if (newTab === 'notifications') {
        fetchLineBots()
    }
})

onMounted(fetchApps)
</script>

<template>
    <div class="admin-layout">
        <!-- Sidebar Navigation (Control Side-Console) -->
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <span class="status-pulse"></span>
                <h2>CONTROL_CONSOLE</h2>
            </div>
            
            <nav class="sidebar-nav">
                <button 
                    :class="['nav-item', { active: activeTab === 'apps' }]" 
                    @click="activeTab = 'apps'"
                >
                    <span class="nav-code">01</span>
                    <span class="nav-label">DATABASE_MONITOR</span>
                </button>
                <button 
                    :class="['nav-item', { active: activeTab === 'account' }]" 
                    @click="activeTab = 'account'"
                >
                    <span class="nav-code">02</span>
                    <span class="nav-label">SECURITY_CONFIG</span>
                </button>
                <button 
                    :class="['nav-item', { active: activeTab === 'notifications' }]" 
                    @click="activeTab = 'notifications'"
                >
                    <span class="nav-code">03</span>
                    <span class="nav-label">NOTIFY_MANAGEMENT</span>
                </button>
            </nav>

            <div class="identity-block">
                <div class="header-small">OPERATOR_ID</div>
                <div class="op-name">ADMIN_PROX_01</div>
                <div class="op-status">STATUS: AUTHENTICATED</div>
            </div>

            <div class="sidebar-footer">
                <div class="sys-load">
                    <span>LOAD: </span>
                    <div class="load-bar"><div class="fill" style="width: 24%"></div></div>
                </div>
            </div>
        </aside>

        <!-- Main Content Area (Central Monitor) -->
        <main class="admin-content">
            <!-- Terminal Brackets -->
            <div class="terminal-corner t-l"></div>
            <div class="terminal-corner t-r"></div>
            <div class="terminal-corner b-l"></div>
            <div class="terminal-corner b-r"></div>

            <div class="bg-log">SYSTEM_TERMINAL_OUTPUT_ACTIVE_MONITORING_SECURE_PORTAL_v2.0</div>

            <transition name="fade-slide" mode="out-in">
                <!-- Data Monitor Section -->
                <div v-if="activeTab === 'apps'" key="apps" class="content-section">
                    <div class="section-banner">
                        <div class="banner-title">
                            <h1>DATABASE_MANAGEMENT</h1>
                            <p>LOCAL_STORAGE_SYNC: ACTIVE</p>
                        </div>
                        <button class="btn-add-resource" @click="openCreateDialog">
                            <span class="plus">+</span> INITIALIZE_NEW_NODE
                        </button>
                    </div>

                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>SEC_ID</th>
                                    <th>NODE_ICON</th>
                                    <th>IDENTIFIER</th>
                                    <th>ACCESS_PATH</th>
                                    <th>METADATA_DESCRIPTION</th>
                                    <th>EXECUTION_CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="app in apps" :key="app.id">
                                    <td class="code-font">#{{ app.id.toString().padStart(3, '0') }}</td>
                                    <td>
                                        <div class="icon-frame">
                                            <img :src="app.icon_url" class="table-icon" />
                                        </div>
                                    </td>
                                    <td class="bold-font">{{ app.title }}</td>
                                    <td class="code-font url-text">{{ app.link_url }}</td>
                                    <td class="table-desc">{{ app.description }}</td>
                                    <td>
                                        <div class="row-actions">
                                            <button class="btn-cmd" @click="openEditDialog(app)">MODIFY</button>
                                            <button class="btn-cmd-danger" @click="requestDelete(app.id)">DROP</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Security Section -->
                <div v-else-if="activeTab === 'account'" key="account" class="content-section">
                    <div class="section-banner">
                        <div class="banner-title">
                            <h2>SECURITY_OVERRIDE</h2>
                            <p>LAST_ACCESS: {{ new Date().toLocaleTimeString() }}</p>
                        </div>
                    </div>
                    
                    <div class="security-console">
                        <div class="console-box">
                            <div class="box-header">
                                <div class="user-avatar-frame">
                                    <div class="avatar-hex">
                                        <div class="avatar-inner">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <path d="M12 11c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <span class="clearance-badge">ACCESS_LEVEL: 05</span>
                                <div class="protocol-label">CREDENTIAL_MODIFICATION_PROTOCOL</div>
                            </div>
                            <div class="form-grid">
                                <div class="field-item">
                                    <label>IDENTIFIER_NAME</label>
                                    <div class="cyber-input">
                                        <input v-model="profile.username" type="text" placeholder="NEW_ID">
                                        <div class="input-glow"></div>
                                    </div>
                                </div>
                                <div class="field-item">
                                    <label>ENCRYPTION_KEY</label>
                                    <div class="cyber-input">
                                        <input v-model="profile.password" type="password" placeholder="NEW_PASSWORD">
                                        <div class="input-glow"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="console-actions">
                                <button @click="updateProfile" :disabled="profileLoading" class="btn-override">
                                    <span class="scanner"></span>
                                    {{ profileLoading ? 'PROCESSING...' : 'EXECUTE_OVERRIDE' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notifications Section -->
                <div v-else-if="activeTab === 'notifications'" key="notifications" class="content-section">
                    <div class="section-banner">
                        <div class="banner-title">
                            <h1>NOTIFY_MANAGEMENT</h1>
                            <p>LINE_BOT_INTEGRATION: ACTIVE</p>
                        </div>
                        <button class="btn-add-resource" @click="openLineBotCreateDialog">
                            <span class="plus">+</span> ADD_LINE_BOT
                        </button>
                    </div>

                    <div class="table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>SEC_ID</th>
                                    <th>STATUS</th>
                                    <th>BOT_NAME</th>
                                    <th>USER_ID</th>
                                    <th>DESCRIPTION</th>
                                    <th>EXECUTION_CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="bot in lineBots" :key="bot.id">
                                    <td class="code-font">#{{ bot.id.toString().padStart(3, '0') }}</td>
                                    <td>
                                        <button 
                                            :class="['status-badge', bot.enabled ? 'status-active' : 'status-inactive']"
                                            @click="toggleLineBotStatus(bot)"
                                        >
                                            {{ bot.enabled ? 'ENABLED' : 'DISABLED' }}
                                        </button>
                                    </td>
                                    <td class="bold-font">{{ bot.name }}</td>
                                    <td class="code-font">{{ bot.user_id.substring(0, 16) }}...</td>
                                    <td class="table-desc">{{ bot.description || '-' }}</td>
                                    <td>
                                        <div class="row-actions">
                                            <button class="btn-cmd btn-test" @click="openTestDialog(bot)">TEST</button>
                                            <button class="btn-cmd" @click="openLineBotEditDialog(bot)">MODIFY</button>
                                            <button class="btn-cmd-danger" @click="requestLineBotDelete(bot.id)">DROP</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="lineBots.length === 0">
                                    <td colspan="6" class="empty-state">
                                        <div class="empty-icon">📡</div>
                                        <p>NO_LINE_BOT_CONFIGURED</p>
                                        <span>Initialize a new LINE Bot configuration to enable notifications.</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </transition>
        </main>

        <!-- Command Overlay (Dialog) -->
        <transition name="fade">
            <div v-if="showEditDialog" class="dialog-overlay" @click.self="showEditDialog = false">
                <div class="cyber-dialog">
                    <div class="dialog-header">
                        <span class="prefix">CMD: </span>MODIFY_RESOURCE
                    </div>
                    
                    <div class="dialog-body">
                        <div class="field-item">
                            <label>IDENTIFIER_LABEL</label>
                            <div class="cyber-input">
                                <input v-model="editingApp.title" type="text">
                            </div>
                        </div>

                        <div class="field-item">
                            <label>ASSET_PATH_SRC</label>
                            <div class="input-group">
                                <div class="cyber-input">
                                    <input v-model="editingApp.icon_url" type="text">
                                </div>
                                <label class="btn-upload">
                                    UPLOAD_NEW
                                    <input type="file" @change="handleFileUpload" accept="image/*" hidden>
                                </label>
                            </div>
                        </div>

                        <div class="field-item">
                            <label>REDIRECT_DEST</label>
                            <div class="cyber-input">
                                <input v-model="editingApp.link_url" type="text">
                            </div>
                        </div>

                        <div class="field-item">
                            <label>METADATA_OVERVIEW</label>
                            <div class="cyber-input">
                                <textarea v-model="editingApp.description" rows="3"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="dialog-footer">
                        <button @click="showEditDialog = false" class="btn-abort">ABORT_CMD</button>
                        <button @click="saveApp" class="btn-commit">COMMIT_CHANGES</button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Security Confirm Overlay (Custom Alert) -->
        <transition name="fade">
            <div v-if="showConfirm" class="dialog-overlay alert-overlay" @click.self="showConfirm = false">
                <div class="cyber-dialog alert-dialog">
                    <div class="dialog-header alert-header">
                        <span class="prefix">ALERT: </span>DESTRUCTIVE_ACTION_REQUESTED
                    </div>
                    
                    <div class="dialog-body alert-body">
                        <div class="alert-icon-large">⚠️</div>
                        <div class="alert-text">
                            <h3>PERMANENT_DATA_PURGE</h3>
                            <p>You are about to initiate a node destruction sequence. This action is IRREVERSIBLE and will purge all associated metadata from the secure database.</p>
                            <div class="target-node">TARGET_ID: #{{ itemToDelete?.toString().padStart(3, '0') }}</div>
                        </div>
                    </div>

                    <div class="dialog-footer alert-footer">
                        <button @click="showConfirm = false" class="btn-abort">CANCEL_PURGE</button>
                        <button @click="executeDelete" class="btn-confirm-delete">EXECUTE_PURGE</button>
                    </div>
                    <div class="alert-scan"></div>
                </div>
            </div>
        </transition>

        <!-- LINE Bot Edit/Create Dialog -->
        <transition name="fade">
            <div v-if="showLineBotDialog" class="dialog-overlay" @click.self="showLineBotDialog = false">
                <div class="cyber-dialog linebot-dialog">
                    <div class="dialog-header linebot-header">
                        <span class="prefix">CMD: </span>{{ editingLineBot?.id ? 'MODIFY_LINEBOT' : 'INIT_LINEBOT' }}
                    </div>
                    
                    <div class="dialog-body">
                        <div class="field-item">
                            <label>BOT_NAME</label>
                            <div class="cyber-input">
                                <input v-model="editingLineBot.name" type="text" placeholder="e.g. 主要通知機器人">
                            </div>
                        </div>

                        <div class="field-item">
                            <label>CHANNEL_ACCESS_TOKEN</label>
                            <div class="cyber-input">
                                <input v-model="editingLineBot.channel_access_token" type="password" placeholder="LINE Channel Access Token">
                            </div>
                        </div>

                        <div class="field-item">
                            <label>CHANNEL_SECRET</label>
                            <div class="cyber-input">
                                <input v-model="editingLineBot.channel_secret" type="password" placeholder="LINE Channel Secret">
                            </div>
                        </div>

                        <div class="field-item">
                            <label>TARGET_USER_ID</label>
                            <div class="cyber-input">
                                <input v-model="editingLineBot.user_id" type="text" placeholder="User ID or Group ID">
                            </div>
                        </div>

                        <div class="field-item">
                            <label>DESCRIPTION</label>
                            <div class="cyber-input">
                                <textarea v-model="editingLineBot.description" rows="2" placeholder="描述此 LINE Bot 的用途"></textarea>
                            </div>
                        </div>

                        <div class="field-item toggle-field">
                            <label>ENABLED_STATUS</label>
                            <button 
                                :class="['toggle-btn', editingLineBot.enabled ? 'toggle-on' : 'toggle-off']"
                                @click="editingLineBot.enabled = !editingLineBot.enabled"
                            >
                                {{ editingLineBot.enabled ? 'ENABLED' : 'DISABLED' }}
                            </button>
                        </div>
                    </div>

                    <div class="dialog-footer">
                        <button @click="showLineBotDialog = false" class="btn-abort">ABORT_CMD</button>
                        <button @click="saveLineBot" class="btn-commit">COMMIT_CHANGES</button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- LINE Bot Delete Confirm Dialog -->
        <transition name="fade">
            <div v-if="showLineBotConfirm" class="dialog-overlay alert-overlay" @click.self="showLineBotConfirm = false">
                <div class="cyber-dialog alert-dialog">
                    <div class="dialog-header alert-header">
                        <span class="prefix">ALERT: </span>LINEBOT_PURGE_REQUESTED
                    </div>
                    
                    <div class="dialog-body alert-body">
                        <div class="alert-icon-large">🤖</div>
                        <div class="alert-text">
                            <h3>LINEBOT_CONFIG_PURGE</h3>
                            <p>You are about to remove this LINE Bot configuration. All notification settings will be permanently deleted.</p>
                            <div class="target-node">TARGET_ID: #{{ lineBotToDelete?.toString().padStart(3, '0') }}</div>
                        </div>
                    </div>

                    <div class="dialog-footer alert-footer">
                        <button @click="showLineBotConfirm = false" class="btn-abort">CANCEL_PURGE</button>
                        <button @click="executeLineBotDelete" class="btn-confirm-delete">EXECUTE_PURGE</button>
                    </div>
                    <div class="alert-scan"></div>
                </div>
            </div>
        </transition>

        <!-- LINE Bot Test Message Dialog -->
        <transition name="fade">
            <div v-if="showTestDialog" class="dialog-overlay" @click.self="showTestDialog = false">
                <div class="cyber-dialog test-dialog">
                    <div class="dialog-header test-header">
                        <span class="prefix">TEST: </span>SEND_NOTIFICATION
                    </div>
                    
                    <div class="dialog-body">
                        <div class="test-info">
                            <div class="test-target">
                                <span class="label">TARGET_BOT:</span>
                                <span class="value">{{ testingLineBot?.name }}</span>
                            </div>
                        </div>

                        <div class="field-item">
                            <label>MESSAGE_CONTENT</label>
                            <div class="cyber-input">
                                <textarea v-model="testMessage" rows="3" placeholder="輸入測試訊息內容"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="dialog-footer">
                        <button @click="showTestDialog = false" class="btn-abort">CANCEL_TEST</button>
                        <button @click="sendTestMessage" class="btn-commit btn-send">TRANSMIT_MESSAGE</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>



<style scoped>
.admin-layout {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 1.2rem;
    padding: 0.8rem;
    font-family: 'JetBrains Mono', monospace, sans-serif;
    color: #e2e8f0;
    font-size: 1rem;
}

/* Control Side-Console */
.admin-sidebar {
    width: 280px;
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    display: flex;
    flex-direction: column;
    padding: 1.8rem;
    position: relative;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 3rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

.status-pulse {
    width: 8px;
    height: 8px;
    background: #0ea5e9;
    border-radius: 50%;
    box-shadow: 0 0 10px #0ea5e9;
    animation: pulse 2s infinite;
}

.sidebar-header h2 {
    font-size: 0.9rem;
    font-weight: 900;
    letter-spacing: 2px;
    color: #38bdf8;
}

.sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-item {
    display: flex;
    flex-direction: column;
    padding: 1.2rem;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s;
}

.nav-code {
    font-size: 0.6rem;
    color: #64748b;
    margin-bottom: 4px;
}

.nav-label {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #94a3b8;
}

.nav-item.active {
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.3);
}

.nav-item.active .nav-label {
    color: #38bdf8;
}

.identity-block {
    margin-top: auto;
    padding: 1.2rem;
    background: rgba(56, 189, 248, 0.05);
    border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.header-small { font-size: 0.6rem; color: #64748b; margin-bottom: 4px; }
.op-name { font-size: 0.9rem; font-weight: 900; color: #f1f5f9; }
.op-status { font-size: 0.6rem; color: #22c55e; margin-top: 4px; letter-spacing: 1.5px; }

.sys-load {
    margin-top: 1rem;
    font-size: 0.65rem;
    color: #475569;
}

.load-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    margin-top: 6px;
}

/* Main Content Area */
.admin-content {
    flex: 1;
    background: rgba(2, 6, 23, 0.5);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(56, 189, 248, 0.15);
    padding: 2.5rem; /* Reduced from 4.5rem */
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Decorative Corners */
.terminal-corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: rgba(56, 189, 248, 0.3);
    border-style: solid;
}
.t-l { top: 0; left: 0; border-width: 2px 0 0 2px; }
.t-r { top: 0; right: 0; border-width: 2px 2px 0 0; }
.b-l { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
.b-r { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

.bg-log {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 3.5rem;
    font-weight: 900;
    color: rgba(56, 189, 248, 0.02);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
}

/* Section Header Bar */
.section-banner {
    margin-bottom: 2.5rem;
    border-left: 5px solid #38bdf8;
    padding-left: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.banner-title h1, .banner-title h2 {
    font-size: 1.8rem;
    font-weight: 900;
    letter-spacing: 3px;
    margin: 0;
}

.banner-title p {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 6px;
}

.content-section {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

/* Data Table */
.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table th {
    text-align: left;
    padding: 1.2rem;
    font-size: 0.8rem;
    letter-spacing: 2px;
    border-bottom: 2px solid rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}

.admin-table td {
    padding: 1.2rem;
    font-size: 0.95rem;
    vertical-align: middle;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
}

.code-font { font-family: 'JetBrains Mono', monospace; color: #38bdf8; font-size: 0.85rem; }
.bold-font { font-weight: 800; color: #f1f5f9; font-size: 1.05rem; }

.icon-frame {
    width: 48px;
    height: 48px;
    padding: 6px;
    border: 1px solid rgba(56, 189, 248, 0.3);
    background: rgba(15, 23, 42, 0.8);
    position: relative;
    clip-path: polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%);
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
}

.icon-frame::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid rgba(56, 189, 248, 0.2);
    pointer-events: none;
}

.btn-add-resource {
    background: transparent;
    border: 1px solid #38bdf8;
    color: #38bdf8;
    padding: 0.8rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.btn-add-resource:hover {
    background: rgba(56, 189, 248, 0.1);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
}

.row-actions {
    display: flex;
    gap: 0.8rem;
    justify-content: flex-start;
}

.btn-cmd {
    background: transparent;
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    padding: 0.6rem 1rem;
    font-size: 0.7rem;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-cmd:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

.btn-cmd-danger {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
    padding: 0.6rem 1rem;
    font-size: 0.7rem;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-cmd-danger:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #f87171;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

/* Security Console */
.console-box {
    max-width: 650px;
    padding: 3rem;
    margin: 0 auto;
}

.box-header {
    margin-bottom: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
}

.user-avatar-frame {
    width: 80px;
    height: 80px;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
}

.avatar-inner {
    width: 100%;
    height: 100%;
    color: #38bdf8;
    display: flex;
    justify-content: center;
    align-items: center;
}

.protocol-label {
    font-size: 0.9rem;
    letter-spacing: 3px;
    font-weight: 800;
    color: #94a3b8;
}

.clearance-badge {
    padding: 4px 15px;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid #38bdf8;
    color: #38bdf8;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 2px;
}

.cyber-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(56, 189, 248, 0.2);
    position: relative;
    transition: all 0.3s;
}

.cyber-input::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: #38bdf8;
    opacity: 0.5;
}

.cyber-input:focus-within {
    border-color: rgba(56, 189, 248, 0.5);
    box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.1);
}

.field-item label {
    font-size: 0.7rem;
    margin-bottom: 8px;
}

.cyber-input input, .cyber-input textarea {
    width: 100%;
    background: transparent !important;
    border: none !important;
    padding: 0.8rem 1.2rem;
    color: #f1f5f9;
    font-size: 1rem;
    outline: none;
    font-family: 'JetBrains Mono', monospace;
}

.console-actions {
    margin-top: 3.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
}

.btn-override {
    padding: 1.2rem 4rem;
    font-size: 1rem;
    letter-spacing: 3px;
    background: transparent;
    border: 1px solid #38bdf8;
    color: #38bdf8;
    font-weight: 900;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
}

.btn-override:hover {
    background: rgba(56, 189, 248, 0.15);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
    transform: translateY(-2px);
}

.btn-override:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sys-alert {
    font-size: 0.8rem;
    padding: 1rem 2rem;
}

.dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
}

/* Dialog */
.cyber-dialog {
    width: 650px;
}

.dialog-header {
    padding: 1.2rem 1.8rem;
    font-size: 0.95rem;
}

.dialog-body {
    padding: 2rem;
    gap: 1.5rem;
}

.btn-upload {
    background: transparent;
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    padding: 0.8rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-upload:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
}

.dialog-footer {
    padding: 2rem;
    display: flex;
    justify-content: center;
    gap: 2.5rem;
    border-top: 1px solid rgba(56, 189, 248, 0.1);
}

.btn-abort {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
    padding: 0.8rem 2rem;
    font-size: 0.85rem;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-abort:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #f87171;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

.btn-commit {
    background: transparent;
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    padding: 0.8rem 2rem;
    font-size: 0.85rem;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-commit:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

/* Alert Dialog Specifics */
.alert-overlay {
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
}

.alert-dialog {
    border: 1px solid rgba(239, 68, 68, 0.5);
    background: rgba(2, 6, 23, 0.95);
    box-shadow: 0 0 50px rgba(239, 68, 68, 0.15);
}

.alert-header {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.alert-body {
    display: flex;
    gap: 2rem;
    align-items: center;
    padding: 3rem 2.5rem;
}

.alert-icon-large {
    font-size: 4rem;
    color: #ef4444;
    text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    animation: alert-pulse 1s infinite alternate;
}

@keyframes alert-pulse {
    from { opacity: 0.6; transform: scale(1); }
    to { opacity: 1; transform: scale(1.1); }
}

.alert-text h3 {
    margin: 0 0 10px;
    color: #ef4444;
    letter-spacing: 2px;
}

.alert-text p {
    font-size: 0.9rem;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
}

.target-node {
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    background: rgba(239, 68, 68, 0.05);
    border: 1px dashed rgba(239, 68, 68, 0.3);
    color: #ef4444;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    display: inline-block;
}

.btn-confirm-delete {
    background: transparent;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 0.8rem 2.5rem;
    font-size: 0.85rem;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-confirm-delete:hover {
    background: rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.alert-scan {
    position: absolute;
    inset: 0;
    background: linear-gradient(transparent, rgba(239, 68, 68, 0.05), transparent);
    height: 20%;
    animation: alert-scan-move 2s linear infinite;
    pointer-events: none;
}

@keyframes alert-scan-move {
    from { transform: translateY(-100%); }
    to { transform: translateY(500%); }
}

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* LINE Bot Notification Styles */
.status-badge {
    padding: 0.4rem 1rem;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 1px;
    border: 1px solid;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s;
}

.status-active {
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.4);
}

.status-active:hover {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
}

.status-inactive {
    color: #64748b;
    border-color: rgba(100, 116, 139, 0.4);
}

.status-inactive:hover {
    background: rgba(100, 116, 139, 0.1);
    border-color: #64748b;
}

.btn-test {
    background: transparent;
    border: 1px solid rgba(168, 85, 247, 0.4);
    color: #a855f7;
}

.btn-test:hover {
    background: rgba(168, 85, 247, 0.1);
    border-color: #a855f7;
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem !important;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.5;
}

.empty-state p {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 2px;
    color: #64748b;
    margin: 0 0 0.5rem;
}

.empty-state span {
    font-size: 0.85rem;
    color: #475569;
}

/* LINE Bot Dialog */
.linebot-dialog {
    max-width: 700px;
}

.linebot-header {
    background: rgba(0, 185, 107, 0.1);
    border-bottom: 1px solid rgba(0, 185, 107, 0.3);
    color: #00b96b;
}

.linebot-header .prefix {
    color: #00b96b;
}

.toggle-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.toggle-btn {
    padding: 0.6rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 1px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.3s;
}

.toggle-on {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
    color: #22c55e;
}

.toggle-on:hover {
    background: rgba(34, 197, 94, 0.2);
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}

.toggle-off {
    background: rgba(100, 116, 139, 0.1);
    border-color: #64748b;
    color: #64748b;
}

.toggle-off:hover {
    background: rgba(100, 116, 139, 0.2);
}

/* Test Dialog */
.test-dialog {
    max-width: 550px;
}

.test-header {
    background: rgba(168, 85, 247, 0.1);
    border-bottom: 1px solid rgba(168, 85, 247, 0.3);
    color: #a855f7;
}

.test-header .prefix {
    color: #a855f7;
}

.test-info {
    background: rgba(168, 85, 247, 0.05);
    border: 1px solid rgba(168, 85, 247, 0.2);
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
}

.test-target {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.test-target .label {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1px;
    color: #64748b;
}

.test-target .value {
    font-size: 1rem;
    font-weight: 800;
    color: #a855f7;
}

.btn-send {
    background: rgba(168, 85, 247, 0.1);
    border-color: #a855f7;
    color: #a855f7;
}

.btn-send:hover {
    background: rgba(168, 85, 247, 0.2);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}
</style>

