# Updating MathQuest Kids on GitHub (version 2.1.0)

- **Repository:** https://github.com/aalsammani/mathquest-kids (GitHub Pages is already set to **GitHub Actions**)
- **Live site:** https://aalsammani.github.io/mathquest-kids/ (it updates only after you push and the workflow succeeds)
- **Prepared folder:** `C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready-v2.1`
- **Same content as a ZIP:** `C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready-v2.1.zip`
- **Git bundle with the exact commits:** `C:\Users\abdallah\Documents\MathQuest-Kids-v2.1.bundle` (branch `revision-2.1`, based on `main` at `be18c11`)

The previous package (`MathQuest-Kids-GitHub-Ready` and its ZIP) is left untouched.

> **Do not use the website's "Upload files" page.** It does not extract ZIP files, it is limited to 100 files at a time, it can drop folders whose names start with a dot (such as `.github`), and it cannot **delete** files. This update must delete some old generated files (see §2).

---

## 1. What changes

Version 2.1.0 changes the source (`src/`), tests (`tests/`), documentation (`docs/`, `README.md`) and a few configuration files (`package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, and the new `playwright.ipad.config.ts`). The GitHub Actions workflow (`.github/workflows/deploy.yml`) is unchanged. The full list is in [docs/CHANGELOG.md](docs/CHANGELOG.md).

## 2. Files to DELETE from the repository

The repository contains generated build output that was uploaded through the website earlier. It is listed in `.gitignore` and should not be in the repository:

```
dist/          (old production build)
dist-e2e/      (old test build, including a test-only hook)
reports/e2e/   (old test-run output)
```

GitHub Pages does not serve these folders (it serves the fresh build made by the workflow), but they are stale and confusing. Option A deletes them automatically; with options B and C you delete them yourself.

## 3A. Recommended: bring in the prepared commits (Git command line)

This keeps every change as a reviewable commit (made with your Git identity, no other authors), includes the deletions, and does not overwrite anything without showing it first.

```powershell
cd C:\Users\abdallah\Documents\GitHub            # or wherever you keep repositories
git clone https://github.com/aalsammani/mathquest-kids.git   # skip if you already have a clone
cd mathquest-kids
git checkout main
git pull                                          # get any changes made on GitHub since be18c11
git fetch "C:\Users\abdallah\Documents\MathQuest-Kids-v2.1.bundle" revision-2.1:revision-2.1
git log --oneline main..revision-2.1              # the v2.1 commits
git diff --stat main...revision-2.1               # what they change
git push -u origin revision-2.1                   # upload the branch (does NOT change main or the site yet)
```

Then on GitHub: **Pull requests → New pull request → base: `main`, compare: `revision-2.1`**. Review the changes, then **Merge pull request**. Merging into `main` starts the deployment.

If `main` changed on GitHub after `be18c11`, the pull request shows any conflicts. GitHub's editor, or `git merge main` on the branch, lets you resolve them without losing either side.

## 3B. With GitHub Desktop (copy the prepared folder)

1. Open your clone of `aalsammani/mathquest-kids` (or **File → Clone repository**). Click **Fetch origin** / **Pull origin**.
2. **Branch → New branch** → `revision-2.1` (based on `main`).
3. In File Explorer, **delete** the folders `dist`, `dist-e2e` and `reports\e2e` in the clone (§2).
4. Copy **the contents** of `C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready-v2.1` into the clone folder and choose **Replace the files in the destination**. Do not copy or delete any `.git` folder. Or in PowerShell:
   ```powershell
   robocopy "C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready-v2.1" "C:\Users\abdallah\Documents\GitHub\mathquest-kids" /E /XD .git node_modules dist dist-pages dist-e2e dist-e2e-pages test-results
   ```
   (`robocopy` returns exit code 1 when it copied files successfully. That is not an error.)
5. In **Changes**, review the list: the deleted `dist…` files, modified `src/…`, `tests/…` and `docs/…`, and the new `src/ui/speech.ts`, `tests/e2e/progression.spec.ts` and so on. Commit to `revision-2.1`, then **Publish branch**.
6. On GitHub, open a pull request from `revision-2.1` into `main`, review it, and merge.

## 3C. Git without the bundle

Same as 3B, using commands:

```powershell
cd C:\Users\abdallah\Documents\GitHub\mathquest-kids
git checkout main; git pull
git checkout -b revision-2.1
git rm -r -q dist dist-e2e reports/e2e
robocopy "C:\Users\abdallah\Documents\MathQuest-Kids-GitHub-Ready-v2.1" . /E /XD .git node_modules dist dist-pages dist-e2e dist-e2e-pages test-results
git add -A
git status
git commit -m "MathQuest Kids 2.1.0: activity flow, read-aloud and usability revision"
git push -u origin revision-2.1
```

Then open and merge the pull request on GitHub.

## 4. Safety rules

- **Never force-push** (`git push --force`, or "Force push" in GitHub Desktop). If a push is rejected, pull first, resolve, and push again.
- Work on the `revision-2.1` branch and merge through a pull request. Until you merge, `main` and the live site stay exactly as they are.
- Commits are made under your own GitHub identity. No other authors or co-author lines are added.

## 5. Check the deployment

1. **Actions** tab → **Deploy to GitHub Pages** (it starts when the merge lands on `main`). It takes longer than before, roughly 10 to 15 minutes, because there are more browser tests (full 10-question sessions in every level, games, read-aloud).
2. Both jobs should be green, and the summary shows **✅ Deployed**. If a step is red, nothing was deployed and the old version stays online; download the **playwright-report** artifact from the run for details.
3. Open https://aalsammani.github.io/mathquest-kids/ and **reload twice**. The service worker installs the new version on the first visit and shows it on the next. ⚙️ Settings should show a **🔊 Read aloud** section with **Test voice**.
4. Quick check: do a practice round. It shows "Question 1 of 10", the **Next question →** button appears right under the feedback, and the round ends with results after 10.
5. **On a real iPad**, run [docs/IPAD_TEST_CHECKLIST.md](docs/IPAD_TEST_CHECKLIST.md) (about 15 minutes) and keep the record.

## 6. If something is wrong after deploying

On GitHub, open the merged pull request → **Revert** → merge the revert pull request. The workflow redeploys the previous version. No history is rewritten.

## 7. Future updates

Work in your clone on a new branch, run the checks, push, and merge through a pull request:

```powershell
npm ci
npm run typecheck; npm test; npm run validate:math
npm run test:pages                 # browser tests under /mathquest-kids/ (Microsoft Edge)
npm run preview:pages              # look yourself: http://localhost:4175/mathquest-kids/
```

Android/iOS: `npm run build`, then `npx cap sync` (see `docs/ANDROID_BUILD.md` and `docs/IOS_BUILD.md`). Never run `cap sync` after `build:pages`.
