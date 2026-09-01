# Living Hope: build state and what still gets plugged in

Last updated 2026-08-29. The site is complete and deployable as-is. Everything below is a small edit when the missing piece arrives.

## What this folder is
10 pages of plain HTML, CSS and JS. No framework, no build step, no runtime dependencies. Open `index.html` or serve the folder and it runs.

Pages: Home, About, Programs, Stories, Blog, Investors, Give, Contact, Survivor Support, plus a 404.

## Built from Jessie's answers (questionnaire returned 08-28)
- Pages she listed (Home, About, Contact, Blog, Donate, Investors) are all in. Get Connected renamed Contact. Programs, Stories and Survivor Support kept because they carry the mission.
- The Investors page is built from her own master-plan document: three phases, the four enterprises, and how to partner.
- Allies trimmed to her three: Take Flight, Nashville Anti-Human Trafficking Coalition, Magnolia Ministries.
- The Well Global SSM certification removed. She has more to add later.
- The old survivor testimonials (Amanda, Jessica, Melissa) and partner quotes stay out. She confirmed they were filler.
- Palette follows her note exactly: light and cream-forward, no large dark sections, gold used sparingly, no clay.
- A content note sits above the testimony videos, per her request to warn people first.
- Her face rule is in force on layout choices. See the photo item below.

## 1. Donations, give.html
She wrote: "I am ready to set this up when you give me the go." Give her the go on the call. She opens the giving account in Living Hope's name herself (Zeffy, 0% for nonprofits) and sends back the embed code. Never ask for her bank login, only the embed.

Where it goes: `give.html`, the comment marked `PLUG-IN SLOT: online giving embed`. Replace the inner content of the `data-donation-slot` panel. Until then the page shows give-by-mail details and works fine.

## 2. Confirm the EIN
She wrote 38-432-4365. That is not a standard EIN shape, so it displays as **38-4324365** on the Give and Investors pages. Confirm the digits before launch.

## 3. Videos, stories.html
**08-29: the fourth video from the old site is now on the page** so the grid reads 2x2: "Trafficking Survivor Sula Lael, Intense and Vulnerable Story" (The Basement with Tim Ross, `BiqH4a8KUa4`). The old site carried four testimony videos and only three had been rebuilt.

She still wants a different Sula Lael video. This one stands in until she picks the replacement: swap the iframe `src` and the figcaption at the `PLUG-IN SLOT` comment when she sends the link.

Note for the call: Living Hope owns none of this footage. All four videos are embedded from other people's YouTube channels (three from Katie Hauck Ministries, one from The Basement with Tim Ross). Her own channel has no trafficking testimonies beyond the three already used, so any fifth video has to come from somewhere she approves.

## 4. Photos
**Face rule applied 08-29.** No photo on the site shows an identifiable face except Jessie's own headshot.

Removed (they showed faces, and the old-site content archive confirms they sat in the WordPress media library but were never displayed on any live page, so there is no prior-use argument and no licence for them):
- `women-linking-arms.jpg` (Home mission, About hero)
- `women-group.jpg` (Programs, Stories hero)
- `woman-smiling.jpg` (Survivor Support hero)

Replaced with Unsplash photography (Unsplash Licence: free for commercial use, attribution not required). Source IDs kept so any of these can be traced or swapped:

| File | Where | Unsplash ID |
|---|---|---|
| `women-embrace-field.jpg` | Home, Our Mission | photo-1696329122344-9e18adf5461e |
| `women-arms-behind.jpg` | Programs, Life Skills | photo-1555819206-7b30da4f1506 |
| `light-through-trees.jpg` | About hero | photo-1609088810733-c3b2eb8df983 |
| `hands-clasped.jpg` | Stories hero | photo-1564020435666-f67ed5319a32 |
| `window-light.jpg` | Survivor Support hero | photo-1574197635162-68e4b468e4e9 |

Kept from the old site because they show no face: `cross-sunrise.jpg`, `lavender-hand.jpg`, `path-sunset.jpg`.

