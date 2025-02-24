<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="search"
          type="text"
          placeholder="Grup ara..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <select
        v-model="resolved"
        class="py-2 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Tüm Durumlar</option>
        <option value="false">Açık</option>
        <option value="true">Çözümlendi</option>
      </select>
    </div>

    <!-- Groups Grid -->
    <div v-if="pending" class="grid grid-cols-1 gap-3">
      <div v-for="i in 8" :key="i" class="h-24 bg-muted animate-pulse rounded-lg" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="group in groups?.data || []"
        :key="group._id"
        class="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors cursor-pointer"
        @click="navigateTo(`/groups/${group._id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-sm font-bold text-destructive">{{ group.count > 999 ? '999+' : group.count }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ group.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5 truncate">
                {{ group.sampleError?.source || group.sampleError?.url || 'Kaynak bilgisi yok' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <SeverityBadge :severity="group.severity" />
            <span
              :class="[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                group.resolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
              ]"
            >
              {{ group.resolved ? 'Çözümlendi' : 'Açık' }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>İlk: {{ formatDate(group.firstSeen) }}</span>
          <span>Son: {{ formatDate(group.lastSeen) }}</span>
          <span class="capitalize">{{ group.type }}</span>
          <div v-if="group.aiAnalysis" class="flex items-center gap-1 text-blue-500">
            <Icon name="lucide:sparkles" class="w-3 h-3" />
            <span>AI Analizi Mevcut</span>
          </div>
        </div>
      </div>

      <div v-if="!groups?.data?.length" class="bg-card border border-border rounded-lg p-12 text-center">
        <Icon name="lucide:check-circle" class="w-10 h-10 mx-auto mb-3 text-green-500" />
        <p class="text-muted-foreground">Hata grubu bulunamadı</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="groups?.pagination" class="flex items-center justify-between">
      <p class="text-xs text-muted-foreground">
        {{ groups.pagination.total }} grup
      </p>
      <div class="flex items-center gap-2">
        <button
          :disabled="page <= 1"
          class="p-1.5 rounded-md border border-input disabled:opacity-50 hover:bg-muted transition-colors"
          @click="page--"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
        </button>
        <span class="text-xs text-muted-foreground">{{ page }} / {{ groups.pagination.totalPages }}</span>
        <button
          :disabled="page >= groups.pagination.totalPages"
          class="p-1.5 rounded-md border border-input disabled:opacity-50 hover:bg-muted transition-colors"
          @click="page++"
        >
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const api = useApi()
const page = ref(1)
const search = ref('')
const resolved = ref('')

watch([search, resolved], () => { page.value = 1 })

const queryParams = computed(() => ({
  page: page.value,
  limit: 20,
  ...(search.value && { search: search.value }),
  ...(resolved.value && { resolved: resolved.value }),
}))

interface Group {
  _id: string
  title: string
  type: string
  severity: string
  count: number
  firstSeen: string
  lastSeen: string
  resolved: boolean
  sampleError: { url?: string; source?: string }
  aiAnalysis?: { summary: string }
}

const { data: groups, pending } = await useAsyncData(
  'groups-list',
  () => api.get<{ success: boolean; data: Group[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/api/groups', queryParams.value),
  { watch: [queryParams] }
)

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr })
  } catch {
    return dateStr
  }
}
</script>
