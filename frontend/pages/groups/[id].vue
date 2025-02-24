<template>
  <div v-if="pending" class="flex items-center justify-center py-12">
    <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-muted-foreground" />
  </div>

  <div v-else-if="group" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink to="/groups" class="text-xs text-muted-foreground hover:text-foreground">← Gruplar</NuxtLink>
        </div>
        <h1 class="text-lg font-semibold text-foreground break-words">{{ group.title }}</h1>
        <div class="flex items-center gap-3 mt-2">
          <SeverityBadge :severity="group.severity" />
          <span class="text-xs text-muted-foreground capitalize">{{ group.type }}</span>
          <span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="lucide:repeat" class="w-3 h-3" />
            {{ group.count }} kez
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          v-if="!group.resolved"
          :disabled="resolving"
          class="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          @click="resolveGroup"
        >
          <Icon name="lucide:check" class="w-4 h-4" />
          Tümünü Çöz
        </button>
        <button
          :disabled="analyzing"
          class="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          @click="analyzeGroup"
        >
          <Icon :name="analyzing ? 'lucide:loader-2' : 'lucide:sparkles'" class="w-4 h-4" :class="{ 'animate-spin': analyzing }" />
          AI Analizi
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <!-- AI Analysis -->
        <div v-if="group.aiAnalysis" class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="lucide:sparkles" class="w-4 h-4 text-blue-500" />
            <h2 class="text-sm font-semibold text-blue-900 dark:text-blue-100">AI Analizi</h2>
          </div>
          <p class="text-sm text-foreground mb-4">{{ group.aiAnalysis.summary }}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Olası Nedenler</h3>
              <ul class="space-y-1.5">
                <li v-for="(cause, i) in group.aiAnalysis.possibleCauses" :key="i" class="flex items-start gap-2 text-xs text-foreground">
                  <span class="text-orange-500 mt-0.5">▸</span>
                  {{ cause }}
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Çözüm Önerileri</h3>
              <ul class="space-y-1.5">
                <li v-for="(s, i) in group.aiAnalysis.suggestions" :key="i" class="flex items-start gap-2 text-xs text-foreground">
                  <span class="text-green-500 mt-0.5">✓</span>
                  {{ s }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Recent Errors in Group -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">Bu Grubun Hataları</h2>
          <div class="space-y-2">
            <div
              v-for="error in groupErrors"
              :key="error._id"
              class="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer"
              @click="navigateTo(`/errors/${error._id}`)"
            >
              <SeverityBadge :severity="error.severity" />
              <div class="flex-1 min-w-0">
                <p class="text-xs text-foreground truncate">{{ error.message }}</p>
                <p class="text-xs text-muted-foreground">{{ formatDate(error.createdAt) }}</p>
              </div>
              <Icon name="lucide:chevron-right" class="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            <div v-if="!groupErrors.length" class="text-sm text-muted-foreground text-center py-4">
              Hata bulunamadı
            </div>
          </div>
        </div>
      </div>

      <!-- Info Sidebar -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">Grup Bilgisi</h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-xs text-muted-foreground">Toplam Oluşma</dt>
              <dd class="text-lg font-bold text-foreground">{{ group.count }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">İlk Görülme</dt>
              <dd class="text-xs text-foreground">{{ formatDate(group.firstSeen) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Son Görülme</dt>
              <dd class="text-xs text-foreground">{{ formatDate(group.lastSeen) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Durum</dt>
              <dd>
                <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', group.resolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700']">
                  {{ group.resolved ? 'Çözümlendi' : 'Açık' }}
                </span>
              </dd>
            </div>
            <div v-if="group.sampleError?.source">
              <dt class="text-xs text-muted-foreground">Kaynak</dt>
              <dd class="text-xs text-foreground break-all">{{ group.sampleError.source }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const route = useRoute()
const api = useApi()
const resolving = ref(false)
const analyzing = ref(false)

interface GroupDetail {
  _id: string
  title: string
  type: string
  severity: string
  count: number
  firstSeen: string
  lastSeen: string
  resolved: boolean
  sampleError: { message?: string; stack?: string; url?: string; source?: string }
  aiAnalysis?: { summary: string; possibleCauses: string[]; suggestions: string[]; analyzedAt: string }
}

const { data, pending, refresh } = await useAsyncData(`group-${route.params.id}`, () =>
  api.get<{ success: boolean; data: { group: GroupDetail; errors: Array<{ _id: string; message: string; severity: string; createdAt: string }> } }>(`/api/groups/${route.params.id}`)
)

const group = computed(() => data.value?.data?.group)
const groupErrors = computed(() => data.value?.data?.errors || [])

async function resolveGroup() {
  resolving.value = true
  try {
    await api.patch(`/api/groups/${route.params.id}/resolve`)
    await refresh()
  } finally {
    resolving.value = false
  }
}

async function analyzeGroup() {
  analyzing.value = true
  try {
    await api.post(`/api/groups/${route.params.id}/analyze`, {})
    await refresh()
  } finally {
    analyzing.value = false
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr })
  } catch {
    return dateStr
  }
}
</script>
