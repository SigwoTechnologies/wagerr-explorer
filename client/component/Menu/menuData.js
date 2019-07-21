export const genMenuData = (t) => {
  return [
    {label: t('overview'), icon: '/img/home.svg', href: '/'},
    {label: t('movement'), icon: '/img/movement.svg', href: '/movement'},
    {label: t('top'), icon: '/img/top100.svg', href: '/top'},
    {label: t('masternode'), icon: '/img/masternodes.svg', href: '/masternode'},
    // {label: t('governance'), icon: '/img/governance.svg', href: '/governance'},
    {label: t('Bet Events'), icon: '/img/betevent.svg', href: '/betevents'},
    {label: t('connections'), icon: '/img/connections.svg', href: '/peer'},
    {label: t('statistics'), icon: ' /img/statistics.svg', href: '/statistics'},
    {label: t('coinInfo'), icon: '/img/coininfo.svg', href: '/coin'},
    {label: t('api'), icon: '/img/api.svg', href: '/api'}
  ]
}

  export default {
    genMenuData
  }
