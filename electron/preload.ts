const modules = import.meta.glob(['./pre-loaders/*.ts', '!./pre-loaders/*.d.ts'], {
  eager: true,
  import: 'default',
})
Object.entries(modules).forEach(([_, _loader]) => {
  const loader = _loader as Function
  loader()
})
