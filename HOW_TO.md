### HOW TO: Run the GitHub Workflows for octo-billing


---

### What you’ll accomplish

- ✅ Build, test, and attest a Docker image for `octo-billing` using the "Build, Test & Attest" workflow
- ✅ Verify provenance and test results, then promote a specific image version from `dev-docker-local` to `prod-docker-local` using the "Promote Release to Production" workflow

---

### Visual overview

```
Code → GitHub Actions → Build, Test & Attest
   ├─ 🐳 Build & Push image to registry
   ├─ 🧾 Attest build provenance (SBOM-style metadata)
   ├─ 🧪 Run integration tests
   └─ 📎 Attest test report

Later → GitHub Actions → Promote Release to Production (manual)
   ├─ 🔍 Verify provenance & test results for chosen image:version
   └─ 🚚 Promote from dev-docker-local → prod-docker-local
```

---

### Prerequisites (already configured for this repo)

- **Self-hosted runner** available (required by both workflows)
- **Repository Variables** set:
  - `JF_URL`
  - `JF_REGISTRY`
- **OIDC provider** configured and referenced as `swampup-2025/octo-billing@github`
- **JFrog CLI** and permissions via OIDC (handled by the workflow)

If any of these are missing, the workflows will fail early with a clear error.

---

### 1) Build, Test & Attest

- **Workflow name**: Build, Test & Attest
- **File**: `.github/workflows/build-and-test.yml`
- **Triggers**:
  - On push to `main`
  - Manual: Actions → Build, Test & Attest → "Run workflow"

What it does (under the hood):
- 🔑 Sets up JFrog CLI with OIDC
- 🔐 Logs in to Docker registry
- 🏗️ Builds and pushes the Docker image `${JF_REGISTRY}/octo-billing:${run_number}`
- 🧾 Attests build provenance (links image → exactly how it was built)
- 🟢 Installs Node.js 16 and project deps
- 🧪 Runs integration tests and writes JSON report to `coverage/integration/itest-report.json`
- 📎 Attests the test report so it’s verifiable later
- 🧭 Writes a handy summary with:
  - Image tag
  - Registry/repository info
  - Direct JFrog link to the package

How to run it (manual):
1. Go to the repo in GitHub → **Actions**
2. Select **Build, Test & Attest**
3. Click **Run workflow** → leave defaults → **Run**
4. Open the latest run → Check the **Summary** tab for:
   - The image tag: `octo-billing/${run_number}`
   - The full image reference: `${JF_REGISTRY}/octo-billing:${run_number}`
   - A link to the package in JFrog

Keep the image version (the number) handy—you’ll need it to promote.

---

### 2) Promote Release to Production

- **Workflow name**: Promote Release to Production
- **File**: `.github/workflows/promote-to-prod.yml`
- **Trigger**: Manual only (workflow_dispatch)

What it does (under the hood):
- 🔑 Sets up JFrog CLI with OIDC
- 🔍 Verifies build provenance and test results for the exact image you choose
- 🚚 Promotes the Docker image from `dev-docker-local` → `prod-docker-local`
- 🧭 Writes a summary of what happened

Info you need before running:
- **Image name**: usually `octo-billing`
- **Image version**: the run number you built earlier (e.g., `123`)

Where to find the image version:
- From the previous workflow’s **Build Summary**
- Or in JFrog: look for package `octo-billing/<run_number>` in `dev-docker-local`

How to run it:
1. Go to the repo in GitHub → **Actions**
2. Select **Promote Release to Production**
3. Click **Run workflow**
4. Fill in:
   - Image name: `octo-billing` (default)
   - Image version: the number from the build (e.g., `123`)
5. Click **Run**

What you’ll see:
- In the **Summary**, a section for attestation verification and promotion details
- If verification fails, promotion won’t proceed—fix the issue and rerun

---

### Troubleshooting quick wins

- ❌ Self-hosted runner offline
  - Make sure the runner is online and has Docker and network access.

- ❌ Missing repo variables (`JF_URL`, `JF_REGISTRY`)
  - Check Settings → Secrets and variables → Actions → Variables.

- ❌ OIDC auth errors
  - Ensure the OIDC provider name matches `swampup-2025/octo-billing@github` and the trust is established in JFrog.

- ❌ Attestation verification fails during promotion
  - Verify that the image:version exists in `dev-docker-local` and that the test report attestation succeeded in the build workflow.

- ❌ Docker promote fails
  - Confirm permissions for promoting from `dev-docker-local` to `prod-docker-local` and that the image name/version are correct.

---

### FAQs

- **What image tag format is used?**
  - `${JF_REGISTRY}/octo-billing:${github.run_number}`

- **Where is the test report stored?**
  - In the repo: `coverage/integration/itest-report.json` (also attested)

- **Can I rerun just the promotion?**
  - Yes. The promotion is independent and can be run any time with the correct `image-name` and `image-version`.

- **What if I want to promote a different tag?**
  - Choose the image name and version you want in the promotion inputs. If there are multiple options, pick the tag that passed tests and provenance verification.

---

### Copy/paste helpers

- Image name: `octo-billing`
- Example image version: `123`
- Example full reference: `${JF_REGISTRY}/octo-billing:123`

That’s it—you now know how to build, test, attest, verify, and promote images for `octo-billing`.


