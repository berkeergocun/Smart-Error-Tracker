<template>
  <div class="w-full h-full flex items-end gap-1">
    <div
      v-for="(item, i) in normalizedData"
      :key="i"
      class="flex-1 flex flex-col items-center gap-1 group"
    >
      <div
        class="relative w-full bg-primary/80 hover:bg-primary rounded-sm transition-all cursor-default"
        :style="{ height: `${Math.max(item.pct, 4)}%` }"
        :title="`${item.date}: ${item.count} hata`"
      />
      <span
        v-if="i % 2 === 0"
        class="text-[10px] text-muted-foreground rotate-45 origin-left whitespace-nowrap"
      >
        {{ formatShortDate(item.date) }}
      </span>
    </div>
    <div v-if="!data.length" class="w-full h-full flex items-center justify-center">
      <span class="text-sm text-muted-foreground">Veri yok</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Array<{ date: string; count: number }>
}>()

const normalizedData = computed(() => {
  if (!props.data.length) return []
  const max = Math.max(...props.data.map(d => d.count), 1)
  return props.data.map(d => ({
    ...d,
    pct: Math.round((d.count / max) * 85) + 5,
  }))
})

function formatShortDate(date: string): string {
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
</script>
