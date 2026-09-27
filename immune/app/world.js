(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('soulstack-world') || '{}') || {}; } catch { saved = {}; }
  const worlds = ['undertow', 'empryo', 'soul', 'coffee', 'water', 'crimson'];
  const world = params.get('world') || saved.world;
  root.dataset.world = worlds.includes(world) ? world : 'undertow';
  const mode = params.get('mode') || saved.mode;
  root.dataset.theme = ['dark','light'].includes(mode) ? mode : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  root.dataset.motion = params.get('motion') === 'still' || saved.motion === 'still' || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'still' : 'on';
})();
