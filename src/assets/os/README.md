# OS logos

Drop a distro logo here and the VPS Subscribe wizard's Operating System
picker uses it instead of the Remixicon glyph / colored initial.

Name the file after the family in `VPS_OS_FAMILIES` (case doesn't
matter), any of `.svg` `.png` `.jpg` `.webp`:

```
ubuntu.svg
centos.svg
debian.svg
fedora.svg
almalinux.svg
```

They're picked up by `import.meta.glob` in `src/pages/SubscribePage.tsx`,
so no code change is needed — add the file, and it shows up. A missing
file just falls back to the current icon, so a partial set is fine.

Square artwork on a transparent background works best: it renders at
40×40 inside a 48px circle.
