<template>
  <div class="min-h-screen bg-background flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-border bg-sidebar flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="lucide:bug" class="w-4 h-4 text-primary-foreground" />
          </div>
          <span class="font-semibold text-sidebar-foreground text-sm">Smart Error Tracker</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          ]"
        >
          <Icon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
          {{ item.label }}
          <span
            v-if="item.badge"
            class="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 leading-none"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-sidebar-border">
        <p class="text-xs text-sidebar-foreground/50">v1.0.0</p>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold text-foreground">{{ pageTitle }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="globalSearch"
              type="text"
              placeholder="Hata ara..."
              class="pl-9 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring w-64"
              @keydown.enter="handleSearch"
            />
          </div>
          <NuxtLink to="/domains/new">
            <button class="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              <Icon name="lucide:plus" class="w-4 h-4" />
              Domain Ekle
            </button>
          </NuxtLink>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const globalSearch = ref('')

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'lucide:layout-dashboard' },
  { path: '/errors', label: 'Hatalar', icon: 'lucide:alert-triangle' },
  { path: '/groups', label: 'Hata Grupları', icon: 'lucide:layers' },
  { path: '/domains', label: 'Domainler', icon: 'lucide:globe' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const pageTitle = computed(() => {
  const current = navItems.find(item => isActive(item.path))
  return current?.label || 'Smart Error Tracker'
})

function handleSearch() {
  if (globalSearch.value.trim()) {
    router.push(`/errors?search=${encodeURIComponent(globalSearch.value)}`)
  }
}
</script>
