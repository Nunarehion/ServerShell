<script>
    let {children} = $props()
</script>
<div class="sidebar">
    {@render children()}
</div>

<style lang="stylus">
    .sidebar
        background: var(--second-bg)
        height: 100%
        width: 100%
        padding: 1rem
        
</style>
