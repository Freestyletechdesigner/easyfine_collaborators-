# 🛠️ Tasks for Motion (Frontend Architecture & Asset Clean-up)

Your immediate task is to clean up and restructure our file directory to keep our codebase organized and maintainable.

---

### 🎯 Primary Objectives

1. **CSS Files Directory:**
   - Move all `.css` files into the `/style` folder.

2. **JavaScript Files Directory:**
   - Move all `.js` files into the `/logic` folder.

3. **⚠️ DO NOT TOUCH / EXCLUDED FILES:**
   - Leave the following files strictly in their current locations (do not move or rename them):
     - `/public/onesignal-init.js`
     - `/public/sitemap_2.xml`
     - `/agent-loged/profile.png`

4. **Path & Link Updates (Critical):**
   - Thoroughly check all `.html`, `.js`, and `.css` files across the project.
   - Update all relative asset paths (`<link href="...">`, `<script src="...">`, `import`, etc.) to point to the new `/style` and `/logic` directories so no styles, scripts, or connections break.

---

### 🚀 Submission Guidelines
- Once you finish moving the files and updating the path links, test the pages locally to make sure all styling and scripts load properly.
- Commit your changes and push directly to your branch/folder!