<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="bg-card border border-border rounded-lg p-5"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-muted-foreground">{{ stat.label }}</span>
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', stat.iconBg]">
            <Icon :name="stat.icon" class="w-4 h-4" :class="stat.iconColor" />
          </div>
        </div>
        <div class="text-2xl font-bold text-foreground">
          {{ pending ? '...' : stat.value }}
        </div>
        <p v-if="stat.sub" class="text-xs text-muted-foreground mt-1">{{ stat.sub }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Error Trend Chart -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-5">
        <h2 class="text-sm font-semibold text-foreground mb-4">Son 7 Günün Hata Trendi</h2>
        <div v-if="pending" class="h-48 flex items-center justify-center">
          <span class="text-muted-foreground text-sm">Yükleniyor...</span>
        </div>
        <div v-else class="h-48">
          <ClientOnly>
            <TrendChart :data="stats?.data?.trend || []" />
          </ClientOnly>
        </div>
      </div>

      <!-- By Type -->
      <div class="bg-card border border-border rounded-lg p-5">
        <h2 class="text-sm font-semibold text-foreground mb-4">Hata Tiplerine Göre</h2>
        <div v-if="pending" class="animate-pulse space-y-2">
          <div v-for="i in 4" :key="i" class="h-6 bg-muted rounded" />
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in stats?.data?.byType || []"
            :key="item.type"
            class="flex items-center gap-3"
          >
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-foreground capitalize">{{ item.type }}</span>
                <span class="text-xs font-medium text-foreground">{{ item.count }}</span>
              </div>
              <div class="h-1.5 bg-muted rounded-full">
                <div
                  class="h-full bg-primary rounded-full"
                  :style="{ width: `${getPercent(item.count)}%` }"
                />
              </div>
            </div>
          </div>
          <div v-if="!stats?.data?.byType?.length" class="text-sm text-muted-foreground text-center py-4">
            Henüz hata yok
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Errors & Top Groups -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Errors -->
      <div class="bg-card border border-border rounded-lg p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-foreground">Son Hatalar</h2>
          <NuxtLink to="/errors" class="text-xs text-primary hover:underline">Tümünü gör →</NuxtLink>
        </div>
        <div v-if="pending" class="animate-pulse space-y-3">
          <div v-for="i in 5" :key="i" class="h-12 bg-muted rounded" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="error in stats?.data?.recentErrors || []"
            :key="error._id"
            class="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
            @click="navigateTo(`/errors/${error._id}`)"
          >
            <SeverityBadge :severity="error.severity" class="mt-0.5 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate">{{ error.message }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ formatDate(error.createdAt) }}
              </p>
            </div>
          </div>
          <div v-if="!stats?.data?.recentErrors?.length" class="text-sm text-muted-foreground text-center py-4">
            Henüz hata yok 🎉
          </div>
        </div>
      </div>

      <!-- Top Error Groups -->
      <div class="bg-card border border-border rounded-lg p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-foreground">En Sık Hatalar</h2>
          <NuxtLink to="/groups" class="text-xs text-primary hover:underline">Tümünü gör →</NuxtLink>
        </div>
        <div v-if="pending" class="animate-pulse space-y-3">
          <div v-for="i in 5" :key="i" class="h-12 bg-muted rounded" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="group in stats?.data?.topGroups || []"
            :key="group._id"
            class="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
            @click="navigateTo(`/groups/${group._id}`)"
          >
            <div class="w-9 h-9 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-bold text-destructive">{{ group.count }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate">{{ group.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">
                Son: {{ formatDate(group.lastSeen) }}
              </p>
            </div>
          </div>
          <div v-if="!stats?.data?.topGroups?.length" class="text-sm text-muted-foreground text-center py-4">
            Henüz hata grubu yok 🎉
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const api = useApi()

const { data: stats, pending, refresh } = await useAsyncData('dashboard-stats', () =>
  api.get<{ success: boolean; data: {
    overview: {
      totalErrors: number
      totalGroups: number
      totalDomains: number
      openGroups: number
      errorsLast24h: number
      errorsLast7d: number
    }
    byType: Array<{ type: string; count: number }>
    bySeverity: Array<{ severity: string; count: number }>
    trend: Array<{ date: string; count: number }>
    recentErrors: Array<{ _id: string; message: string; severity: string; type: string; createdAt: string }>
    topGroups: Array<{ _id: string; title: string; count: number; lastSeen: string }>
  } }>('/api/stats')
)

// Auto refresh every 30 seconds – sadece client'ta çalışır
onMounted(() => {
  const interval = setInterval(refresh, 30000)
  onUnmounted(() => clearInterval(interval))
})

const statsCards = computed(() => {
  const overview = stats.value?.data?.overview
  return [
    {
      label: 'Toplam Hata',
      value: overview?.totalErrors?.toLocaleString('tr') ?? 0,
      icon: 'lucide:alert-circle',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      sub: `Son 24 saat: ${overview?.errorsLast24h ?? 0}`,
    },
    {
      label: 'Açık Gruplar',
      value: overview?.openGroups?.toLocaleString('tr') ?? 0,
      icon: 'lucide:layers',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      sub: `Toplam: ${overview?.totalGroups ?? 0} grup`,
    },
    {
      label: 'Son 7 Gün',
      value: overview?.errorsLast7d?.toLocaleString('tr') ?? 0,
      icon: 'lucide:calendar',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Aktif Domainler',
      value: overview?.totalDomains?.toLocaleString('tr') ?? 0,
      icon: 'lucide:globe',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
    },
  ]
})

const totalErrors = computed(() =>
  (stats.value?.data?.byType || []).reduce((s, i) => s + i.count, 0)
)

function getPercent(count: number): number {
  if (!totalErrors.value) return 0
  return Math.round((count / totalErrors.value) * 100)
}

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr })
  } catch {
    return dateStr
  }
}
</script>
