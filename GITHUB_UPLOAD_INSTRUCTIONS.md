# Uploading MathQuest Kids to GitHub and publishing it on GitHub Pages

- **Repository:** https://github.com/aalsammani/mathquest-kids
- **Expected website:** https://aalsammani.github.io/mathquest-kids/ (live only after the first successful deployment)
- **Prepared folder:** `C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready`
- **Same content as a ZIP:** `C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready.zip`

> **Use GitHub Desktop or Git, not the website's "Upload files" page.** GitHub's browser upload does not extract ZIP files: it would store the `.zip` itself as one file. Dragging in a folder is limited to 100 files at a time, and it can skip or flatten folders whose names start with a dot, such as `.github`. Without `.github/workflows/deploy.yml` nothing is built or deployed.

---

## 1. What to upload

Upload **everything inside** the `MathQuest-Kids-GitHub-Ready` folder (its contents, not the folder itself), so these sit at the top level of the repository:

```
.github/workflows/deploy.yml   ← builds, tests and deploys the site (required)
.gitattributes  .gitignore     ← line endings and ignored files (required)
android/  ios/                 ← Capacitor native projects (keep for app-store builds)
docs/  legacy/  reports/       ← documentation, the original v1.1 app, validation evidence
public/icons/  resources/      ← web icons; source images for native icons and splash screens
scripts/  src/  tests/         ← build/test helpers, application source, all tests
index.html  package.json  package-lock.json  LICENSE  README.md  GITHUB_UPLOAD_INSTRUCTIONS.md
vite.config.ts  capacitor.config.ts  tsconfig.json
playwright.config.ts  playwright.pages.config.ts
vitest.config.ts  vitest.validation.config.ts  vitest.debug.config.ts
```

Do **not** upload `node_modules/`, `dist/`, `dist-pages/`, `dist-e2e/`, `dist-e2e-pages/`, `test-results/`, `reports/e2e*/`, keystores (`*.jks`, `*.keystore`, `keystore.properties`) or `.env` files. None of these are in the prepared folder, and `.gitignore` keeps them out if you create them later.

## 2. Keeping hidden folders (`.github`, `.gitignore`, `.gitattributes`)

- Windows: copying with File Explorer, `robocopy`, Git or GitHub Desktop keeps them. To see them in Explorer, choose **View → Show → Hidden items**. Names starting with a dot are not actually hidden on Windows, but this setting helps on some systems.
- macOS Finder hides dot-files. Press **Cmd + Shift + .** to show them before copying.
- Before you commit, check that GitHub Desktop's **Changes** list (or `git status`) includes `.github/workflows/deploy.yml`.

## 3A. Upload with GitHub Desktop (recommended)

This keeps the repository's existing history and shows every change before anything is sent.

