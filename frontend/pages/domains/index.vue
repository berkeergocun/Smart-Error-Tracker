<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">Takip edilen domainleri yönetin</p>
      <NuxtLink to="/domains/new">
        <button class="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Yeni Domain
        </button>
      </NuxtLink>
    </div>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-40 bg-muted animate-pulse rounded-lg" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="domain in domains?.data || []"
        :key="domain._id"
        class="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors cursor-pointer"
        @click="navigateTo(`/domains/${domain.uuid}`)"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-sm font-semibold text-foreground">{{ domain.name }}</h3>
            <p class="text-xs text-muted-foreground mt-0.5">{{ domain.domain }}</p>
          </div>
          <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="lucide:globe" class="w-4 h-4 text-primary" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-muted/50 rounded-md p-2.5">
            <p class="text-xs text-muted-foreground">Toplam Hata</p>
            <p class="text-lg font-bold text-foreground">{{ domain.stats?.totalErrors || 0 }}</p>
          </div>
          <div class="bg-muted/50 rounded-md p-2.5">
            <p class="text-xs text-muted-foreground">Gruplar</p>
            <p class="text-lg font-bold text-foreground">{{ domain.stats?.totalGroups || 0 }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-xs text-muted-foreground font-mono truncate">
            {{ domain.uuid.slice(0, 20) }}...
          </p>
          <button
            class="p-1.5 hover:bg-muted rounded-md transition-colors"
            :title="'UUID kopyala'"
            @click.stop="copyUUID(domain.uuid)"
          >
            <Icon name="lucide:copy" class="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <NuxtLink
        to="/domains/new"
        class="border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div class="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
          <Icon name="lucide:plus" class="w-5 h-5 text-muted-foreground" />
        </div>
        <p class="text-sm text-muted-foreground">Domain Ekle</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi()

interface Domain {
  _id: string
  uuid: string
  name: string
  domain: string
  stats: { totalErrors: number; totalGroups: number }
}

const { data: domains, pending } = await useAsyncData('domains-list', () =>
  api.get<{ success: boolean; data: Domain[] }>('/api/domains')
)

async function copyUUID(uuid: string) {
  await navigator.clipboard.writeText(uuid)
}
</script>
