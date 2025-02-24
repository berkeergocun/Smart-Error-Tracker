<template>
  <div v-if="pending" class="flex items-center justify-center py-12">
    <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-muted-foreground" />
  </div>

  <div v-else-if="errorData" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink to="/errors" class="text-xs text-muted-foreground hover:text-foreground">← Hatalar</NuxtLink>
        </div>
        <h1 class="text-lg font-semibold text-foreground break-words">{{ errorData.message }}</h1>
        <div class="flex items-center gap-3 mt-2">
          <SeverityBadge :severity="errorData.severity" />
          <span class="text-xs text-muted-foreground capitalize">{{ errorData.type }}</span>
          <span class="text-xs text-muted-foreground">{{ formatDate(errorData.createdAt) }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          v-if="!errorData.resolved"
          :disabled="resolving"
          class="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          @click="resolveError"
        >
          <Icon name="lucide:check" class="w-4 h-4" />
          Çözüldü İşaretle
        </button>
        <button
          :disabled="analyzing"
          class="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          @click="analyzeError"
        >
          <Icon :name="analyzing ? 'lucide:loader-2' : 'lucide:sparkles'" class="w-4 h-4" :class="{ 'animate-spin': analyzing }" />
          AI Analizi
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <!-- AI Analysis -->
        <div v-if="errorData.aiAnalysis" class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="lucide:sparkles" class="w-4 h-4 text-blue-500" />
            <h2 class="text-sm font-semibold text-blue-900 dark:text-blue-100">AI Analizi</h2>
            <span class="text-xs text-blue-500 ml-auto">{{ formatDate(errorData.aiAnalysis.analyzedAt) }}</span>
          </div>
          <p class="text-sm text-foreground mb-4">{{ errorData.aiAnalysis.summary }}</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Olası Nedenler</h3>
              <ul class="space-y-1.5">
                <li
                  v-for="(cause, i) in errorData.aiAnalysis.possibleCauses"
                  :key="i"
                  class="flex items-start gap-2 text-xs text-foreground"
                >
                  <span class="text-orange-500 mt-0.5">▸</span>
                  {{ cause }}
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Çözüm Önerileri</h3>
              <ul class="space-y-1.5">
                <li
                  v-for="(suggestion, i) in errorData.aiAnalysis.suggestions"
                  :key="i"
                  class="flex items-start gap-2 text-xs text-foreground"
                >
                  <span class="text-green-500 mt-0.5">✓</span>
                  {{ suggestion }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-else-if="analyzing" class="bg-muted rounded-lg p-5 flex items-center gap-3">
          <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-primary" />
          <span class="text-sm text-muted-foreground">AI analizi yapılıyor...</span>
        </div>

        <!-- Stack Trace -->
        <div v-if="errorData.stack" class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">Stack Trace</h2>
          <pre class="text-xs text-muted-foreground overflow-x-auto bg-muted rounded-md p-4 whitespace-pre-wrap break-words">{{ errorData.stack }}</pre>
        </div>

        <!-- Breadcrumbs -->
        <div v-if="errorData.breadcrumbs?.length" class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">
            Breadcrumbs ({{ errorData.breadcrumbs.length }})
          </h2>
          <div class="space-y-2 relative">
            <div class="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
            <div
              v-for="(crumb, i) in errorData.breadcrumbs"
              :key="i"
              class="pl-7 relative"
            >
              <div class="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center">
                <Icon :name="getBreadcrumbIcon(crumb.type)" class="w-2.5 h-2.5 text-muted-foreground" />
              </div>
              <p class="text-xs text-foreground">{{ crumb.message }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDate(crumb.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Info -->
      <div class="space-y-4">
        <!-- Details -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">Detaylar</h2>
          <dl class="space-y-2">
            <div v-if="errorData.url">
              <dt class="text-xs text-muted-foreground">URL</dt>
              <dd class="text-xs text-foreground break-all">{{ errorData.url }}</dd>
            </div>
            <div v-if="errorData.source">
              <dt class="text-xs text-muted-foreground">Kaynak</dt>
              <dd class="text-xs text-foreground">{{ errorData.source }}{{ errorData.lineno ? `:${errorData.lineno}` : '' }}{{ errorData.colno ? `:${errorData.colno}` : '' }}</dd>
            </div>
            <div v-if="errorData.userAgent">
              <dt class="text-xs text-muted-foreground">User Agent</dt>
              <dd class="text-xs text-foreground break-all">{{ errorData.userAgent }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Durum</dt>
              <dd>
                <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', errorData.resolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700']">
                  {{ errorData.resolved ? 'Çözümlendi' : 'Açık' }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Metadata -->
        <div v-if="Object.keys(errorData.metadata || {}).length" class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">Metadata</h2>
          <pre class="text-xs text-muted-foreground overflow-x-auto">{{ JSON.stringify(errorData.metadata, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-muted-foreground">Hata bulunamadı</p>
    <NuxtLink to="/errors" class="text-primary text-sm hover:underline">← Geri dön</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const route = useRoute()
const api = useApi()
const resolving = ref(false)
const analyzing = ref(false)

interface ErrorDetail {
  _id: string
  message: string
  type: string
  severity: string
  stack?: string
  source?: string
  lineno?: number
  colno?: number
  url?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  breadcrumbs?: Array<{ type: string; message: string; timestamp: string }>
  resolved: boolean
  aiAnalysis?: {
    summary: string
    possibleCauses: string[]
    suggestions: string[]
    analyzedAt: string
  }
  createdAt: string
}

const { data, pending, refresh } = await useAsyncData(`error-${route.params.id}`, () =>
  api.get<{ success: boolean; data: ErrorDetail }>(`/api/errors/${route.params.id}`)
)

const errorData = computed(() => data.value?.data)

async function resolveError() {
  resolving.value = true
  try {
    await api.patch(`/api/errors/${route.params.id}/resolve`)
    await refresh()
  } finally {
    resolving.value = false
  }
}

async function analyzeError() {
  analyzing.value = true
  try {
    await api.post(`/api/errors/analyze/${route.params.id}`, {})
    await refresh()
  } finally {
    analyzing.value = false
  }
}

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr })
  } catch {
    return dateStr
  }
}

function getBreadcrumbIcon(type: string): string {
  const icons: Record<string, string> = {
    navigation: 'lucide:navigation',
    click: 'lucide:mouse-pointer',
    xhr: 'lucide:wifi',
    fetch: 'lucide:globe',
    console: 'lucide:terminal',
    error: 'lucide:alert-circle',
    custom: 'lucide:tag',
  }
  return icons[type] || 'lucide:circle'
}
</script>
