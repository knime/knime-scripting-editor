<script>
import { defineComponent } from 'vue';

import HeaderBar from './HeaderBar.vue';
import FooterBar from './FooterBar.vue';

import Splitter from './Splitter.vue';
import LeftPane from './LeftPane.vue';
import RightPane from './RightPane.vue';


export default defineComponent({
    name: 'Layout',
    components: {
        LeftPane,
        HeaderBar,
        FooterBar,
        RightPane,
        Splitter,
    },
    inject: ['workspaceVariables'],
    data() {
        return {
            isExpanded: false,
            emptyWorkspace: this.workspaceVariables.length,
        };
    },
    computed: {
        isNew() {
            return this.isExpanded || this.emptyWorkspace;
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
    <div class="center">
      <LeftPane
        :expanded="isExpanded"
        @toggle-expand="isExpanded = !isExpanded"
      >
        <template #conda_env>
          <slot name="conda_env" />
        </template>
        <template #inputs>
          <slot name="inputs" />
        </template>
      </LeftPane>
      <Splitter
        id="2"
        direction="row"
        secondary-size="20%"
        class="splitter"
      >
        <template #default>
          <Splitter
            id="1"
            direction="column"
            secondary-size="20%"
            class="splitter"
          >
            <template #default>
              <slot name="editor" />
            </template>
            <template #secondary>
              <slot name="bottom" />
            </template>
          </Splitter>
        </template>
        <template #secondary>
          <RightPane class="right">
            <slot name="right-pane" />
          </RightPane>
        </template>
      </Splitter>
    </div>
    <FooterBar />
  </div>
</template>

<style lang="postcss" scoped>
.slide{
  display: flex;
  flex: 1 0;
  justify-items: flex-start;
  justify-content: space-evenly;
}

.splitter{
  &.row :deep(.secondary){
    min-height: 100%;
  }
}

.layout{
  --controls-height: 49px;
  --description-button-size: 15px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--knime-gray-ultra-light);
  border-left: 1px solid var(--knime-silver-sand);

  & .center{
    display: flex;
    height: calc(100vh - 2*var(--controls-height));
    width: 100%;
  }
}

</style>
