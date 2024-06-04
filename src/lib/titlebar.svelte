<style>
    .titlebar {
  height: 30px;
  background: #329ea3;
  user-select: none;
  display: flex;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
.titlebar-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
}
.titlebar-button:hover {
  background: #5bbec3;
}
</style>

<script>
    import Icon from '@iconify/svelte';
    import { appWindow } from '@tauri-apps/api/window'
</script>

<div data-tauri-drag-region class='h-8 bg-surface-200'>
    <button class="float-right h-full px-1 cursor-default hover:bg-error-500" on:click={() => appWindow.close()}>
        <Icon color='black' height={24} icon="mdi:close" class='h-full'/>
    </button>
    <button class="float-right h-full px-1 cursor-default hover:bg-surface-50" 
        on:click={() => {appWindow.toggleMaximize();}}>
        <Icon color='black' height={24} icon="mdi:maximize" class='h-full'/>
    </button>
    <button class="float-right h-full px-1 cursor-default hover:bg-surface-50" on:click={() => appWindow.minimize()}>
        <Icon color='black' height={24} icon="mdi:minimize" class='h-full'/>
    </button>
</div>