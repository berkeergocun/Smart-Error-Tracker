<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <NuxtLink to="/domains" class="text-xs text-muted-foreground hover:text-foreground">← Domainler</NuxtLink>
      <h1 class="text-lg font-semibold text-foreground mt-2">Yeni Domain Ekle</h1>
    </div>

    <div v-if="created" class="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
      <Icon name="lucide:check-circle" class="w-12 h-12 text-green-500 mx-auto" />
      <h2 class="text-lg font-semibold text-foreground">Domain Oluşturuldu!</h2>
      <p class="text-sm text-muted-foreground">SDK entegrasyonunda kullanmak için UUID'nizi kaydedin.</p>

      <div class="bg-white border border-green-200 rounded-md p-4">
        <p class="text-xs text-muted-foreground mb-1">Domain UUID</p>
        <div class="flex items-center gap-2 justify-center">
          <code class="text-sm font-mono text-foreground">{{ created.uuid }}</code>
          <button class="p-1 hover:bg-muted rounded" @click="copyUUID">
            <Icon name="lucide:copy" class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- SDK Usage -->
      <div class="text-left bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <p class="text-xs text-gray-400 mb-2">Browser SDK kullanımı:</p>
        <pre class="text-xs text-green-400">{{ browserSnippet }}</pre>
      </div>

      <div class="flex gap-3 justify-center">
        <NuxtLink to="/domains">
          <button class="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors">
            Domainlere Dön
          </button>
        </NuxtLink>
        <NuxtLink :to="`/domains/${created.uuid}`">
          <button class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Domain Detayı
          </button>
        </NuxtLink>
      </div>
    </div>

    <form v-else class="bg-card border border-border rounded-lg p-6 space-y-5" @submit.prevent="createDomain">
      <div>
        <label class="text-sm font-medium text-foreground">Proje Adı *</label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="örn: Benim Projem"
          class="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label class="text-sm font-medium text-foreground">Domain URL *</label>
        <input
          v-model="form.domain"
          type="text"
          required
          placeholder="örn: myapp.com veya localhost:3000"
          class="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label class="text-sm font-medium text-foreground">Açıklama</label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Proje hakkında kısa açıklama..."
          class="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      <div v-if="error" class="bg-destructive/10 border border-destructive/20 rounded-md p-3">
        <p class="text-sm text-destructive">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-3">
        <NuxtLink to="/domains">
          <button type="button" class="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors">
            İptal
          </button>
        </NuxtLink>
        <button
          type="submit"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Icon v-if="loading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          Domain Oluştur
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const api = useApi()
const config = useRuntimeConfig()

const form = reactive({ name: '', domain: '', description: '' })
const loading = ref(false)
const error = ref('')
const created = ref<{ uuid: string; name: string } | null>(null)

const browserSnippet = computed(() => {
  if (!created.value) return ''
  return `<script>
  window.SmartErrorTrackerConfig = {
    apiUrl: '${config.public.apiUrl}',
    domainId: '${created.value.uuid}'
  };
<\/script>
<script src="${config.public.apiUrl}/sdk.js"><\/script>`
})

async function createDomain() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.post<{ success: boolean; data: { uuid: string; name: string } }>('/api/domains', form)
    created.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Bir hata oluştu'
  } finally {
    loading.value = false
  }
}

async function copyUUID() {
  if (created.value?.uuid) {
    await navigator.clipboard.writeText(created.value.uuid)
  }
}
</script>
