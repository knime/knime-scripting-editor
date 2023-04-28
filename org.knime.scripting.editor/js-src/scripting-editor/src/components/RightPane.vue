<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { TabOption } from './TabPane.vue';

export default defineComponent({
    name: 'RightPane',
    components: {},
    inject: ['workspaceVariables'],
    props: {
        name: {
            type: String,
            default: '',
        },
        initialTab: {
            type: String,
            default: '',
        },
        tabs: {
            type: Array as PropType<TabOption[]>,
            default() {
                return [];
            },
        },
    },
    data() {
        return {
            activeTab: this.initialTab,
            isExpanded: false,
        };
    },
    computed: {
        isWorkspaceEmpty() {
            // @ts-ignore:next-line TODO: injection key
            return this.workspaceVariables.length > 0;
        },
    },
    watch: {
        isWorkspaceEmpty: {
            handler(newValue, oldValue) {
                if (newValue !== oldValue) {
                    this.isExpanded = true;
                }
            },
        },
    },
});
</script>

<template>
  <div
    v-if="isExpanded"
    class="tab-pane"
  >
    <slot :active-tab="activeTab" />
  </div>
</template>

<style lang="postcss" scoped>

.tab-pane{
}
</style>
