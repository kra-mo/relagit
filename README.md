[![CI](https://github.com/relagit/relagit/actions/workflows/ci.yml/badge.svg)](https://github.com/relagit/relagit/actions/workflows/ci.yml)
[![Release](https://github.com/relagit/relagit/actions/workflows/release.yml/badge.svg)](https://github.com/relagit/relagit/actions/workflows/release.yml)

> [!NOTE]
> RelaGit is far from stable, take caution when using it for production projects.

<div align="center">
	<picture>
	  <source media="(prefers-color-scheme: dark)" srcset="https://rela.dev/assets/projects/client-dark.png">
	  <source media="(prefers-color-scheme: light)" srcset="https://rela.dev/assets/projects/client-light.png">
	  <img alt="RelaGit client" src="https://rela.dev/assets/projects/client-dark.png#">
	</picture>
</div>

# relagit

A next-generation git client. Enables you to take back control over your git workflow.

## Download

Builds are generated automatically upon [release](https://github.com/relagit/relagit/releases).

-   [macOS (Intel)](https://github.com/relagit/relagit/releases/latest/download/RelaGit-mac-x64.dmg)
-   [macOS (Apple Silicon)](https://github.com/relagit/relagit/releases/latest/download/RelaGit-mac-arm64.dmg)
-   [Windows](https://github.com/relagit/relagit/releases/latest/download/RelaGit-win.zip)
-   [Linux (rpm)](https://github.com/relagit/relagit/releases/latest/download/RelaGit-linux.rpm)
-   [Linux (tar.gz)](https://github.com/relagit/relagit/releases/latest/download/RelaGit-linux.tar.gz)
-   [Linux (deb)](https://github.com/relagit/relagit/releases/latest/download/RelaGit-linux.deb)

## Roadmap

Before we hit the first stable release, the following features should be implemented:
- Optimisation of git processes and operations, currently there is noticable CPU strain on startup.
- Support for git submodules.
- Commit graph in information modal.

## Building

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or higher)
-   [pnpm](https://pnpm.io/)
-   [Git](https://git-scm.com/)

### Instructions

```bash
git clone https://github.com/relagit/relagit relagit

cd relagit

pnpm i
pnpm build
pnpm make:{platform}
```

Replace `platform` with one of the [supported platforms](https://github.com/relagit/relagit/blob/main/package.json#L19-L21) (e.g. `make:mac`).

You will find an executable in the `out` folder.