Kept for now, but **they do show faces** and were also library-only on the old site. Flag to Jessie: `woman-meadow.jpg` (Programs, Investors), `women-embracing.jpg`, `women-trail.jpg` (Home).

Jessie's headshot is now the photo she sent 08-28 (`Jessie-Coates-Profile.png`, cropped to 1023x1168 as `assets/img/jessie-coates.jpg`). The old compressed one is parked in `_unused/jessie-coates-OLD.jpg`.

Unused originals are parked in `assets/img/_unused/` and can be deleted.

## 5. Social links
No real social URLs exist anywhere on the old site. The footer ships without icons on purpose. When she sends them, add the icons to the footer and a `sameAs` array to the JSON-LD block in each page head.

## 6. Domain
She sent the email about the domain. Confirm who actually holds livinghope61.com **before** the old website company is cancelled, or the domain can go with it. Every canonical, OG and sitemap URL assumes livinghope61.com; if it changes, search and replace across the HTML plus sitemap.xml and robots.txt.

## 7. Blog
Live with a "first stories on the way" card. Replace with real posts as she writes them.

## 8. Forms
Both forms open the visitor's own email app addressed to livinghopeinc61@gmail.com, which she confirmed as the destination. Nothing is stored on the website and there is no third-party service to configure or pay for.

## Contact details in use
236 E Main St #258, Sevierville, TN 37862
(865) 209-8210
livinghopeinc61@gmail.com
Invoices: Jessie Coates, President/Director, Living Hope Inc., copy cdbbull@gmail.com.

## Trauma-informed features already built in
- Quick Exit button in the header of every page. It opens a weather search and replaces the history entry, so the Back button will not return to the site.
- Tennessee and National hotlines in the footer of every page, and prominently on the Survivor Support page.
- The survivor form explains exactly how contact will happen and that nothing is stored.

## Motion, 08-29
The site has a motion system, no libraries, all of it inside `@media (prefers-reduced-motion: no-preference)` and all of it gated on JavaScript being on. Turn either off and the site is complete and static.

- **Section cascade.** A section's blocks arrive in markup order rather than as one slab: the gold eyebrow rule draws first, then the heading, body and call to action. `js/main.js` assigns the delays, so a new section inherits it with no extra markup.
- **Photo frames.** The inset rule opens outward on hover and the picture scales very slightly. Nothing moves on load beyond the existing cross-fade.
- **Cards.** Panels and video cards lift and grow a gold rule on hover, both slowed to 0.75s and 0.9s. In a grid they arrive one after another, 0.14s apart. The lift uses the independent `translate` property, not `transform`, because the reveal rule owns `transform` at higher specificity and would strip the lift's timing.
- **Buttons.** Olive sweeps in from the left, then a gold rule draws along the bottom. Ghost and outline buttons keep a quick crossfade instead of the sweep on purpose: they flip their text colour, and a half-swept fill would leave half a word sitting on its own colour.
- **Not used, and not to be added back:** anything that follows the cursor, and any wipe or zoom across a photograph. Both were tried and rejected.

Verified: axe-core 0 violations across 10 pages at desktop and mobile, 0 horizontal overflow at 1440, 390 and 320, every reveal lands within 260ms of entering the viewport, and nothing is left invisible with JavaScript off or under reduced motion.

## Accessibility, for the client conversation
Built and tested to WCAG 2.2 AA. Automated scanning (axe-core) across all pages at desktop and mobile, including the open mobile menu, returns zero violations. Keyboard navigation, reflow at 320px, reduced motion and images-without-JavaScript all verified.

Say "built and tested to WCAG 2.2 AA". Never say ADA compliant, certified, guaranteed, or lawsuit-proof. Anything about legal obligations goes to a lawyer.

## Editing note for future work
The pages are generated by `build.py` (kept with the project source, not in this folder). If that pipeline is in play, edit the templates and rebuild rather than hand-editing the HTML, or the next build overwrites the change.
