#!/usr/bin/env bash

set -euo pipefail

# Usage:
#   promotion.sh <src-repo> <dst-repo> <image> <tag>
# If args are omitted, environment variables are used: SRC_REPO, DST_REPO, IMAGE, TAG

SRC_REPO="${1:-${SRC_REPO:-dev-docker-local}}"
DST_REPO="${2:-${DST_REPO:-prod-docker-local}}"
IMAGE="${3:-${IMAGE:-}}"
TAG="${4:-${TAG:-}}"

if [[ -z "${IMAGE}" || -z "${TAG}" ]]; then
  echo "ERROR: IMAGE and TAG are required. Usage: promotion.sh <src-repo> <dst-repo> <image> <tag>" >&2
  exit 2
fi

if ! command -v jf >/dev/null 2>&1; then
  echo "ERROR: 'jf' CLI not found in PATH. Install JFrog CLI and configure server/context." >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: 'jq' is required. Please install jq and retry." >&2
  exit 2
fi

echo "Source repo: ${SRC_REPO}"
echo "Target repo: ${DST_REPO}"
echo "Image: ${IMAGE}:${TAG}"

ACCEPT_LIST="application/vnd.docker.distribution.manifest.list.v2+json"
ACCEPT_MAN="application/vnd.docker.distribution.manifest.v2+json"
ACCEPT_LIST_OCI="application/vnd.oci.image.index.v1+json"
ACCEPT_MAN_OCI="application/vnd.oci.image.manifest.v1+json"

SPEC_FILE="$(mktemp)"
echo '{"files":[]}' > "${SPEC_FILE}"

add_cp_entry() {
  local pattern="$1" target="$2"
  jq --arg p "$pattern" --arg t "$target" '.files += [{"pattern":$p,"target":$t,"flat":"true"}]' -c "${SPEC_FILE}" > "${SPEC_FILE}.tmp" && mv "${SPEC_FILE}.tmp" "${SPEC_FILE}"
}

# Note: we avoid AQL to reduce risk of syntax/permission issues; paths are deterministic

echo "Fetching manifest for ${IMAGE}:${TAG} from ${SRC_REPO}"
M="$(jf rt curl -H "Accept: ${ACCEPT_LIST}, ${ACCEPT_MAN}, ${ACCEPT_LIST_OCI}, ${ACCEPT_MAN_OCI}" "/api/docker/${SRC_REPO}/v2/${IMAGE}/manifests/${TAG}")"
MT="$(echo "${M}" | jq -r '.mediaType // empty')"

# Always copy the tag reference list manifest (OCI index) by storage path
add_cp_entry "${SRC_REPO}/${IMAGE}/${TAG}/list.manifest.json" "${DST_REPO}/${IMAGE}/${TAG}/"

copy_manifest_and_blobs() {
  local manifest_json="$1"
  local digest_ref="${2:-}"
  if [[ -n "${digest_ref}" ]]; then
    # Copy platform manifest.json by digest storage path
    digest_noalg="${digest_ref#sha256:}"
    add_cp_entry "${SRC_REPO}/${IMAGE}/sha256:${digest_noalg}/manifest.json" "${DST_REPO}/${IMAGE}/sha256:${digest_noalg}/"
  fi
  # Copy config + layers files under the platform manifest digest directory
  echo "${manifest_json}" | jq -r '.config.digest, .layers[].digest' | while read -r dg; do
    [[ -z "${dg}" ]] && continue
    nd="${dg#sha256:}"
    if [[ -n "${digest_ref}" ]]; then
      digest_noalg="${digest_ref#sha256:}"
      add_cp_entry "${SRC_REPO}/${IMAGE}/sha256:${digest_noalg}/sha256__${nd}" "${DST_REPO}/${IMAGE}/sha256:${digest_noalg}/"
    else
      # If digest_ref unknown (single-arch case), copy by checksum from all known platform dirs
      # This is a best-effort fallback and may copy duplicates.
      add_cp_entry "${SRC_REPO}/${IMAGE}/sha256:*/sha256__${nd}" "${DST_REPO}/${IMAGE}/" || true
    fi
  done
}

if [[ "${MT}" == "${ACCEPT_LIST}" || "${MT}" == "${ACCEPT_LIST_OCI}" ]]; then
  echo "Multi-arch manifest list detected"
  echo "${M}" | jq -r '.manifests[].digest' | while read -r pd; do
    [[ -z "${pd}" ]] && continue
    PM="$(jf rt curl -H "Accept: ${ACCEPT_MAN}, ${ACCEPT_MAN_OCI}" "/api/docker/${SRC_REPO}/v2/${IMAGE}/manifests/${pd}")"
    copy_manifest_and_blobs "${PM}" "${pd}"
  done
else
  echo "Single-arch manifest detected"
  # We don't know the platform manifest digest here; attempt to locate by sha sum of manifest.json via search
  # Fallback: copy only layers/config will be handled by copy_manifest_and_blobs with empty digest_ref
  copy_manifest_and_blobs "${M}"
fi

echo "Generated File Spec:"
cat "${SPEC_FILE}"

echo "Running jf rt cp with generated spec"
jf rt cp --spec "${SPEC_FILE}"

echo "Promotion completed for ${IMAGE}:${TAG} from ${SRC_REPO} to ${DST_REPO}"

