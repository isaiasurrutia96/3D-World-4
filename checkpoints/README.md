# Avatar checkpoints

| Checkpoint | Permanent Git tag | Saved version |
| --- | --- | --- |
| 1 | `avatar-approved-2026-11-17` | Original approved clay avatar, saved under `avatar/` with its own `APPROVED.json`. |
| 2 — current | `avatar-checkpoint-2-2026-11-17` | Complete assembled avatar with fitted feet/calf sockets, rigid calf motion, and hand/foot controls including Fingers Together playback. |

[Open checkpoint 2](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/avatar-2/).

Each checkpoint tag preserves the editable source and dependencies. Checkpoint 2 also includes a self-contained frozen viewer and SHA-256 manifest. The normal build verifies and copies saved viewers to the published site without rebuilding them from later avatar edits.

To resume a saved version, create a new branch or worktree from its tag. Keep the existing tags and frozen files unchanged; save later approvals as new checkpoints.

# Island checkpoints

| Checkpoint | Permanent Git tag | Saved version |
| --- | --- | --- |
| 1 — current | `island-checkpoint-1-2026-11-17` | 14 × 14 floating island with raised tree corner, tree with root stumps, pond, bush, rock and flowers. |

[Open island checkpoint 1](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/island-1/).

# Test Lab checkpoints

| Checkpoint | Permanent Git tag | Saved version |
| --- | --- | --- |
| 1 — current | `test-lab-checkpoint-1-2026-11-17` | Approved universal Test Lab: responsive layout, off-white toolbar, orbitable wide Iso, original-size solid grey slabs, Inspection, docked Motion with pose toggles and reset on exit, and animation videos. |

[Open Test Lab checkpoint 1](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/test-lab-1/).

This is a frozen copy of the lab, all nine embedded tests, their runtime assets and the selected videos. Its relative links stay inside the checkpoint. The build checks every saved file against `files_sha256` before publishing. The Git tag preserves editable sources and dependencies. Continue new work in `/test-lab/`; keep this archive and tag unchanged.
