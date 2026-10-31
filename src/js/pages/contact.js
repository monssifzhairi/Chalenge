import site from '../../../site.config.js';
import { initCommon } from '../main.js';
import { initContactForm } from '../components/forms.js';
import { waLink } from '../lib/whatsapp.js';

initCommon();
initContactForm({ waLink, email: site.email });
