module.exports = {
  outDir: 'bld/_build-temp',
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
  ],
  hooks: {
    postMake: require('./scripts/rename-installers')
  }
};
