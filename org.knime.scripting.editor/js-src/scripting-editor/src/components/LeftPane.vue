<script>

/*
  I need some type of Icon as key with KeepAlive component.
*/

import CubeIcon from 'webapps-common/ui/assets/img/icons/cube.svg';
import PlusIcon from 'webapps-common/ui/assets/img/icons/circle-plus.svg';
import LeftCollapsiblePanel from './LeftCollapsiblePanel.vue';
import Button from 'webapps-common/ui/components/Button.vue';

import { defineComponent } from 'vue';

const TABS = {
    INPUT: 'inputs',
    CONDA: 'conda_env',
};

/*
TODO: Make this component with dynamic slots so we can implement it from the parent's project.


  <transition-group
    tag="ul"
    :css="false"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
  >
    <PlusIcon class="icons" />
    <CubeIcon class="icons" />
  </transition-group>


like.
interface UiSlot

interface ComponentPublicInstance {
  $slots: { [name: string]: UiSlot }
}
*/

export default defineComponent({
    name: 'LeftPane',
    components: {
        Button,
    },
    props: {
        initialTab: {
            type: String,
            default: 'conda_env',
        },
    },
    data(props) {
        return {
            activeTab: props.initialTab || null,
        };
    },
    computed: {
        sidebarSections() {
            return [
                { title: 'Input',
                    icon: CubeIcon,
                    isActive: this.isTabActive(TABS.INPUT),
                    onClick: () => this.clickItem(TABS.INPUT) },
                { title: 'Conda Environment',
                    icon: PlusIcon,
                    isActive: this.isTabActive(TABS.CONDA),
                    onClick: () => this.clickItem(TABS.CONDA) },
            ];
        },
    },
    methods: {
        isTabActive(tabName) {
            const activeTab = this.activeTab;
            return activeTab === tabName;
        },
        clickItem(tabName) {
            const isAlreadyActive = this.isTabActive(tabName);
            if (isAlreadyActive) {
                this.activeTab = null;
            } else {
                this.activeTab = tabName;
            }
        },
    },
});
</script>

<template>
  <div class="pane-layout">
    <nav class="nav-bar">
      <ul>
        <li
          v-for="section in sidebarSections"
          :key="section.title"
          @click="section.onClick"
        >
          <Button
            :key="section.title"
            :title="section.title"
            :class="{ active: section.isActive }"
          >
            <Component
              :is="section.icon"
              class="icon"
            />
          </Button>
        </li>
      </ul>
    </nav>
    <div v-show="activeTab === 'conda_env'">
      <slot name="conda_env" />
    </div>
    <div v-show="activeTab === 'inputs'">
      <slot name="inputs" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>


.slide{
  display: flex;
  flex: 0 0;
  justify-items: flex-start;
  justify-content: space-evenly;
}

.icon{
  width: auto;
  aspect-ratio: 1;
  left: 0;
  min-height: 50px;
  min-width: 100%;
}

.pane-layout{
  display: flex;
  flex-direction: row;
  height: 100%;
}

.nav-bar{
  width: var(--app-side-bar-width);
  background-color: var(--knime-black);

  & ul {
    display: contents;

    & li {
      height: 50px;
      width: 50px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: var(--knime-silver-sand);
      border-bottom: 1px solid var(--knime-black);
      transition: background-color 150ms ease-out;

      &.active {
        background-color: var(--knime-porcelain);
      }

      &:hover {
        background-color: var(--knime-gray-ultra-light);
        cursor: pointer;

        & svg {
          stroke: var(--knime-masala);
        }
      }
    }
  }

  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
}

.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}

</style>
