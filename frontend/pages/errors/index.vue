<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="filters.search"
          type="text"
          placeholder="Hata mesajı ara..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <select
        v-model="filters.severity"
        class="py-2 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Tüm Önem Dereceleri</option>
        <option value="critical">Kritik</option>
        <option value="high">Yüksek</option>
        <option value="medium">Orta</option>
        <option value="low">Düşük</option>
      </select>
      <select
        v-model="filters.type"
        class="py-2 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Tüm Tipler</option>
        <option value="javascript">JavaScript</option>
        <option value="promise">Promise</option>
        <option value="network">Network</option>
        <option value="resource">Resource</option>
        <option value="server">Server</option>
        <option value="custom">Custom</option>
      </select>
      <select
        v-model="filters.resolved"
        class="py-2 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Tüm Durumlar</option>
        <option value="false">Açık</option>
        <option value="true">Çözümlendi</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-muted/50">
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Hata</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tip</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Önem</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Durum</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarih</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <template v-if="pending">
              <tr v-for="i in 10" :key="i">
                <td colspan="6" class="px-4 py-3">
                  <div class="h-4 bg-muted animate-pulse rounded" />
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="error in errors?.data || []"
                :key="error._id"
                class="hover:bg-muted/30 transition-colors cursor-pointer"
                @click="navigateTo(`/errors/${error._id}`)"
              >
                <td class="px-4 py-3 max-w-xs">
                  <p class="truncate font-medium text-foreground">{{ error.message }}</p>
                  <p v-if="error.source" class="text-xs text-muted-foreground truncate mt-0.5">
                    {{ error.source }}{{ error.lineno ? `:${error.lineno}` : '' }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <span class="capitalize text-xs text-muted-foreground">{{ error.type }}</span>
                </td>
                <td class="px-4 py-3">
                  <SeverityBadge :severity="error.severity" />
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      error.resolved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700',
                    ]"
                  >
                    {{ error.resolved ? 'Çözümlendi' : 'Açık' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {{ formatDate(error.createdAt) }}
                </td>
                <td class="px-4 py-3">
                  <Icon name="lucide:chevron-right" class="w-4 h-4 text-muted-foreground" />
                </td>
              </tr>
              <tr v-if="!errors?.data?.length">
                <td colspan="6" class="px-4 py-12 text-center text-muted-foreground">
                  <Icon name="lucide:check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>Hata bulunamadı</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="errors?.pagination" class="px-4 py-3 border-t border-border flex items-center justify-between">
        <p class="text-xs text-muted-foreground">
          {{ errors.pagination.total }} hata · Sayfa {{ errors.pagination.page }} / {{ errors.pagination.totalPages }}
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            class="p-1.5 rounded-md border border-input disabled:opacity-50 hover:bg-muted transition-colors"
            @click="page--"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </button>
          <button
            :disabled="page >= errors.pagination.totalPages"
            class="p-1.5 rounded-md border border-input disabled:opacity-50 hover:bg-muted transition-colors"
            @click="page++"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
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
const page = ref(1)

const filters = reactive({
  search: (route.query.search as string) || '',
  severity: '',
  type: '',
  resolved: '',
})

watch(filters, () => { page.value = 1 })

const queryParams = computed(() => ({
  page: page.value,
  limit: 20,
  ...(filters.search && { search: filters.search }),
  ...(filters.severity && { severity: filters.severity }),
  ...(filters.type && { type: filters.type }),
  ...(filters.resolved && { resolved: filters.resolved }),
}))

interface ErrorItem {
  _id: string
  message: string
  type: string
  severity: string
  resolved: boolean
  source?: string
  lineno?: number
  createdAt: string
}

const { data: errors, pending } = await useAsyncData(
  'errors-list',
  () => api.get<{ success: boolean; data: ErrorItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/api/errors', queryParams.value),
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
