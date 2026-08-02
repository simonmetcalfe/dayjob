module.exports = {
  outDir: 'bld',
  packagerConfig: {
    ignore: ['/bld', '/assets_readme', '/\\.cursor', '/CLAUDE\\.md', '/forge\\.config\\.js']
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'dayjob'
      }
    }
  ]
};
