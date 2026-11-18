// Legal pages served publicly at /legal, /legal/terms, /legal/privacy, /legal/copyright.
// These describe what THIS app actually does. They are plain-language templates, not legal advice:
// have them reviewed before relying on them commercially.
import { esc } from './views.js';

export const EFFECTIVE = 'November 18, 2026';

const contact = (email) =>
  email
    ? `<a href="mailto:${esc(email)}">${esc(email)}</a>`
    : 'the contact options listed on <a href="https://285garage.com/">285garage.com</a>';

export const LEGAL_PAGES = {
  terms: {
    title: 'Terms of Use',
    body: (c) => `
<p>These terms cover your use of the H.OL.L.Y.W.O.O.D. Ja1lbreåk developer dashboard ("the Dashboard"), a private tool operated by 285 Garage ("we", "us"). By signing in you agree to them.</p>

<h2>1. Authorized use only</h2>
<p>The Dashboard is for approved users only. Accounts are created by the operator. Do not share your login, and do not try to access accounts, data, or systems you are not authorized to use. Any security testing you do with it must be on systems you own or have written permission to assess.</p>

<h2>2. What the Dashboard is</h2>
<p>It is a development workspace: a command directory, a code lab, developer tool prompts, security-review prompts, and saved project notes. The name is a brand; the Dashboard is not a game-console or device jailbreak tool.</p>

<h2>3. AI output is advisory</h2>
<p>When the optional AI assistant is enabled, its answers can be wrong, incomplete, or insecure. Review, test, and back up any code before you use it in production. Do not paste passwords, API keys, or other secrets into the assistant or your notes.</p>

<h2>4. Your content</h2>
<p>You keep ownership of the notes and code you enter. You give us permission to store and process that content only to run the Dashboard for you (including sending prompts to the configured AI provider when you use the assistant). You are responsible for having the right to submit anything you enter, including code and assets that belong to other people.</p>

<h2>5. Our content</h2>
<p>The Dashboard software, design, text, and the 285 Garage and H.OL.L.Y.W.O.O.D. names and logos belong to 285 Garage or its licensors. You may not copy, resell, or redistribute them without permission. See <a href="/legal/copyright">Copyright &amp; Trademarks</a>.</p>

<h2>6. Third-party names</h2>
<p>Grand Theft Auto, FiveM, and other third-party names mentioned in the Dashboard belong to their owners. 285 Garage is not affiliated with or endorsed by them.</p>

<h2>7. No warranty; limited liability</h2>
<p>The Dashboard is provided "as is" and "as available," without warranties of any kind. To the extent allowed by law, we are not liable for indirect or consequential losses, lost data, or lost profits arising from its use. Nothing in these terms limits liability that cannot be limited by law.</p>

<h2>8. Suspension and changes</h2>
<p>We may suspend access or change the Dashboard at any time. We may update these terms; the effective date above changes when we do, and continued use means you accept the update.</p>

<h2>9. Contact</h2>
<p>Questions about these terms: ${contact(c)}.</p>`,
  },

  privacy: {
    title: 'Privacy Policy',
    body: (c) => `
<p>This explains what the Dashboard stores and why. It is a small private tool, so we keep very little.</p>

<h2>What we store</h2>
<ul>
<li><b>Account:</b> your username, a salted password hash (never the password itself), your role, and when the account was created.</li>
<li><b>Notes:</b> the titles and text of notes you choose to save.</li>
<li><b>Sessions:</b> a hashed session token and security token, kept for 12 hours after sign-in.</li>
<li><b>Rate-limit counters:</b> to slow down abuse we keep short-lived counters keyed to your IP address (for sign-in) or your account (for requests).</li>
<li><b>Server logs:</b> Cloudflare may log technical request data (such as IP address and error details) for operations and security.</li>
</ul>

<h2>Cookies</h2>
<p>We use only strictly necessary cookies: a sign-in session cookie and a short-lived security cookie used to protect the sign-in form. We do not use advertising or analytics cookies.</p>

<h2>AI assistant (optional)</h2>
<p>If the operator turns the AI assistant on, the text you submit to it is sent to the configured AI provider to generate a reply. Do not submit secrets or personal data you do not want processed by that provider. If the assistant is off, nothing is sent anywhere.</p>

<h2>How we use data</h2>
<p>Only to run, secure, and maintain the Dashboard. We do not sell your data and do not use it for advertising.</p>

<h2>Where it lives and how long</h2>
<p>Data is stored in a Cloudflare D1 database on the operator's Cloudflare account. Notes stay until you delete them (use the Delete button on a note in Project Notes). Sessions expire automatically. Ask us to delete your account and data at any time.</p>

<h2>Security</h2>
<p>Passwords are hashed, pages are served over HTTPS, forms are protected against cross-site request forgery, and content is escaped before display. No system is perfectly secure, so keep secrets out of notes and prompts.</p>

<h2>Children</h2>
<p>The Dashboard is not directed to children under 13 and accounts are not created for them.</p>

<h2>Contact and requests</h2>
<p>To ask about, correct, or delete your data, contact ${contact(c)}.</p>`,
  },

  copyright: {
    title: 'Copyright &amp; Trademarks',
    body: (c) => `
<h2>Ownership</h2>
<p>© ${new Date().getFullYear()} 285 Garage. All rights reserved. The Dashboard's code, layout, text, and graphics, and the "285 Garage" and "H.OL.L.Y.W.O.O.D. Ja1lbreåk" names, are owned by 285 Garage or used with permission. No part may be copied, reproduced, or redistributed without prior written permission, except as allowed by law.</p>

<h2>Third-party trademarks and no affiliation</h2>
<p>Grand Theft Auto, GTA, Rockstar Games, and Take-Two Interactive are trademarks of their respective owners. FiveM and Cfx.re are trademarks of their respective owners. Vehicle makes, models, and logos mentioned anywhere on 285 Garage are trademarks of their manufacturers and are used only to identify real-world vehicles that in-game models resemble. <b>285 Garage is not affiliated with, sponsored by, or endorsed by any of these companies.</b></p>

<h2>Your content and credits</h2>
<p>Only submit content you created or have the right to use. If you build on third-party scripts, models, sounds, or tools, follow their licenses and keep any required credit.</p>

<h2>Reporting infringement</h2>
<p>If you believe content on a 285 Garage property infringes your copyright, contact ${contact(c)} with:</p>
<ul>
<li>your name and contact details;</li>
<li>a description of the work you say was infringed;</li>
<li>where the material appears (a link or description);</li>
<li>a statement that you have a good-faith belief the use is not authorized by the owner, its agent, or the law;</li>
<li>a statement that your information is accurate, and, under penalty of perjury, that you are the owner or authorized to act for the owner;</li>
<li>your signature (typed is fine).</li>
</ul>
<p>We review notices promptly and may remove or disable access to material while we do.</p>`,
  },
};

export function renderLegalPage(slug, contactEmail) {
  const p = LEGAL_PAGES[slug];
  return { title: p.title, html: p.body(contactEmail) };
}
