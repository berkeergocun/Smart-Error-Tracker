<template>
  <div v-if="pending" class="flex items-center justify-center py-12">
    <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-muted-foreground" />
  </div>

  <div v-else-if="domain" class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <NuxtLink to="/domains" class="text-xs text-muted-foreground hover:text-foreground">← Domainler</NuxtLink>
        <h1 class="text-lg font-semibold text-foreground mt-2">{{ domain.name }}</h1>
        <p class="text-sm text-muted-foreground">{{ domain.domain }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-card border border-border rounded-lg p-5">
        <p class="text-xs text-muted-foreground">Toplam Hata</p>
        <p class="text-2xl font-bold text-foreground mt-1">{{ domain.stats?.totalErrors || 0 }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-5">
        <p class="text-xs text-muted-foreground">Hata Grupları</p>
        <p class="text-2xl font-bold text-foreground mt-1">{{ domain.stats?.totalGroups || 0 }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-5">
        <p class="text-xs text-muted-foreground">Son Hata</p>
        <p class="text-sm font-medium text-foreground mt-1">
          {{ domain.stats?.lastErrorAt ? formatDate(domain.stats.lastErrorAt) : 'Henüz yok' }}
        </p>
      </div>
    </div>

    <!-- UUID & Integration -->
    <div class="bg-card border border-border rounded-lg p-5">
      <h2 class="text-sm font-semibold text-foreground mb-4">SDK Entegrasyon</h2>

      <div class="mb-4">
        <label class="text-xs text-muted-foreground">Domain UUID</label>
        <div class="flex items-center gap-2 mt-1">
          <code class="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-md text-foreground">{{ domain.uuid }}</code>
          <button class="p-2 hover:bg-muted rounded-md transition-colors" @click="copyUUID">
            <Icon name="lucide:copy" class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-xs text-muted-foreground mb-1.5 block">Browser (HTML içine gömün)</label>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-xs text-green-400">{{ browserSnippet }}</pre>
          </div>
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1.5 block">Node.js / Backend</label>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-xs text-blue-400">{{ nodeSnippet }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick links -->
    <div class="flex gap-3">
      <NuxtLink :to="`/errors?domainId=${domain.uuid}`">
        <button class="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors">
          <Icon name="lucide:alert-triangle" class="w-4 h-4" />
          Bu Domain'in Hataları
        </button>
      </NuxtLink>
      <NuxtLink :to="`/groups?domainId=${domain.uuid}`">
        <button class="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors">
          <Icon name="lucide:layers" class="w-4 h-4" />
          Hata Grupları
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const route = useRoute()
const api = useApi()
const config = useRuntimeConfig()

interface Domain {
  _id: string
  uuid: string
  name: string
  domain: string
  description?: string
  stats: { totalErrors: number; totalGroups: number; lastErrorAt?: string }
}

const { data, pending } = await useAsyncData(`domain-${route.params.uuid}`, () =>
  api.get<{ success: boolean; data: Domain }>(`/api/domains/${route.params.uuid}`)
)

const domain = computed(() => data.value?.data)

const browserSnippet = computed(() => {
  if (!domain.value) return ''
  return `<script>
  window.SmartErrorTrackerConfig = {
    apiUrl: '${config.public.apiUrl}',
    domainId: '${domain.value.uuid}'
  };
<\/script>
<script src="${config.public.apiUrl}/sdk.js"><\/script>`
})

const nodeSnippet = computed(() => {
  if (!domain.value) return ''
  return `import SmartErrorTracker from '@smart-error-tracker/sdk';

SmartErrorTracker.init({
  apiUrl: '${config.public.apiUrl}',
  domainId: '${domain.value.uuid}',
  debug: false,
});`
})

async function copyUUID() {
  if (domain.value?.uuid) {
    await navigator.clipboard.writeText(domain.value.uuid)
  }
}

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr })
  } catch {
    return dateStr
  }
}
</script>
