<script>
    let {children, url, icon, hint} = $props()
</script>
<a href="{url}">{@render children?.()}
 <img src="{icon}" alt="">
</a>

<style lang="stylus">
    img 
        width: 100%
        color: red

</style>