1. Install GitHub Desktop (https://desktop.github.com) and sign in as **aalsammani**.
2. **File → Clone repository → URL**: `https://github.com/aalsammani/mathquest-kids`. Choose a local path, for example `C:\Users\abdallah\Documents\GitHub\mathquest-kids`, then click **Clone**.
3. Click **Fetch origin** (and **Pull origin** if offered) so the clone is fully up to date.
4. Close GitHub Desktop's view of the files. Then copy **the contents** of `MathQuest-Kids-GitHub-Ready` into the clone folder, choosing **Replace the files in the destination** when Explorer asks. Do **not** copy a `.git` folder (the prepared folder has none) and do not delete the clone's own `.git` folder.
   - Command-line alternative (PowerShell). It copies everything and keeps the clone's `.git`:
     ```powershell
     robocopy "C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready" "C:\Users\abdallah\Documents\GitHub\mathquest-kids" /E /XD .git node_modules dist dist-pages dist-e2e dist-e2e-pages test-results
     ```
5. Back in GitHub Desktop, open the **Changes** tab and review the list:
   - Green (added) and yellow (modified) files come from the prepared folder.
   - Files that exist **only on GitHub** are not touched. If old files remain that the new app no longer needs (for example an old single-file `index.html` in another folder), you can delete them yourself. If you are unsure, leave them.
6. Enter a summary such as `MathQuest Kids 2.0: TypeScript app with GitHub Pages deployment` and click **Commit to main**.
7. Click **Push origin**.

## 3B. Upload with Git (command line)

```powershell
cd C:\Users\abdallah\Documents\GitHub
git clone https://github.com/aalsammani/mathquest-kids.git
cd mathquest-kids
git pull                     # make sure you have the latest remote changes
robocopy "C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready" . /E /XD .git node_modules dist dist-pages dist-e2e dist-e2e-pages test-results
git add -A
git status                   # review: .github/workflows/deploy.yml must be listed
git commit -m "MathQuest Kids 2.0: TypeScript app with GitHub Pages deployment"
git push origin main
```

(`robocopy` returns exit code 1 when it copied files successfully. That is not an error.)

## 4. Not overwriting other changes on GitHub

- Always **clone or pull first**, then copy the prepared files in. Never start a fresh repository and push it over the existing one.
- **Never force-push** (`git push --force`, or "Force push" in GitHub Desktop). If a push is rejected because GitHub has newer commits, run **Pull origin** / `git pull`, resolve any conflicts the tool shows, and push again.
- If the repository might contain work you want to keep separately, push to a new branch first (GitHub Desktop: **Branch → New branch**, e.g. `v2-upgrade`). Then open a pull request on GitHub, review the diff, and merge it into `main`. The site deploys when the merge lands on `main`.
- Commits are made under your own GitHub identity. No other authors are added.

## 5. Turn on GitHub Pages (one time)

1. Open https://github.com/aalsammani/mathquest-kids → **Settings** → **Pages** (left sidebar, under *Code and automation*).
2. Under **Build and deployment → Source**, choose **GitHub Actions**. If the site was previously published with *Deploy from a branch*, switching to *GitHub Actions* is required. Otherwise GitHub keeps serving the old files.
3. There is nothing else to fill in. The workflow in `.github/workflows/deploy.yml` does the rest.
4. If you pushed **before** completing step 2, the first run fails at *Read GitHub Pages settings*. Complete step 2, then open **Actions → Deploy to GitHub Pages → Run workflow** (or re-run the failed run).
5. The repository must be public for Pages on a free GitHub plan.

## 6. Check that the deployment worked

1. Open the **Actions** tab. The run **Deploy to GitHub Pages** has two jobs, *Test and build* and *Deploy to GitHub Pages*. The first takes roughly 5 to 10 minutes (type check, 213 unit tests, 364,000-question math validation, build, build verification, browser tests).
2. Both jobs should show a green check. The run summary prints **✅ Deployed: https://aalsammani.github.io/mathquest-kids/**.
   - If a step is red, the run summary explains the common causes. For browser-test failures, download the **playwright-report** artifact from the run page. Nothing is deployed when any check fails, and the previous version stays online.
3. Open https://aalsammani.github.io/mathquest-kids/ (a minute or two after the run) and check:
   - The welcome screen appears with the rounded MathQuest fonts and the colourful styling, not plain black-on-white text.
   - Choose a level, open each of the four levels, start a lesson and a practice question, and open Math Tools, Story Adventures, the Game Room and Grown-Ups.
   - Press **F12 → Console**: there should be no red errors. In the **Network** tab, no request should be red (404).
   - Reload the page on any screen. The app reloads (screens are not separate URLs, so it returns to the home screen with progress kept).
   - On a phone, open the address. The layout fits the screen, and **Add to Home Screen / Install** offers "MathQuest Kids".
   - After one visit, turn on airplane mode and reload. The app still opens (offline support).
4. Progress is saved in each browser's own storage. The web version and the Android/iOS apps do not share progress.

## 7. Updating the app later

1. Make changes in your clone (`C:\Users\abdallah\Documents\GitHub\mathquest-kids`), not in the prepared folder, so you keep using the same Git history.
2. First time on a computer: install Node.js 22 or newer (24 LTS recommended), then run `npm ci`.
3. Test locally:
   ```powershell
   npm run typecheck; npm test; npm run validate:math
   npm run test:pages        # builds dist-pages/ and runs browser tests under /mathquest-kids/ (uses Microsoft Edge)
   npm run preview:pages     # look at it yourself: http://localhost:4175/mathquest-kids/
   ```
4. Optionally bump `"version"` in `package.json`. It appears in the app's settings and data exports.
5. Commit and push to `main`. The workflow tests and redeploys automatically. Visitors get the new version on their next visit; a second reload shows it if the page was already open.
6. For Android/iOS builds, use `npm run build` and then `npx cap sync` (see `docs/ANDROID_BUILD.md` and `docs/IOS_BUILD.md`). Do not run `cap sync` after `npm run build:pages`.
7. If the repository is ever renamed, nothing needs to change: the workflow reads the new path from the Pages settings.

More detail on how the Pages build works: [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md).
