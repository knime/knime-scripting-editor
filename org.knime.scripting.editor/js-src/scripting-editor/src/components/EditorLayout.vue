<script>
import { defineComponent, inject } from 'vue';

import HeaderBar from './HeaderBar.vue';
import FooterBar from './FooterBar.vue';

import Splitter from './Splitter.vue';
import LeftPane from './LeftPane.vue';

import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

export default defineComponent({
    name: 'Layout',
    components: {
        LeftPane,
        HeaderBar,
        FooterBar,
        Pane,
        Splitpanes,
    },
    data() {
        return {
            paneSizes: {
                left: 20,
                right: 20,
            },
            previousPaneSizes: {
                left: 20,
                right: 20,
            },
        };
    },
    computed: {
        usedCenterPaneSize() {
            return 100 - this.paneSizes.left - this.paneSizes.right;
        },
    },
    methods: {
        onSplitterClick(event) {
            if (event.index === 1) {
                this.collapsePane('left');
            } else {
                this.collapsePane('right');
            }
        },
        collapsePane(pane) {
            if (this.paneSizes[pane] === 0) {
                this.paneSizes[pane] = this.previousPaneSizes[pane];
            } else {
                this.previousPaneSizes[pane] = this.paneSizes[pane];
                this.paneSizes[pane] = 0;
            }
        },
        onResize(event) {
            this.paneSizes.left = event[0].size;
            this.paneSizes.right = event[2].size;
        },
    },
});
</script>

<template>
  <div class="layout">
    <HeaderBar>
      <template #buttons>
        <slot name="buttons" />
      </template>
    </HeaderBar>
    <splitpanes
      class="default-theme"
      @splitter-click="onSplitterClick"
      @resize="onResize"
    >
      <pane
        :size="paneSizes.left"
        pane-id="left"
      >
        <LeftPane>
          <template #conda_env>
            <slot name="conda_env" />
          </template>
          <template #inputs>
            <slot name="inputs" />
          </template>
        </LeftPane>
      </pane>
      <pane :size="usedCenterPaneSize">
        <splitpanes
          horizontal
        >
          <pane size="70">
            <slot name="editor" />
          </pane>
          <pane
            size="30"
            min-height="10"
          >
            <slot name="bottom" />
          </pane>
        </splitpanes>
      </pane>
      <pane
        :size="paneSizes.right"
        pane-id="rightPane"
      >
        <div class="right-pane">
          <slot name="right-pane" />
        </div>
      </pane>
    </splitpanes>
    <FooterBar />
  </div>
</template>

<style lang="postcss" scoped>

.layout{
  --controls-height: 49px;
  --description-button-size: 15px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--knime-gray-ultra-light);
  border-left: 1px solid var(--knime-silver-sand);
}

</style>
