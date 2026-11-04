# DSH 0.2.1-rc.5 local compatibility build

Upstream: https://github.com/HunYiSage/dsh-purge

Base: v1.1.90, commit 217d60d3d61881079ea95bbe2c174f338a02182b.
Local version: 1.1.90+rc5.3. This is a local derivative, not an upstream release.
Retain the upstream LICENSE, NOTICE and attribution.

Upstream 1.1.88 already added rc.2/rc.5 patch patterns and host-version detection.
The v1.1.90 README predates those changes. This build corrects the English and
Chinese compatibility statements and selects rc.5 as the primary host target,
while retaining rc.2 in dshTargets.

The additional code change makes desktop diagnostic patches #92 and #93 skip
already-marked files. Repeated Apply previously duplicated exit listeners,
logging code and heartbeat timers in the desktop main process.

Initial validation used an isolated copy of Windows DSH 0.2.1-rc.5 files:
patch status, JavaScript syntax, repeated Apply and byte-for-byte restoration.
Subsequent desktop testing exposed a restart handoff failure: rc.5 has no
desktopRuntime restart service, and the plugin exited its Host on a timer
without establishing completion of the detached restart helper.

The Windows fallback now delegates a hidden helper through Windows Shell,
removes that timer-based Host exit and handles both sealed and already-expanded
installations. A regression test verifies that the helper survives its initiating
process and preserves paths containing spaces, Chinese and apostrophes.

Both the first archive transition and a subsequent real desktop restart passed.
The desktop reopened normally with no new host crash log. The resulting host
reported 78 applied, 6 not applicable, 1 optional missing component and 1 skipped
patch; no pending, drifted or unmatched patches. All 47 target JavaScript files
passed syntax checks. Three regression tests passed on Windows.

Model responses and arbitrary third-party plugin combinations remain untested.
rc.2 remains an upstream-declared target and was not independently tested here.

Install this complete package into the chosen profile; keep autoApplyOnStart
and autoUpdateOnStart disabled until that host has been verified. Before using
Apply, back up app.asar, runtime CLI launchers, and the selected profile's
package.json, cordis files and lock/workspace files. Preserve local plugins.
Never restore an older whole-profile snapshot over later user changes without
reviewing the differences.
