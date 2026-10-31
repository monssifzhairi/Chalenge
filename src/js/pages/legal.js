import { initCommon } from '../main.js';
import { initScrollSpy } from '../components/scrollspy.js';
import { bag } from '../components/bag.js';
import { KEYS, storage } from '../lib/storage.js';
import { $ } from '../lib/dom.js';

initCommon();
initScrollSpy();

$('[data-clear-storage]')?.addEventListener('click', () => {
  bag.clear();
  Object.values(KEYS).forEach((key) => storage.remove(key));
  $('[data-clear-status]').textContent = 'Done — your bag and preferences have been removed from this device.';
});
